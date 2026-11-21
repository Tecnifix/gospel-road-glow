import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { createDeviceIdentity, verifyDeviceIdentity, signLicense, verifyLicense, encodeBytes, decodeBytes, type LicensePayload } from '@/lib/licenses';
import { requireIssuerRole } from '@/lib/license-permissions';

beforeAll(() => { vi.stubGlobal('crypto', webcrypto); });
afterAll(() => { vi.unstubAllGlobals(); });

async function fixture() {
  const signer = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const device = await createDeviceIdentity();
  const payload: LicensePayload = { version: 1, product: 'adoradrive', deviceId: device.id, licenseId: 'fd9c0837-3f3f-4faf-a1c6-34d35484a8a9', keyId: 'bb07e1f8-524b-4ba9-81cc-2b6cbb16b6c1', issuedAt: '2026-11-21T23:31:00.000Z' };
  const code = await signLicense(payload, signer.privateKey);
  const keys = [{ id: payload.keyId, jwk: await crypto.subtle.exportKey('jwk', signer.publicKey) }];
  return { device, payload, code, keys };
}
describe('Offline device licenses', () => {
  it('validates an issued license locally without any network request', async () => {
    const { device, payload, code, keys } = await fixture();
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
    expect(await verifyLicense(code, device.id, keys)).toEqual(payload);
    expect(network).not.toHaveBeenCalled();
    network.mockRestore();
  });
  it('rejects the same license on another installation', async () => {
    const { code, keys } = await fixture();
    const neighbor = await createDeviceIdentity();
    await expect(verifyLicense(code, neighbor.id, keys)).rejects.toThrow('outra instalação');
  });
  it('rejects a modified license even when its device ID is changed to match', async () => {
    const { code, keys, payload } = await fixture();
    const neighbor = await createDeviceIdentity();
    const signature = code.split('.')[2];
    if (!signature) throw new Error('Missing fixture signature');
    const edited = encodeBytes(new TextEncoder().encode(JSON.stringify({ ...payload, deviceId: neighbor.id })));
    await expect(verifyLicense(`ADORA1.${edited}.${signature}`, neighbor.id, keys)).rejects.toThrow('inválido ou alterado');
  });
  it('rejects forged signatures from another signer', async () => {
    const { device, payload, keys } = await fixture();
    const attacker = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    await expect(verifyLicense(await signLicense(payload, attacker.privateKey), device.id, keys)).rejects.toThrow('inválido ou alterado');
  });
  it('requires a prepared verification key instead of trusting an activation flag', async () => {
    const { device, code } = await fixture();
    await expect(verifyLicense(code, device.id, [])).rejects.toThrow('Verificador não disponível');
  });
  it('keeps the device private key nonextractable and detects replaced IDs', async () => {
    const { device } = await fixture();
    expect(device.privateKey.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('pkcs8', device.privateKey)).rejects.toThrow();
    expect(await verifyDeviceIdentity(device)).toBe(true);
    expect(await verifyDeviceIdentity({ ...device, id: `DEV-${'0'.repeat(64)}` })).toBe(false);
  });
  it('survives copying the issued code and revalidates with no expiry field', async () => {
    const { device, payload, code, keys } = await fixture();
    const restored = JSON.parse(JSON.stringify({ code, keys })) as { code: string; keys: typeof keys };
    const verified = await verifyLicense(restored.code, device.id, restored.keys);
    expect(verified.licenseId).toBe(payload.licenseId);
    expect(verified).not.toHaveProperty('expiresAt');
  });
  it('rejects malformed codes rather than saving arbitrary text', async () => {
    await expect(verifyLicense('ADORA-79B1-K382', `DEV-${'A'.repeat(64)}`, [])).rejects.toThrow('inválido');
    expect(decodeBytes(encodeBytes(new Uint8Array([0, 255, 100])))).toEqual(new Uint8Array([0, 255, 100]));
  });
  it('only accepts a positive server role result without a lookup error for issuance', () => {
    expect(() => requireIssuerRole({ data: false, error: null })).toThrow('não está autorizada');
    expect(() => requireIssuerRole({ data: true, error: new Error('Lookup failed') })).toThrow('não está autorizada');
    expect(() => requireIssuerRole({ data: 'admin', error: null })).toThrow('não está autorizada');
    expect(() => requireIssuerRole({ data: true, error: null })).not.toThrow();
  });
});
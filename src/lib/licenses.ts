import { z } from 'zod';

export const deviceIdSchema = z.string().trim().toUpperCase().regex(/^DEV-[A-F0-9]{64}$/, 'Informe o ID completo exibido na central.');
export const licensePayloadSchema = z.object({
  version: z.literal(1), product: z.literal('adoradrive'),
  deviceId: deviceIdSchema, licenseId: z.string().uuid(), keyId: z.string().uuid(),
  issuedAt: z.string().datetime(),
}).strict();
export type LicensePayload = z.infer<typeof licensePayloadSchema>;
export type VerificationKey = { id: string; jwk: JsonWebKey };
const encoder = new TextEncoder();
export function encodeBytes(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Código inválido.');
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
}
export async function signLicense(payload: LicensePayload, privateKey: CryptoKey): Promise<string> {
  const body = encodeBytes(encoder.encode(JSON.stringify(licensePayloadSchema.parse(payload))));
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, encoder.encode(`ADORA1.${body}`));
  return `ADORA1.${body}.${encodeBytes(new Uint8Array(signature))}`;
}
export async function verifyLicense(code: string, deviceId: string, keys: VerificationKey[]): Promise<LicensePayload> {
  try {
    const parts = code.trim().split('.');
    const [prefix, body, signature] = parts;
    if (parts.length !== 3 || prefix !== 'ADORA1' || !body || !signature || code.length > 4096) throw new Error();
    const payload = licensePayloadSchema.parse(JSON.parse(new TextDecoder().decode(decodeBytes(body))));
    const entry = keys.find(key => key.id === payload.keyId);
    if (!entry) throw new Error('Verificador não disponível. Prepare esta instalação com internet antes da ativação offline.');
    const key = await crypto.subtle.importKey('jwk', entry.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, decodeBytes(signature), encoder.encode(`ADORA1.${body}`));
    if (!valid) throw new Error();
    if (payload.deviceId !== deviceId) throw new Error('Esta licença pertence a outra instalação. Envie o ID desta central para receber a chave correspondente.');
    return payload;
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('Esta licença') || error.message.startsWith('Verificador'))) throw error;
    throw new Error('Código inválido ou alterado. Confira a chave recebida.');
  }
}
export type DeviceIdentity = { privateKey: CryptoKey; publicKey: CryptoKey; id: string };
export async function createDeviceIdentity(): Promise<DeviceIdentity> {
  // The private key is nonextractable and persists only in this browser installation.
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
  const exported = await crypto.subtle.exportKey('raw', pair.publicKey);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', exported));
  const id = `DEV-${Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  return { privateKey: pair.privateKey, publicKey: pair.publicKey, id };
}
export async function verifyDeviceIdentity(device: DeviceIdentity): Promise<boolean> {
  const exported = await crypto.subtle.exportKey('raw', device.publicKey);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', exported));
  const expected = `DEV-${Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  if (device.id !== expected || device.privateKey.extractable) return false;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const signed = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, device.privateKey, challenge);
  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, device.publicKey, signed, challenge);
}
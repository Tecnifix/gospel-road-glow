import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { decodeBytes, encodeBytes, signLicense, type LicensePayload } from './licenses';
import type { Json } from '@/integrations/supabase/types';

const SIGNING_KEY_ID = 'bb07e1f8-524b-4ba9-81cc-2b6cbb16b6c1';
async function encryptionKey(): Promise<CryptoKey> {
  const secret = process.env['LICENSE_KEY_ENCRYPTION_SECRET'];
  if (!secret) throw new Error('A proteção do emissor ainda não foi configurada.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function signingKey(): Promise<CryptoKey> {
  const wrappingKey = await encryptionKey();
  let result = await supabaseAdmin.from('license_signing_keys').select('*').eq('key_id', SIGNING_KEY_ID).maybeSingle();
  if (result.error) throw new Error('Não foi possível carregar o emissor.');
  if (!result.data) {
    // Asymmetric key generation uses the runtime's cryptographic key-pair generator.
    // Only encrypted PKCS8 is persisted; neither plaintext nor the encryption secret leaves this handler.
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const privateBytes = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, privateBytes);
    const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const installed = await supabaseAdmin.rpc('install_license_signing_key', {
      p_key_id: SIGNING_KEY_ID, p_public_jwk: publicJwk as Json,
      p_encrypted: encodeBytes(new Uint8Array(encrypted)), p_iv: encodeBytes(iv),
    });
    if (installed.error) throw new Error('Não foi possível preparar o emissor.');
    result = await supabaseAdmin.from('license_signing_keys').select('*').eq('key_id', SIGNING_KEY_ID).single();
  }
  if (result.error || !result.data) throw new Error('Emissor indisponível.');
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decodeBytes(result.data.encryption_iv) }, wrappingKey, decodeBytes(result.data.encrypted_private_key));
  return crypto.subtle.importKey('pkcs8', bytes, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}
export async function issueLicense(deviceId: string, userId: string) {
  const existing = await supabaseAdmin.from('device_licenses').select('activation_code').eq('device_id', deviceId).maybeSingle();
  if (existing.error) throw new Error('Não foi possível consultar esta instalação.');
  if (existing.data) return { code: existing.data.activation_code, reused: true };
  const key = await signingKey();
  const payload: LicensePayload = { version: 1, product: 'adoradrive', deviceId, licenseId: crypto.randomUUID(), keyId: SIGNING_KEY_ID, issuedAt: new Date().toISOString() };
  const code = await signLicense(payload, key);
  const saved = await supabaseAdmin.from('device_licenses').insert({ id: payload.licenseId, device_id: deviceId, issued_by: userId, key_id: SIGNING_KEY_ID, payload, activation_code: code });
  if (saved.error) {
    // The unique device constraint resolves simultaneous duplicate issuance without replacing a sale.
    const duplicate = await supabaseAdmin.from('device_licenses').select('activation_code').eq('device_id', deviceId).maybeSingle();
    if (!duplicate.error && duplicate.data) return { code: duplicate.data.activation_code, reused: true };
    throw new Error('A licença não foi salva; tente novamente.');
  }
  return { code, reused: false };
}
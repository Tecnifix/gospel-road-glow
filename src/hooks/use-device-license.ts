import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { verifyLicense, type DeviceIdentity, type LicensePayload, type VerificationKey } from '@/lib/licenses';
import { getDeviceIdentity, cachedVerificationKeys, readLicenseValue, writeLicenseValue } from '@/lib/license-storage';

export function useDeviceLicense() {
  const [device, setDevice] = useState<DeviceIdentity | null>(null);
  const [license, setLicense] = useState<LicensePayload | null>(null);
  const [keys, setKeys] = useState<VerificationKey[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let alive = true;
    const initialize = async () => {
      try {
        const identity = await getDeviceIdentity();
        let verificationKeys = await cachedVerificationKeys();
        if (navigator.onLine) {
          try {
            const { data, error } = await supabase.from('license_verification_keys').select('id, public_jwk');
            if (!error && data?.length) {
              verificationKeys = data.map(row => ({ id: row.id, jwk: row.public_jwk as JsonWebKey }));
              await writeLicenseValue('verification-keys', verificationKeys);
            }
          } catch { /* An already prepared installation can validate offline. */ }
        }
        const saved = await readLicenseValue<string>('activation-code');
        let verified: LicensePayload | null = null;
        if (saved) {
          try { verified = await verifyLicense(saved, identity.id, verificationKeys); }
          catch (error) { if (alive) setMessage(error instanceof Error ? error.message : 'A licença salva não é válida.'); }
        }
        if (alive) { setDevice(identity); setKeys(verificationKeys); setLicense(verified); }
      } catch (error) {
        if (alive) setMessage(error instanceof Error ? error.message : 'Não foi possível preparar a instalação.');
      } finally { if (alive) setReady(true); }
    };
    void initialize();
    return () => { alive = false; };
  }, []);
  const activate = async (code: string) => {
    if (!device) throw new Error('A identificação da instalação não está disponível.');
    const verified = await verifyLicense(code, device.id, keys);
    await writeLicenseValue('activation-code', code.trim());
    setLicense(verified);
    setMessage('Licença validada e salva nesta instalação. A conferência da chave funciona sem internet.');
  };
  return { deviceId: device?.id ?? '', license, ready, verifierReady: keys.length > 0, message, setMessage, activate };
}
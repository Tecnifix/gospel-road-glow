import { createDeviceIdentity, verifyDeviceIdentity, type DeviceIdentity, type VerificationKey } from './licenses';

const STORE = 'installation';
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('adora-license', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Não foi possível guardar os dados desta instalação.'));
  });
}
export async function readLicenseValue<T>(key: string): Promise<T | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => { db.close(); resolve(request.result as T | undefined); };
    request.onerror = () => { db.close(); reject(new Error('Não foi possível ler os dados da instalação.')); };
  });
}
export async function writeLicenseValue(key: string, value: unknown): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(new Error('Não foi possível salvar. Confira o armazenamento da central.')); };
    tx.onabort = () => { db.close(); reject(new Error('O salvamento foi interrompido.')); };
  });
}
let identityPromise: Promise<DeviceIdentity> | undefined;
export function getDeviceIdentity(): Promise<DeviceIdentity> {
  identityPromise ??= (async () => {
    const saved = await readLicenseValue<DeviceIdentity>('device');
    if (saved) {
      if (!await verifyDeviceIdentity(saved)) throw new Error('Identidade da instalação inválida. Não foi possível ativar.');
      return saved;
    }
    const device = await createDeviceIdentity();
    // Recheck under one write transaction so two tabs cannot replace each other's identity.
    const db = await database();
    const installed = await new Promise<DeviceIdentity>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const request = store.get('device');
      let selected = device;
      request.onsuccess = () => {
        if (request.result) selected = request.result as DeviceIdentity;
        else store.put(device, 'device');
      };
      tx.oncomplete = () => { db.close(); resolve(selected); };
      tx.onerror = () => { db.close(); reject(new Error('Não foi possível guardar a identidade.')); };
      tx.onabort = () => { db.close(); reject(new Error('O salvamento da identidade foi interrompido.')); };
    });
    if (!await verifyDeviceIdentity(installed)) throw new Error('Identidade da instalação inválida.');
    return installed;
  })().catch(error => { identityPromise = undefined; throw error; });
  return identityPromise;
}
export async function cachedVerificationKeys(): Promise<VerificationKey[]> {
  return await readLicenseValue<VerificationKey[]>('verification-keys') ?? [];
}
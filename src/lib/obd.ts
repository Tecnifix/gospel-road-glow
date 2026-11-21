// ELM327 USB: unsupported data is not a vehicle fault; transport failures never become demo results.
type SerialPortLike = { open(o: { baudRate: number }): Promise<void>; close(): Promise<void>; readable: ReadableStream<Uint8Array> | null; writable: WritableStream<Uint8Array> | null };
export type ScanItem = { key: string; label: string; value: string; status: 'ok' | 'warn' | 'bad' | 'unavailable' };
export const hasUsbSerial = () => typeof navigator !== 'undefined' && 'serial' in navigator;
export function checkAbort(signal?: AbortSignal) { if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError'); }
export class ObdConnectionError extends Error {}
export function parseDtcResponse(response: string): string[] | null {
 const text = response.replace(/\s/g, '').toUpperCase();
 if (/NODATA|\?/.test(text)) return null;
 const start = text.indexOf('43');
 if (start < 0) throw new ObdConnectionError('Resposta inválida ao consultar os códigos.');
 const data = text.slice(start + 2);
 if (!/^[0-9A-F]+$/.test(data) || data.length < 4) throw new ObdConnectionError('Resposta incompleta dos códigos.');
 const codes: string[] = [];
 for (let k = 0; k + 3 < data.length; k += 4) {
  const value = data.slice(k, k + 4);
  if (value === '0000') continue;
  const firstChar = value[0];
  if (!firstChar) continue;
  const first = parseInt(firstChar, 16);
  const family = 'PCBU'[first >> 2];
  if (family) codes.push(family + (first & 3) + value.slice(1));
 }
 return [...new Set(codes)];
}
export class Elm327 {
 private port: SerialPortLike | null = null;
 private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
 private dec = new TextDecoder();
 private signal: AbortSignal | undefined;
 private abortRead = () => { void this.reader?.cancel().catch(() => {}); };
 async connect(signal?: AbortSignal) {
  this.signal = signal; checkAbort(signal);
  if (!hasUsbSerial()) throw new ObdConnectionError('Leitura USB indisponível neste navegador. Use Chrome em um aparelho compatível.');
  const serial = (navigator as unknown as { serial: { requestPort(): Promise<SerialPortLike> } }).serial;
  this.port = await serial.requestPort(); checkAbort(signal);
  await this.port.open({ baudRate: 38400 }); checkAbort(signal);
  if (!this.port.readable || !this.port.writable) throw new ObdConnectionError('Adaptador sem canal de leitura.');
  this.reader = this.port.readable.getReader();
  signal?.addEventListener('abort', this.abortRead, { once: true });
  for (const c of ['ATZ','ATE0','ATL0','ATS0','ATH0','ATSP0']) await this.cmd(c);
 }
 async cmd(c: string, timeout = 4000): Promise<string> {
  checkAbort(this.signal);
  if (!this.port?.writable || !this.reader) throw new ObdConnectionError('Adaptador desconectado.');
  const writer = this.port.writable.getWriter();
  try { await writer.write(new TextEncoder().encode(c + '\r')); } finally { writer.releaseLock(); }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const reader = this.reader;
  const reading = async () => {
   let out = '';
   while (!out.includes('>')) {
    const result = await reader.read(); checkAbort(this.signal);
    if (result.done) throw new ObdConnectionError('Conexão USB interrompida.');
    out += this.dec.decode(result.value);
   }
   const text = out.replace(/[>\r]/g,' ').replace(/SEARCHING\.\.\./g,'').trim().toUpperCase();
   if (/UNABLE TO CONNECT|BUS ERROR|CAN ERROR|STOPPED|ERROR/.test(text)) throw new ObdConnectionError('O adaptador não conseguiu comunicar com o veículo. Confira o cabo e a ignição.');
   return text;
  };
  try {
   return await Promise.race([reading(), new Promise<never>((_,reject) => { timer = setTimeout(() => { reject(new ObdConnectionError('O veículo não respondeu a tempo. Confira a conexão e tente novamente.')); void reader.cancel().catch(() => {}); },timeout); })]);
  } finally { if (timer) clearTimeout(timer); }
 }
 async pid(p: string): Promise<number[] | null> {
  const response = (await this.cmd('01' + p)).replace(/\s/g,'');
  if (/NODATA|\?/.test(response)) return null;
  const index = response.indexOf('41' + p);
  if (index < 0) throw new ObdConnectionError('Resposta inválida do veículo.');
  const hex = response.slice(index + 4); const bytes: number[] = [];
  for (let k=0; k+1<hex.length && bytes.length<4; k+=2) { const byte = hex.slice(k,k+2); if (!/^[0-9A-F]{2}$/.test(byte)) throw new ObdConnectionError('Resposta de dados inválida.'); bytes.push(parseInt(byte,16)); }
  if (!bytes.length) throw new ObdConnectionError('Resposta de dados incompleta.');
  return bytes;
 }
 async dtcs() { return parseDtcResponse(await this.cmd('03',6000)); }
 async close() {
  this.signal?.removeEventListener('abort', this.abortRead);
  try { await this.reader?.cancel(); } catch { /* Already disconnected. */ }
  try { this.reader?.releaseLock(); } catch { /* Reader already released. */ }
  this.reader = null;
  try { await this.port?.close(); } catch { /* Port already disconnected. */ }
  this.port = null;
 }
}
const unavailable = (key: string, label: string): ScanItem => ({key,label,value:'Não disponível',status:'unavailable'});
export async function realScan(elm: Elm327, onStep: (i:number)=>void, signal?: AbortSignal): Promise<ScanItem[]> {
 const items: ScanItem[] = [];
 checkAbort(signal); onStep(1); const temp = (await elm.pid('05'))?.[0]; checkAbort(signal);
 items.push(temp === undefined ? unavailable('motor','Temperatura do motor') : {key:'motor',label:'Temperatura do motor',value:`${temp-40} °C`,status:temp-40>105?'bad':'ok'});
 onStep(2); const oil = (await elm.pid('5C'))?.[0]; checkAbort(signal);
 items.push(oil === undefined ? unavailable('oleo','Temperatura do óleo') : {key:'oleo',label:'Temperatura do óleo',value:`${oil-40} °C`,status:oil-40>120?'bad':'ok'});
 onStep(3); const volts = parseFloat(await elm.cmd('ATRV')); checkAbort(signal);
 items.push(Number.isFinite(volts) ? {key:'bateria',label:'Bateria',value:`${volts.toFixed(1)} V`,status:volts<12.2?'warn':'ok'} : unavailable('bateria','Bateria'));
 onStep(4); const fuel = (await elm.pid('2F'))?.[0]; checkAbort(signal);
 items.push(fuel === undefined ? unavailable('comb','Combustível') : {key:'comb',label:'Combustível',value:`${Math.round(fuel*100/255)} %`,status:fuel<25?'warn':'ok'});
 onStep(5); const codes = await elm.dtcs(); checkAbort(signal);
 items.push(codes === null ? unavailable('falhas','Códigos de falha') : {key:'falhas',label:'Códigos de falha',value:codes.length?codes.join(', '):'Nenhuma falha',status:codes.length?'bad':'ok'});
 return items;
}
export async function scanDelay(ms:number, signal:AbortSignal) {
 checkAbort(signal);
 await new Promise<void>((resolve,reject) => {
  const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelado','AbortError')); };
  const timer = setTimeout(() => { signal.removeEventListener('abort',abort); resolve(); },ms);
  signal.addEventListener('abort',abort,{once:true});
 });
}
export function demoScan(): ScanItem[] {
 return [
  {key:'motor',label:'Temperatura do motor',value:'89 °C',status:'ok'},
  {key:'oleo',label:'Temperatura do óleo',value:'Não disponível',status:'unavailable'},
  {key:'bateria',label:'Bateria',value:'12.1 V',status:'warn'},
  {key:'comb',label:'Combustível',value:'68 %',status:'ok'},
  {key:'falhas',label:'Códigos de falha',value:'P0301',status:'bad'},
 ];
}

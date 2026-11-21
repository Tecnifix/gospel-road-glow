import { describe,it,expect,vi } from 'vitest';
import { demoScan, Elm327, parseDtcResponse, realScan, scanDelay } from '@/lib/obd';
import { compareItems, explainDtc, previousRecord, type ScanRecord } from '@/lib/scanner-results';
describe('Scanner readings',()=>{
 it('decodes P0301 and distinguishes unavailable code reads from a clear read',()=>{
  expect(parseDtcResponse('43 03 01 00 00')).toEqual(['P0301']);
  expect(parseDtcResponse('43 00 00 00 00')).toEqual([]);
  expect(parseDtcResponse('NO DATA')).toBeNull();
  expect(()=>parseDtcResponse('UNABLE TO CONNECT')).toThrow();
 });
 it('has a known description and uses a safe fallback for unknown manufacturer codes',()=>{
  expect(explainDtc('P0301')).not.toEqual(explainDtc('P1999'));
  expect(explainDtc('P1999')).toEqual(explainDtc('B9999'));
 });
 it('does not turn unsupported oil or codes into faults or all-clear',async()=>{
  const elm=new Elm327();
  vi.spyOn(elm,'pid').mockResolvedValue(null);vi.spyOn(elm,'cmd').mockResolvedValue('12.1V');vi.spyOn(elm,'dtcs').mockResolvedValue(null);
  const result=await realScan(elm,()=>{});
  expect(result.find(r=>r.key==='oleo')?.status).toBe('unavailable');
  expect(result.find(r=>r.key==='falhas')?.status).toBe('unavailable');
  expect(result.find(r=>r.key==='bateria')?.status).toBe('warn');
 });
 it('propagates transport errors instead of inventing results',async()=>{
  const elm=new Elm327();vi.spyOn(elm,'pid').mockRejectedValue(new Error('Disconnected'));
  await expect(realScan(elm,()=>{})).rejects.toThrow('Disconnected');
 });
 it('aborts scan delays immediately',async()=>{
  const controller=new AbortController();const waiting=scanDelay(60_000,controller.signal);controller.abort();
  await expect(waiting).rejects.toMatchObject({name:'AbortError'});
 });
 it('does not query a vehicle after cancellation',async()=>{
  const elm=new Elm327();const pid=vi.spyOn(elm,'pid');const controller=new AbortController();controller.abort();
  await expect(realScan(elm,()=>{},controller.signal)).rejects.toMatchObject({name:'AbortError'});expect(pid).not.toHaveBeenCalled();
 });
 it('compares only the same vehicle and source',()=>{
  const record:ScanRecord={id:'current',vehicle:'Carro A',mode:'usb',items:demoScan(),created_at:'2026-11-21T12:00:00Z'};
  const older:ScanRecord={...record,id:'older',created_at:'2026-11-20T12:00:00Z'};
  const records:ScanRecord[]=[{...older,id:'demo',mode:'demo'}, {...older,id:'other',vehicle:'Carro B'},older];
  expect(previousRecord(record,records)?.id).toBe('older');
  expect(previousRecord(record,records.slice(0,2))).toBeUndefined();
 });
 it('flags changed values but never compares unavailable data',()=>{
  const old=demoScan();const next=old.map(i=>i.key==='bateria'?{...i,value:'12.7 V',status:'ok' as const}:i);
  const diff=compareItems(next,old);
  expect(diff.find(i=>i.key==='bateria')?.changed).toBe(true);
  expect(diff.find(i=>i.key==='motor')?.changed).toBe(false);
  expect(diff.find(i=>i.key==='oleo')?.comparable).toBe(false);
 });
});

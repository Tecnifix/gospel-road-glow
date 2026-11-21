import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { Scanner } from '@/components/Scanner';
import { Elm327 } from '@/lib/obd';
const {add}=vi.hoisted(()=>({add:vi.fn().mockResolvedValue(undefined)}));
vi.mock('@/hooks/use-scan-history',()=>({useScanHistory:()=>({user:null,records:[],savedIds:new Set(),add,save:vi.fn(),remove:vi.fn(),saving:false,error:'',loading:false,reload:vi.fn()})}));
vi.mock('@/components/ScannerAccount',()=>({ScannerAccount:()=>null}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{signOut:vi.fn()}}}));
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();add.mockClear();});
describe('Scanner lifecycle',()=>{
 it('cancelled demo never saves partial results',async()=>{
  vi.useFakeTimers();render(<Scanner/>);fireEvent.click(screen.getByRole('button',{name:'Escanear (demonstração)'}));
  fireEvent.click(screen.getByRole('button',{name:'Cancelar varredura'}));
  await act(async()=>{await vi.runAllTimersAsync();});expect(add).not.toHaveBeenCalled();
 });
 it('a USB error never starts or saves demo data',async()=>{
  vi.useFakeTimers();vi.spyOn(Elm327.prototype,'connect').mockRejectedValue(new Error('Connection failed'));
  render(<Scanner/>);fireEvent.click(screen.getByRole('button',{name:'Escanear via USB'}));
  await act(async()=>{await vi.runAllTimersAsync();});expect(add).not.toHaveBeenCalled();
 });
 it('a completed demo saves a record explicitly marked demo with all five systems',async()=>{
  vi.useFakeTimers();render(<Scanner/>);fireEvent.click(screen.getByRole('button',{name:'Escanear (demonstração)'}));
  await act(async()=>{await vi.runAllTimersAsync();});
  expect(add).toHaveBeenCalledOnce();expect(add.mock.calls[0]?.[0]).toMatchObject({mode:'demo',vehicle:'Meu veículo'});
  expect(add.mock.calls[0]?.[0].items).toHaveLength(5);
 });
});

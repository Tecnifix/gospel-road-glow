import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { scanItemsSchema, type ScanRecord } from '@/lib/scanner-results';

let sessionRecords: ScanRecord[] = [];
export function useScanHistory() {
 const [user,setUser] = useState<User | null>(null);
 const [local,setLocal] = useState(sessionRecords);
 const [error,setError] = useState('');
 const [saving,setSaving] = useState(false);
 const client = useQueryClient();
 useEffect(() => {
  let active = true;
  void supabase.auth.getSession().then(({data}) => { if (active) setUser(data.session?.user ?? null); });
  const { data } = supabase.auth.onAuthStateChange((_event,session) => { if (active) { setUser(session?.user ?? null); setError(''); } });
  return () => { active=false; data.subscription.unsubscribe(); };
 },[]);
 const query = useQuery({
  queryKey:['scanner-history',user?.id], enabled:!!user,
  queryFn:async ():Promise<ScanRecord[]> => {
   const {data,error} = await supabase.from('scanner_history').select('id,vehicle,mode,items,created_at').order('created_at',{ascending:false}).limit(100);
   if (error) throw error;
   return (data ?? []).map(row => ({...row,mode: row.mode === 'usb' ? 'usb' : 'demo',items:scanItemsSchema.parse(row.items)}));
  },
 });
 const savedIds = new Set(query.data?.map(r=>r.id) ?? []);
 const records = [...(query.data ?? []),...local.filter(r=>!savedIds.has(r.id))].sort((a,b)=>b.created_at.localeCompare(a.created_at));
 const save = async (record:ScanRecord) => {
  setError('');
  const { data } = await supabase.auth.getUser();
  if (!data.user) { setError('Entre na sua conta para guardar esta leitura no histórico privado.'); return false; }
  setSaving(true);
  try {
   const { error } = await supabase.from('scanner_history').insert({ ...record, user_id:data.user.id, items:scanItemsSchema.parse(record.items) });
   if (error && error.code !== '23505') throw error;
   await client.invalidateQueries({queryKey:['scanner-history',data.user.id]});
   sessionRecords = sessionRecords.filter(r=>r.id!==record.id); setLocal(sessionRecords);
   return true;
  } catch { setError('Não foi possível salvar. A leitura continua disponível nesta sessão; tente novamente.'); return false; }
  finally {setSaving(false);}
 };
 const add = async (record:ScanRecord) => {
  sessionRecords = [record,...sessionRecords]; setLocal(sessionRecords);
  if (user) await save(record);
 };
 const remove = async (id:string) => {
  setError('');
  if (savedIds.has(id)) {
   const {error} = await supabase.from('scanner_history').delete().eq('id',id);
   if(error) {setError('Não foi possível excluir a leitura. Tente novamente.'); return;}
   await client.invalidateQueries({queryKey:['scanner-history',user?.id]});
  }
  sessionRecords=sessionRecords.filter(r=>r.id!==id); setLocal(sessionRecords);
 };
 return {user,records,savedIds,add,save,remove,saving,error: error || (query.isError ? 'Não foi possível carregar o histórico. Tente novamente.' : ''),loading:query.isLoading,reload:()=>query.refetch()};
}

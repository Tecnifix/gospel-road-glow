import { useEffect, useRef, useState } from 'react';
import { ScanLine, Usb, CheckCircle2, AlertTriangle, XCircle, Circle, LoaderCircle, Square, History, Save, Trash2, LogOut, RefreshCw, Info, ArrowLeft } from 'lucide-react';
import { ScannerVehicle } from '@/components/ScannerVehicle';
import { ScannerAccount } from '@/components/ScannerAccount';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useScanHistory } from '@/hooks/use-scan-history';
import { supabase } from '@/integrations/supabase/client';
import { Elm327, demoScan, hasUsbSerial, realScan, scanDelay, checkAbort, type ScanItem } from '@/lib/obd';
import { compareItems, explainDtc, itemExplanation, previousRecord, type ScanRecord } from '@/lib/scanner-results';

const STEPS = ['Conectando ao veículo','Motor','Óleo','Bateria','Combustível','Códigos de falha'];
const AREAS = ['', 'motor','oleo','bateria','comb','falhas'];
const ICONS = {ok:CheckCircle2,warn:AlertTriangle,bad:XCircle,unavailable:Info};
const COLORS = {ok:'text-primary',warn:'text-chart-4',bad:'text-destructive',unavailable:'text-muted-foreground'};
const LABELS = {ok:'Sem alerta nesta leitura',warn:'Atenção',bad:'Falha / alerta detectado',unavailable:'Dado indisponível'};
const dateLabel = (date:string)=>new Date(date).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'medium'});

export function Scanner() {
 const [state,setState]=useState<'idle'|'scanning'|'done'|'cancelled'|'error'>('idle');
 const [step,setStep]=useState(0);
 const [record,setRecord]=useState<ScanRecord | null>(null);
 const [view,setView]=useState<'scan'|'history'>('scan');
 const [vehicle,setVehicle]=useState('Meu veículo');
 const [focused,setFocused]=useState('');
 const [msg,setMsg]=useState('');
 const [mode,setMode]=useState<'usb'|'demo'>('demo');
 const active=useRef<AbortController | null>(null);
 const history=useScanHistory();
 useEffect(()=>()=>{active.current?.abort();},[]);
 const start = async (usb:boolean) => {
  if(active.current) return;
  const controller=new AbortController();active.current=controller;
  const elm=new Elm327();
  const selectedVehicle=vehicle.trim() || 'Meu veículo';
  setState('scanning');setStep(0);setRecord(null);setFocused('');setMsg('');setMode(usb?'usb':'demo');
  try {
   let items:ScanItem[];
   if(usb) {
    await elm.connect(controller.signal);
    items=await realScan(elm,i=>{if(!controller.signal.aborted)setStep(i);},controller.signal);
   } else {
    for(let i=0;i<STEPS.length;i++){setStep(i);await scanDelay(900,controller.signal);}
    items=demoScan();
   }
   checkAbort(controller.signal);
   const next:ScanRecord={id:crypto.randomUUID(),vehicle:selectedVehicle,mode:usb?'usb':'demo',items,created_at:new Date().toISOString()};
   setStep(STEPS.length);setRecord(next);setState('done');
   await history.add(next);
  } catch(error) {
   if(controller.signal.aborted) {setState('cancelled');setMsg('Varredura cancelada. Nenhum resultado parcial foi salvo.');}
   else {setState('error');setMsg(error instanceof Error && error.name==='NotFoundError'?'Nenhum adaptador selecionado. A leitura USB não foi iniciada.':error instanceof Error ? error.message : 'Erro de conexão. Confira o adaptador e tente novamente.');}
  } finally {await elm.close();if(active.current===controller)active.current=null;}
 };
 const scanning=state==='scanning';
 const pct=Math.round(step/STEPS.length*100);
 const items=record?.items ?? [];
 const alerts=items.filter(i=>i.status==='bad'||i.status==='warn').length;
 const unavailable=items.filter(i=>i.status==='unavailable').length;
 const prior=record?previousRecord(record,history.records):undefined;
 const area=scanning ? AREAS[step] ?? '' : focused;
 const areaItem=items.find(i=>i.key===area);
 const signedOut=async()=>{const {error}=await supabase.auth.signOut();if(error)setMsg('Não foi possível sair da conta. Tente novamente.');else {setRecord(null);setFocused('');setState('idle');}};

 return <div className="min-w-0 space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
   <div className="flex flex-wrap gap-2" role="tablist" aria-label="Scanner">
    <Button role="tab" aria-selected={view==='scan'} variant={view==='scan'?'default':'outline'} onClick={()=>setView('scan')}><ScanLine size={16}/>Diagnóstico</Button>
    <Button role="tab" aria-selected={view==='history'} variant={view==='history'?'default':'outline'} onClick={()=>setView('history')}><History size={16}/>Histórico ({history.records.length})</Button>
   </div>
   {history.user ? <div className="flex items-center gap-2 min-w-0"><span className="max-w-48 truncate text-sm text-muted-foreground">Histórico privado</span><Button variant="ghost" size="icon" aria-label="Sair da conta" title="Sair da conta" onClick={signedOut}><LogOut size={18}/></Button></div>:<ScannerAccount/>}
  </div>
  {history.error && <div role="alert" className="flex flex-wrap items-center gap-2 text-chart-4"><AlertTriangle size={16}/>{history.error}<Button variant="ghost" onClick={()=>history.reload()}><RefreshCw size={16}/>Tentar novamente</Button></div>}
  {view==='scan' ? <>
   <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
    <div className="min-w-0">
     <div className="relative aspect-video overflow-hidden" data-scan-state={state} data-scan-area={area} data-scan-severity={areaItem?.status ?? 'ok'}>
      <ScannerVehicle activeArea={area}/>
      <div className="absolute top-2 left-2 right-2 flex justify-between gap-2 sm:top-4 sm:left-4 sm:right-4 text-sm">
       <span className="flex items-center gap-2 rounded-md bg-background/80 px-3 py-2 text-primary"><ScanLine size={16}/><span>{scanning?'EM CURSO':state==='done'?'CONCLUÍDO':'SCANNER'}</span></span>
       <span className="rounded-md bg-background/80 px-3 py-2 font-display">{pct}%</span>
      </div>
      {area && <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-3 py-1 text-sm">Sistema consultado: {areaItem?.label ?? STEPS[step]}</span>}
     </div>
     <div className="py-3" role="status" aria-live="polite">
      {state==='idle' && <p className="text-lg text-muted-foreground">Veículo pronto para diagnóstico</p>}
      {scanning && <><p className="flex items-center gap-2 text-lg"><LoaderCircle size={18} className="animate-spin text-primary"/>{STEPS[Math.min(step,STEPS.length-1)]} · {mode==='demo'?'Demonstração':'USB'}</p><div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do diagnóstico" className="mt-2 h-2 rounded-full bg-accent overflow-hidden"><div className="h-full bg-primary transition-all duration-700" style={{width:`${pct}%`}}/></div></>}
      {state==='done' && <div className="space-y-1"><p className="text-xl font-bold">{alerts?`${alerts} alerta(s) nesta leitura`:'Nenhum alerta nos dados recebidos'}</p><p className="text-sm text-muted-foreground">{unavailable>0?`${unavailable} dado(s) indisponível(is) · `:''}{record?.mode==='demo'?'DEMONSTRAÇÃO · valores fictícios':'USB · dados recebidos do adaptador'}</p></div>}
      {(state==='error'||state==='cancelled') && <p className={state==='error'?'text-chart-4':'text-muted-foreground'}>{msg}</p>}
     </div>
    </div>
    <div className="min-w-0 flex flex-col gap-3">
     <label className="grid gap-1 text-sm">Veículo<Input value={vehicle} maxLength={80} disabled={scanning} onChange={e=>setVehicle(e.target.value)} placeholder="Nome do veículo" className="h-11 bg-background/60"/></label>
     <Button disabled={scanning} onClick={()=>start(true)} className="h-auto min-h-14 whitespace-normal py-4 text-lg"><Usb size={24}/>Escanear via USB</Button>
     <Button variant="outline" disabled={scanning} onClick={()=>start(false)} className="h-auto min-h-12 whitespace-normal py-3"><ScanLine size={20}/>Escanear (demonstração)</Button>
     {scanning && <Button variant="outline" onClick={()=>active.current?.abort()}><Square size={16}/>Cancelar varredura</Button>}
     <ol className="border-y py-2">{STEPS.map((label,i)=>{const complete=state==='done'||scanning&&i<step;const current=scanning&&i===step;const Icon=complete?CheckCircle2:current?LoaderCircle:Circle;return <li key={label} className={`flex items-center gap-3 py-1.5 text-sm ${complete||current?'text-primary':'text-muted-foreground'}`}><Icon size={16} className={current?'animate-spin':''}/>{label}</li>;})}</ol>
     {!hasUsbSerial() && <p className="text-sm text-muted-foreground">USB não disponível neste navegador. A demonstração é separada e usa dados fictícios.</p>}
     <p className="flex gap-2 text-sm text-muted-foreground"><Info size={16} className="shrink-0 mt-1"/>O Scanner OBD não verifica todos os sistemas, freios ou pneus. Não substitui uma inspeção mecânica. Faça a leitura estacionado.</p>
    </div>
   </div>
   {record && <section className="space-y-4 border-t pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Resultado · {record.vehicle}</h2><span className="text-sm text-muted-foreground">{dateLabel(record.created_at)}</span></div>
    <div className="grid gap-3 sm:grid-cols-2">{items.map(item=>{const Icon=ICONS[item.status];return <div key={item.key} className="rounded-lg border bg-card p-4 min-w-0"><Button variant="ghost" className={`h-auto w-full justify-between gap-3 whitespace-normal p-0 hover:bg-transparent ${COLORS[item.status]}`} onClick={()=>setFocused(item.key)} aria-label={`Destacar ${item.label}`}><span className="flex items-center gap-2 text-left"><Icon size={18} className="shrink-0"/>{item.label}</span><span className="font-bold text-right break-words">{item.value}</span></Button><p className={`mt-2 text-xs ${COLORS[item.status]}`}>{LABELS[item.status]}</p><p className="mt-1 text-sm text-muted-foreground">{itemExplanation(item)}</p>{item.key==='falhas' && item.status==='bad' && item.value.split(/,\s*/).map(code=><p key={code} className="mt-2 text-sm"><strong className="text-destructive">{code}</strong> · {explainDtc(code)}</p>)}</div>;})}</div>
    {prior && <Comparison current={record} previous={prior}/>}
    {!history.savedIds.has(record.id) && <div className="flex flex-wrap items-center gap-2"><p className="text-sm text-muted-foreground">Leitura disponível nesta sessão. Ainda não guardada na conta.</p>{history.user && <Button variant="outline" disabled={history.saving} onClick={()=>history.save(record)}><Save size={16}/>Guardar leitura</Button>}</div>}
   </section>}
  </> : <section className="space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">Histórico de leituras</h2><Button variant="ghost" size="icon" title="Atualizar histórico" aria-label="Atualizar histórico" onClick={()=>history.reload()}><RefreshCw size={18}/></Button></div>
   <p className="text-sm text-muted-foreground">Últimas 100 leituras salvas. Comparações somente entre o mesmo veículo e a mesma origem; demonstrações não são diagnósticos reais.</p>
   {history.loading && <p role="status">Carregando histórico...</p>}
   {!history.loading && history.records.length===0 && <div className="border-y py-8 text-center"><History className="mx-auto mb-3 text-muted-foreground"/><p>Nenhuma leitura ainda</p><Button variant="ghost" onClick={()=>setView('scan')}><ArrowLeft size={16}/>Voltar ao diagnóstico</Button></div>}
   <div className="divide-y">{history.records.map(r=><div key={r.id} className="flex flex-wrap items-center gap-3 py-4"><Button variant="ghost" className="h-auto min-w-0 flex-1 flex-col items-start whitespace-normal text-left" onClick={()=>{setRecord(r);setState('done');setStep(STEPS.length);setFocused('');setView('scan');}}><span className="font-bold">{r.vehicle} · {r.mode==='demo'?'Demonstração':'USB'}</span><span className="text-sm text-muted-foreground">{dateLabel(r.created_at)} · {r.items.filter(i=>i.status==='warn'||i.status==='bad').length} alerta(s) · {history.savedIds.has(r.id)?'Salvo na conta':'Somente nesta sessão'}</span></Button>{!history.savedIds.has(r.id) && history.user && <Button variant="outline" size="icon" title="Guardar leitura" aria-label={`Guardar leitura de ${dateLabel(r.created_at)}`} disabled={history.saving} onClick={()=>history.save(r)}><Save size={16}/></Button>}<Button variant="ghost" size="icon" aria-label={`Excluir leitura de ${dateLabel(r.created_at)}`} title="Excluir leitura" onClick={()=>{if(window.confirm('Excluir esta leitura do histórico?'))void history.remove(r.id);}}><Trash2 size={16}/></Button></div>)}</div>
  </section>}
 </div>;
}
function Comparison({current,previous}:{current:ScanRecord;previous:ScanRecord}) {
 return <section className="border-y py-3"><h3 className="font-bold">Comparação com {dateLabel(previous.created_at)}</h3><div className="mt-2 divide-y">{compareItems(current.items,previous.items).map(c=><div key={c.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 py-2 text-sm"><span>{c.label}</span><span className="break-words">{c.before} → {c.after}</span><span className="text-muted-foreground">{!c.comparable?'Sem comparação':c.changed?'Alterado':'Sem alteração'}</span></div>)}</div></section>;
}

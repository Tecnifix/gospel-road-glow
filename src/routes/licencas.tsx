import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { LockKeyhole, KeyRound, Copy, Download, LoaderCircle, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProductScreen } from '@/components/ProductScreen';
import { ScannerAccount } from '@/components/ScannerAccount';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { licenseAdminStatus, issueDeviceLicense } from '@/lib/license-admin.functions';

export const Route = createFileRoute('/licencas')({
  head: () => ({ meta: [
    { title: 'AdoraDrive — Emissão de licenças' },
    { name: 'description', content: 'Área restrita para emitir licenças AdoraDrive vinculadas à instalação da central.' },
    { property: 'og:title', content: 'AdoraDrive — Emissão de licenças' },
    { property: 'og:description', content: 'Emissão protegida de licenças com conferência offline.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }), component: LicenseIssuer,
});
type IssuedRow = { id: string; device_id: string; activation_code: string; created_at: string };
function download(code: string) {
  const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'licenca-adoradrive.adora'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function LicenseIssuer() {
  const statusFn = useServerFn(licenseAdminStatus);
  const issueFn = useServerFn(issueDeviceLicense);
  const [userId, setUserId] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<IssuedRow[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => { if (alive) { setUserId(data.session?.user.id ?? null); if (!data.session) setChecking(false); } });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAdmin(false); setCode(''); setRows([]);
      if (!session) setChecking(false);
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setChecking(true);
    void statusFn().then(result => {
      if (alive) { setAdmin(result.admin); setRows(result.licenses); }
    }).catch(() => { if (alive) { setAdmin(false); setMessage('Não foi possível conferir o acesso. Verifique a conexão e tente novamente.'); } })
      .finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, [userId, revision, statusFn]);
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setMessage('Licença copiada.'); }
    catch { setMessage('Não foi possível copiar. Baixe o arquivo da licença.'); }
  };
  return <ProductScreen><div className="mx-auto max-w-3xl">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><LockKeyhole className="mb-4 size-9 text-primary" /><h1 className="font-display text-2xl sm:text-3xl">Emissão de licenças</h1><p className="mt-3 text-muted-foreground">AdoraDrive · Acesso restrito</p></div>
      {userId && <Button variant="outline" onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) setMessage('Não foi possível sair.'); }}><LogOut />Sair</Button>}
    </div>
    <div className="my-7 border-y py-5">
      {checking ? <p className="flex items-center gap-2"><LoaderCircle className="animate-spin" />Conferindo acesso…</p> : !userId ? <ScannerAccount purpose="licenses" /> : !admin ? <p className="text-chart-4">Sua conta ainda não está autorizada a emitir licenças.</p> : <p className="flex items-center gap-2 text-primary"><KeyRound />Conta autorizada a emitir</p>}
      {userId && !admin && !checking && <Button variant="outline" className="mt-4" onClick={() => setRevision(value => value + 1)}><RefreshCw />Conferir acesso</Button>}
    </div>
    {admin && <>
      <form className="grid gap-4" onSubmit={async event => {
        event.preventDefault(); setBusy(true); setMessage(''); setCode('');
        try {
          const result = await issueFn({ data: { deviceId, saleConfirmed: true } });
          setCode(result.code); setMessage(result.reused ? 'Esta instalação já possui licença. A chave original foi recuperada.' : 'Licença emitida e registrada. Envie a chave ou o arquivo ao cliente.');
          setConfirmed(false); setRevision(value => value + 1);
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível emitir a licença.'); }
        finally { setBusy(false); }
      }}>
        <label htmlFor="device-id" className="font-bold">ID enviado pelo cliente</label>
        <Textarea id="device-id" value={deviceId} onChange={event => { setDeviceId(event.target.value); setCode(''); setConfirmed(false); }} placeholder="DEV-… · Cole o ID completo" maxLength={100} required spellCheck={false} className="min-h-20 break-all font-mono" />
        <label className="flex items-start gap-3 text-sm"><Checkbox checked={confirmed} onCheckedChange={value => setConfirmed(value === true)} className="mt-0.5" />Confirmo que autorizei esta emissão e conferi o pagamento fora do aplicativo.</label>
        <Button type="submit" disabled={busy || !confirmed || !deviceId.trim()} className="min-h-12 justify-self-start">{busy ? <LoaderCircle className="animate-spin" /> : <KeyRound />}Emitir licença</Button>
      </form>
      {code && <section className="mt-7 border-y py-5"><h2 className="font-bold">Licença pronta para enviar</h2><Textarea readOnly aria-label="Licença emitida" value={code} className="mt-3 min-h-32 break-all font-mono text-xs" /><div className="mt-4 flex flex-wrap gap-3"><Button variant="outline" onClick={() => void copy(code)}><Copy />Copiar chave</Button><Button onClick={() => download(code)}><Download />Baixar licença</Button></div></section>}
      <section className="mt-8"><h2 className="font-display text-lg">Últimas emissões</h2>
        {!rows.length ? <p className="mt-4 text-muted-foreground">Nenhuma licença emitida.</p> : <ul className="mt-4 divide-y">{rows.map(row => <li key={row.id} className="py-4"><p className="break-all font-mono text-xs text-primary">{row.device_id}</p><div className="mt-3 flex flex-wrap items-center gap-3"><span className="text-sm text-muted-foreground">{new Date(row.created_at).toLocaleString('pt-BR')}</span><Button size="icon" variant="outline" aria-label={`Copiar licença de ${row.device_id}`} title="Copiar licença" onClick={() => void copy(row.activation_code)}><Copy /></Button><Button size="icon" variant="outline" aria-label={`Baixar licença de ${row.device_id}`} title="Baixar licença" onClick={() => download(row.activation_code)}><Download /></Button></div></li>)}</ul>}
      </section>
      <p className="mt-7 text-sm text-muted-foreground">A emissão exige internet; a conferência da chave preparada na central não. Licenças offline não podem ser bloqueadas remotamente. Guarde o ID para atendimento em caso de reinstalação.</p>
    </>}
    <p role="status" aria-live="polite" className="mt-5 break-words text-sm text-chart-4">{message}</p>
  </div></ProductScreen>;
}
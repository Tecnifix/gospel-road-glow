import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { KeyRound, ShieldCheck, CircleAlert, ShoppingBag } from 'lucide-react';
import { ProductScreen } from '@/components/ProductScreen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/ativacao')({
  head: () => ({ meta: [
    { title: 'AdoraDrive — Ativação por licença' },
    { name: 'description', content: 'Consulte a ativação por código do AdoraDrive e o acesso aos temas adquiridos.' },
    { property: 'og:title', content: 'AdoraDrive — Ativação por licença' },
    { property: 'og:description', content: 'Sua licença e seus temas no AdoraDrive.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Activation,
});

function Activation() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  return <ProductScreen><div className="mx-auto max-w-xl">
    <KeyRound className="mb-5 size-10 text-primary" />
    <h1 className="font-display text-2xl sm:text-3xl">Ativar AdoraDrive</h1>
    <div className="mt-5 flex items-center gap-2 text-muted-foreground"><ShieldCheck className="size-5" /><span>Nenhuma licença verificada</span></div>
    <form className="mt-8 grid gap-4" onSubmit={event => {
      event.preventDefault();
      setMessage(!navigator.onLine ? 'Sem internet. A verificação de uma licença exige conexão; nenhum código foi ativado.' : 'A ativação comercial ainda não está disponível. Nenhum código foi validado ou salvo e nenhum tema foi desbloqueado.');
    }}>
      <label htmlFor="license-code" className="font-bold">Código da licença</label>
      <Input id="license-code" name="license-code" placeholder="Código recebido na compra" autoComplete="off" spellCheck={false} required value={code} onChange={event => { setCode(event.target.value); setMessage(''); }} className="h-12" />
      <Button type="submit" disabled={!code.trim()} className="min-h-12"><KeyRound />Verificar código</Button>
      <p role="status" aria-live="polite" className="min-h-6 text-sm text-chart-4">{message}</p>
    </form>
    <div className="mt-5 flex items-start gap-3 border-y py-5 text-muted-foreground"><CircleAlert className="mt-1 size-5 shrink-0 text-chart-4" /><p>Ativação em preparação. Os temas gratuitos continuam disponíveis; os Premium permanecem com teste de cinco minutos.</p></div>
    <Button asChild variant="outline" className="mt-6 min-h-11"><Link to="/loja"><ShoppingBag />Ver coleção Premium</Link></Button>
  </div></ProductScreen>;
}
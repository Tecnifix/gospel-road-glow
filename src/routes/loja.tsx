import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Image, Play, Expand, KeyRound, ShoppingBag } from 'lucide-react';
import { ProductScreen } from '@/components/ProductScreen';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { THEME_CATALOG, type ThemeOption } from '@/lib/themes';

export const Route = createFileRoute('/loja')({
  head: () => ({ meta: [
    { title: 'AdoraDrive — Coleção de temas gratuitos' },
    { name: 'description', content: 'Veja todos os temas gospel gratuitos, estáticos e animados, para sua central multimídia AdoraDrive.' },
    { property: 'og:title', content: 'AdoraDrive — Coleção de temas gratuitos' },
    { property: 'og:description', content: 'Explore a coleção gratuita e veja cada arte em tamanho maior.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: ThemeShop,
});

function ThemeShop() {
  const [preview, setPreview] = useState<ThemeOption | null>(null);
  return <ProductScreen>
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div><ShoppingBag className="mb-4 size-9 text-primary" /><h1 className="font-display text-2xl sm:text-3xl">Temas gratuitos</h1><p className="mt-3 text-muted-foreground">Estáticos e animados · Sem limite de tempo</p></div>
      <Button asChild variant="outline" className="min-h-11"><Link to="/ativacao"><KeyRound />Já tenho um código</Link></Button>
    </div>
    <div className="my-7 flex flex-wrap items-center justify-between gap-4 border-y py-5">
      <div><p className="font-bold text-primary">Todos os temas são grátis</p><p className="mt-1 text-sm text-muted-foreground">Incluídos no AdoraDrive após a ativação do aplicativo.</p></div>
      <Button asChild className="min-h-11"><Link to="/"><Image />Abrir AdoraDrive</Link></Button>
    </div>
    <Tabs defaultValue="static">
      <TabsList aria-label="Tipo de tema" className="mb-5 grid h-auto min-h-12 w-full grid-cols-2 sm:max-w-md">
        <TabsTrigger value="static" className="min-h-11 gap-2"><Image size={16} />Estáticos</TabsTrigger>
        <TabsTrigger value="animated" className="min-h-11 gap-2"><Play size={16} />Com movimento</TabsTrigger>
      </TabsList>
      {[false, true].map(animated => <TabsContent key={String(animated)} value={animated ? 'animated' : 'static'}>
      <h2 className="mb-4 text-lg font-bold">{animated ? 'Temas animados · Com movimento' : 'Temas estáticos · Sem movimento'} · Grátis</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {THEME_CATALOG.filter(theme => theme.animated === animated).map(theme => <article key={theme.id} className="overflow-hidden rounded-lg border bg-card">
        <div className="relative aspect-video"><img src={theme.img} alt={theme.name} loading="lazy" className="h-full w-full object-contain" /><span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs text-primary">{theme.animated ? <Play size={14} /> : <Image size={14} />}{theme.animated ? 'Com movimento' : 'Estático'}</span>
          <Button size="icon" variant="outline" aria-label={`Ampliar: ${theme.name}${theme.design === 'classico' ? ' clássico' : ''}${theme.animated ? ' animado' : ''}`} onClick={() => setPreview(theme)} className="absolute bottom-2 right-2 bg-background/90"><Expand /></Button>
        </div>
        <div className="p-4"><h3 className="text-xl font-bold">{theme.name}</h3><p className="mt-1 text-sm text-muted-foreground">{theme.design === 'classico' ? 'Clássico' : 'Velocímetro central'} · {theme.animated ? 'Com movimento' : 'Sem movimento'}</p><p className="mt-3 text-sm text-primary">Grátis</p></div>
      </article>)}
      </div>
      </TabsContent>)}
    </Tabs>
    <Dialog open={preview !== null} onOpenChange={open => { if (!open) setPreview(null); }}>
      {preview && <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto"><DialogTitle>{preview.name}</DialogTitle><DialogDescription>Gratuito · {preview.animated ? 'Com movimento' : 'Estático — sem movimento'}</DialogDescription><img src={preview.img} alt={preview.name} className="aspect-video w-full object-contain" /></DialogContent>}
    </Dialog>
  </ProductScreen>;
}
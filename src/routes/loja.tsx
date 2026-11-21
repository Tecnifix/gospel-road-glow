import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Crown, Expand, KeyRound, ShoppingBag } from 'lucide-react';
import { ProductScreen } from '@/components/ProductScreen';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { THEME_CATALOG, type ThemeOption } from '@/lib/themes';

export const Route = createFileRoute('/loja')({
  head: () => ({ meta: [
    { title: 'AdoraDrive — Loja de temas gospel' },
    { name: 'description', content: 'Veja a coleção de fundos Premium gospel para sua central multimídia AdoraDrive.' },
    { property: 'og:title', content: 'AdoraDrive — Loja de temas gospel' },
    { property: 'og:description', content: 'Explore os fundos Premium e veja cada arte em tamanho maior.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: ThemeShop,
});

function ThemeShop() {
  const [preview, setPreview] = useState<ThemeOption | null>(null);
  return <ProductScreen>
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div><ShoppingBag className="mb-4 size-9 text-primary" /><h1 className="font-display text-2xl sm:text-3xl">Loja de temas</h1><p className="mt-3 text-muted-foreground">Coleção Premium · Fundos animados</p></div>
      <Button asChild variant="outline" className="min-h-11"><Link to="/ativacao"><KeyRound />Já tenho um código</Link></Button>
    </div>
    <div className="my-7 flex flex-wrap items-center justify-between gap-4 border-y py-5">
      <div><p className="font-bold text-chart-4">Vendas ainda não disponíveis</p><p className="mt-1 text-sm text-muted-foreground">Site de compra e preços ainda não definidos.</p></div>
      <Button disabled className="min-h-11"><ShoppingBag />Comprar no site · Em breve</Button>
    </div>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {THEME_CATALOG.filter(theme => theme.premium).map(theme => <article key={theme.id} className="overflow-hidden rounded-lg border bg-card">
        <div className="relative aspect-video"><img src={theme.img} alt={theme.name} loading="lazy" className="h-full w-full object-contain" /><span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs text-primary"><Crown size={14} />PREMIUM</span>
          <Button size="icon" variant="outline" aria-label={`Ampliar: ${theme.name}${theme.design === 'classico' ? ' clássico' : ''}`} onClick={() => setPreview(theme)} className="absolute bottom-2 right-2 bg-background/90"><Expand /></Button>
        </div>
        <div className="p-4"><h2 className="text-xl font-bold">{theme.name}</h2><p className="mt-1 text-sm text-muted-foreground">{theme.design === 'classico' ? 'Clássico' : 'Velocímetro central'}</p><p className="mt-3 text-sm text-primary">Preço a definir</p></div>
      </article>)}
    </div>
    <Dialog open={preview !== null} onOpenChange={open => { if (!open) setPreview(null); }}>
      {preview && <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto"><DialogTitle>{preview.name}</DialogTitle><DialogDescription>Arte do tema Premium · Compra ainda não disponível.</DialogDescription><img src={preview.img} alt={preview.name} className="aspect-video w-full object-contain" /></DialogContent>}
    </Dialog>
  </ProductScreen>;
}
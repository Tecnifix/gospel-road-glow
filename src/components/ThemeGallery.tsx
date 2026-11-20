import { useState } from "react";
import { Check, Crown, LockKeyhole, Play, Image, Expand, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { THEME_CATALOG, type ThemeOption } from "@/lib/themes";

export function ThemeGallery({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const [preview, setPreview] = useState<ThemeOption | null>(null);
  const collection = (premium: boolean) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {THEME_CATALOG.filter((t) => t.premium === premium).map((t: ThemeOption) => (
        <article key={t.id} className={`overflow-hidden rounded-lg border bg-card ${activeId === t.id ? "ring-2 ring-primary" : ""}`}>
          <div className="relative aspect-video">
            <img src={t.img} alt={t.name} loading="lazy" className="h-full w-full object-contain" />
            <Button variant="outline" size="icon" className="absolute bottom-2 right-2 h-10 w-10 bg-background/90" aria-label={`Ver arte: ${t.name}${t.design === "classico" ? " clássico" : ""}${premium ? " Premium" : ""}`} onClick={() => setPreview(t)}><Expand /></Button>
            <span className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs font-bold text-primary">{premium ? <Crown size={14} /> : <Image size={14} />}{premium ? "PREMIUM" : "FREE"}</span>
          </div>
          <div className="p-3">
            <h3 className="text-lg font-bold">{t.name}</h3>
            <p className="mb-3 text-sm text-muted-foreground">{t.design === "classico" ? "Clássico" : "Velocímetro central"} · {premium ? "Animado · Pago" : "Estático · Grátis"}</p>
            <Button className="w-full h-auto min-h-11 whitespace-normal" variant={premium ? "default" : "outline"} disabled={activeId === t.id} onClick={() => onSelect(t.id)} aria-label={`${premium ? "Testar por 5 minutos" : "Aplicar"}: ${t.name}${t.design === "classico" ? " clássico" : ""}`}>
              {activeId === t.id ? <Check /> : premium ? <Play /> : <Image />}{activeId === t.id ? "Em uso" : premium ? "Testar por 5 minutos" : "Aplicar tema"}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
  return (
    <div className="pb-6">
      <h2 className="font-display text-2xl mb-5">Seus temas</h2>
      <section className="mb-8">
        <h3 className="mb-3 flex items-center gap-2 text-xl font-bold"><Image size={20} />Gratuitos <span className="text-sm text-muted-foreground font-normal">Estáticos</span></h3>
        {collection(false)}
      </section>
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-primary"><LockKeyhole size={20} />Premium <span className="text-sm text-muted-foreground font-normal">Animados · Pagos</span></h3>
        {collection(true)}
      </section>
      <Dialog open={preview !== null} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        {preview && <DialogContent className="w-[calc(100%-2rem)] max-w-4xl max-h-[90dvh] overflow-y-auto rounded-lg p-4 [&>button:last-child]:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <DialogTitle className="min-w-0">{preview.name}</DialogTitle>
            <DialogClose asChild><Button variant="ghost" size="icon" aria-label="Fechar arte"><X /></Button></DialogClose>
          </div>
          <DialogDescription>{preview.premium ? "Premium · Animado · Teste de 5 minutos" : "Gratuito · Estático"}</DialogDescription>
          <img src={preview.img} alt={preview.name} className="aspect-video w-full object-contain" />
          <Button disabled={activeId === preview.id} className="min-h-11 h-auto whitespace-normal" onClick={() => { onSelect(preview.id); setPreview(null); }}>{activeId === preview.id ? <Check /> : preview.premium ? <Play /> : <Image />}{activeId === preview.id ? "Em uso" : preview.premium ? "Testar por 5 minutos" : "Aplicar tema"}</Button>
        </DialogContent>}
      </Dialog>
    </div>
  );
}
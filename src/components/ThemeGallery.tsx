import { Check, Crown, LockKeyhole, Play, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_CATALOG, type ThemeOption } from "@/lib/themes";

export function ThemeGallery({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const collection = (premium: boolean) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {THEME_CATALOG.filter((t) => t.premium === premium).map((t: ThemeOption) => (
        <article key={t.id} className={`overflow-hidden rounded-lg border bg-card ${activeId === t.id ? "ring-2 ring-primary" : ""}`}>
          <div className="relative aspect-video">
            <img src={t.img} alt={t.name} loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs font-bold text-primary">{premium ? <Crown size={14} /> : <Image size={14} />}{premium ? "PREMIUM" : "FREE"}</span>
          </div>
          <div className="p-3">
            <h3 className="text-lg font-bold">{t.name}</h3>
            <p className="mb-3 text-sm text-muted-foreground">{t.design === "classico" ? "Clássico" : "Velocímetro central"} · {premium ? "Animado · Pago" : "Estático · Grátis"}</p>
            <Button className="w-full" variant={premium ? "default" : "outline"} disabled={activeId === t.id} onClick={() => onSelect(t.id)} aria-label={`${premium ? "Testar por 5 minutos" : "Aplicar"}: ${t.name}${t.design === "classico" ? " clássico" : ""}`}>
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
    </div>
  );
}
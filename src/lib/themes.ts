import jesus from "@/assets/fundo-jesus.jpg.asset.json";
import anjo from "@/assets/fundo-anjo.jpg.asset.json";
import cruz from "@/assets/fundo-cruz.jpg.asset.json";
import pomba from "@/assets/fundo-pomba.jpg.asset.json";
import { DESIGNS, type DesignId } from "@/components/HaloDashboard";

export const TRIAL_DURATION_MS = 5 * 60 * 1000;
export type ThemePalette = "gold" | "sky" | "amber" | "teal" | "copper";
const designPalettes: Record<DesignId, ThemePalette> = {
  anjos: "gold",
  "anjos-nuvens": "gold",
  "anjos-classicos": "gold",
  maos: "gold",
  jesus: "copper",
  pomba: "teal",
};
export type ThemeOption = {
  id: string;
  name: string;
  img: string;
  design: DesignId | "classico";
  background: string;
  premium: boolean;
  palette: ThemePalette;
};
const backgrounds: { id: string; name: string; img: string; palette: ThemePalette }[] = [
  { id: "jesus", name: "Luz do Mundo", img: jesus.url, palette: "gold" },
  { id: "anjo", name: "Anjo da Estrada", img: anjo.url, palette: "sky" },
  { id: "cruz", name: "Monte Calvário", img: cruz.url, palette: "amber" },
  { id: "pomba", name: "Espírito Santo", img: pomba.url, palette: "teal" },
];
export const THEME_CATALOG: ThemeOption[] = [
  ...backgrounds.map((t) => ({ ...t, id: `free-classico-${t.id}`, design: "classico" as const, background: t.id, premium: false })),
  ...DESIGNS.map((d) => ({ id: `free-${d.id}`, name: d.name, img: d.img, design: d.id, background: "jesus", premium: false, palette: designPalettes[d.id] })),
  ...DESIGNS.map((d) => ({ id: `premium-${d.id}`, name: d.name, img: d.img, design: d.id, background: "jesus", premium: true, palette: designPalettes[d.id] })),
  ...backgrounds.map((t) => ({ ...t, id: `premium-classico-${t.id}`, design: "classico" as const, background: t.id, premium: true })),
];
export const DEFAULT_FREE_THEME = "free-anjos-nuvens";
export type ThemeTrial = { themeId: string; endsAt: number };
export function startThemeTrial(themeId: string, now: number): ThemeTrial | null {
  if (!THEME_CATALOG.some((t) => t.id === themeId && t.premium)) return null;
  return { themeId, endsAt: now + TRIAL_DURATION_MS };
}
export function remainingTrialMs(trial: ThemeTrial | null, now: number) {
  return trial ? Math.max(0, trial.endsAt - now) : 0;
}
export function resolveTheme(freeId: string, trial: ThemeTrial | null, now: number): ThemeOption {
  const free = THEME_CATALOG.find((t) => t.id === freeId && !t.premium) ?? THEME_CATALOG[0];
  if (!free) throw new Error("A coleção precisa de um tema gratuito.");
  if (remainingTrialMs(trial, now) > 0) return THEME_CATALOG.find((t) => t.id === trial?.themeId && t.premium) ?? free;
  return free;
}
export function readTrial(raw: string | null): ThemeTrial | null {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (value && typeof value === "object" && "themeId" in value && "endsAt" in value && typeof value.themeId === "string" && typeof value.endsAt === "number" && Number.isFinite(value.endsAt) && THEME_CATALOG.some((t) => t.id === value.themeId && t.premium)) {
      return { themeId: value.themeId, endsAt: value.endsAt };
    }
  } catch { /* Ignore an invalid local preview session. */ }
  return null;
}
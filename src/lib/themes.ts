import jesus from "@/assets/fundo-jesus.jpg.asset.json";
import anjo from "@/assets/fundo-anjo.jpg.asset.json";
import cruz from "@/assets/fundo-cruz.jpg.asset.json";
import pomba from "@/assets/fundo-pomba.jpg.asset.json";
import { DESIGNS, type DesignId } from "@/components/HaloDashboard";
import { CLASSIC_SKIES, DESIGN_SKIES } from "@/lib/theme-skies";

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
  sky: string;
  design: DesignId | "classico";
  background: string;
  premium: boolean;
  animated: boolean;
  palette: ThemePalette;
};
const backgrounds: { id: string; name: string; img: string; sky: string; palette: ThemePalette }[] = [
  { id: "jesus", name: "Luz do Mundo", img: jesus.url, sky: CLASSIC_SKIES.jesus, palette: "gold" },
  { id: "anjo", name: "Anjo da Estrada", img: anjo.url, sky: CLASSIC_SKIES.anjo, palette: "sky" },
  { id: "cruz", name: "Monte Calvário", img: cruz.url, sky: CLASSIC_SKIES.cruz, palette: "amber" },
  { id: "pomba", name: "Espírito Santo", img: pomba.url, sky: CLASSIC_SKIES.pomba, palette: "teal" },
];
export const THEME_CATALOG: ThemeOption[] = [
  ...backgrounds.map((t) => ({ ...t, id: `free-classico-${t.id}`, design: "classico" as const, background: t.id, premium: false, animated: false })),
  ...DESIGNS.map((d) => ({ id: `free-${d.id}`, name: d.name, img: d.img, sky: DESIGN_SKIES[d.id], design: d.id, background: "jesus", premium: false, animated: false, palette: designPalettes[d.id] })),
  ...DESIGNS.map((d) => ({ id: `premium-${d.id}`, name: d.name, img: d.img, sky: DESIGN_SKIES[d.id], design: d.id, background: "jesus", premium: false, animated: true, palette: designPalettes[d.id] })),
  ...backgrounds.map((t) => ({ ...t, id: `premium-classico-${t.id}`, design: "classico" as const, background: t.id, premium: false, animated: true })),
];
export const DEFAULT_FREE_THEME = "free-anjos-nuvens";
export function resolveTheme(id: string): ThemeOption {
  const theme = THEME_CATALOG.find((t) => t.id === id) ?? THEME_CATALOG.find((t) => t.id === DEFAULT_FREE_THEME);
  if (!theme) throw new Error("A coleção precisa de um tema gratuito.");
  return theme;
}
// Preserve an old preview as a permanent selection; its deadline no longer applies.
export function readLegacyTrialTheme(raw: string | null): string | null {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (value && typeof value === "object" && "themeId" in value && typeof value.themeId === "string" && THEME_CATALOG.some((t) => t.id === value.themeId)) {
      return value.themeId;
    }
  } catch { /* Ignore an invalid local preview session. */ }
  return null;
}
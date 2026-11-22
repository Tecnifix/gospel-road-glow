import { useEffect, useState } from "react";
import { DEFAULT_FREE_THEME, THEME_CATALOG, readLegacyTrialTheme, resolveTheme } from "@/lib/themes";

// Selection is permanent; application licensing is handled independently.
export function useThemeSelection() {
  const [freeId, setFreeId] = useState(DEFAULT_FREE_THEME);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("adora-free-theme");
    const legacyDesign = localStorage.getItem("adora-design");
    const legacyBackground = localStorage.getItem("adora-theme") ?? "jesus";
    const migrated = legacyDesign === "classico" ? `free-classico-${legacyBackground}` : legacyDesign ? `free-${legacyDesign}` : DEFAULT_FREE_THEME;
    const id = readLegacyTrialTheme(sessionStorage.getItem("adora-theme-trial")) ?? saved ?? migrated;
    setFreeId(resolveTheme(id).id);
    sessionStorage.removeItem("adora-theme-trial");
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("adora-free-theme", freeId);
  }, [freeId, ready]);
  const choose = (id: string) => {
    const option = THEME_CATALOG.find((t) => t.id === id);
    if (!option) return;
    setFreeId(id);
    sessionStorage.removeItem("adora-theme-trial");
  };
  return { activeTheme: resolveTheme(freeId), choose };
}
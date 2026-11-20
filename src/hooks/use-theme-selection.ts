import { useEffect, useState } from "react";
import { DEFAULT_FREE_THEME, THEME_CATALOG, readTrial, remainingTrialMs, resolveTheme, startThemeTrial, type ThemeTrial } from "@/lib/themes";

// Session storage retains the deadline across reloads, not a paid entitlement.
export function useThemeSelection() {
  const [freeId, setFreeId] = useState(DEFAULT_FREE_THEME);
  const [trial, setTrial] = useState<ThemeTrial | null>(null);
  const [clock, setClock] = useState(0);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const saved = localStorage.getItem("adora-free-theme");
    const legacyDesign = localStorage.getItem("adora-design");
    const legacyBackground = localStorage.getItem("adora-theme") ?? "jesus";
    const migrated = legacyDesign === "classico" ? `free-classico-${legacyBackground}` : legacyDesign ? `free-${legacyDesign}` : DEFAULT_FREE_THEME;
    const id = saved ?? migrated;
    if (THEME_CATALOG.some((t) => t.id === id && !t.premium)) setFreeId(id);
    const restored = readTrial(sessionStorage.getItem("adora-theme-trial"));
    if (remainingTrialMs(restored, Date.now()) > 0) setTrial(restored);
    else sessionStorage.removeItem("adora-theme-trial");
    setClock(Date.now());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("adora-free-theme", freeId);
  }, [freeId, ready]);
  useEffect(() => {
    if (!trial) return;
    const update = () => {
      const time = Date.now();
      setClock(time);
      if (remainingTrialMs(trial, time) === 0) {
        setTrial(null);
        sessionStorage.removeItem("adora-theme-trial");
        setNotice("Teste encerrado. Seu tema gratuito foi restaurado.");
      }
    };
    const interval = setInterval(update, 250);
    const timeout = setTimeout(update, remainingTrialMs(trial, Date.now()));
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(interval); clearTimeout(timeout);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [trial]);
  const choose = (id: string) => {
    const option = THEME_CATALOG.find((t) => t.id === id);
    if (!option) return;
    const time = Date.now();
    setClock(time); setNotice("");
    if (option.premium) {
      // Clicking the active preview again must not extend its deadline.
      if (trial?.themeId === id && remainingTrialMs(trial, time) > 0) return;
      const next = startThemeTrial(id, time);
      setTrial(next);
      sessionStorage.setItem("adora-theme-trial", JSON.stringify(next));
    } else {
      setFreeId(id); setTrial(null);
      sessionStorage.removeItem("adora-theme-trial");
    }
  };
  const stopTrial = () => {
    setTrial(null); sessionStorage.removeItem("adora-theme-trial");
  };
  return { activeTheme: resolveTheme(freeId, trial, clock), remaining: remainingTrialMs(trial, clock), choose, stopTrial, notice };
}
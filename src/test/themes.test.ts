import { describe, expect, it } from "vitest";
import { THEME_CATALOG, readTrial, remainingTrialMs, resolveTheme, startThemeTrial } from "@/lib/themes";

describe("Theme access", () => {
  it("keeps static versions free and moving versions Premium", () => {
    expect(THEME_CATALOG.filter((t) => !t.premium)).toHaveLength(10);
    for (const theme of THEME_CATALOG.filter((t) => !t.premium)) {
      expect(startThemeTrial(theme.id, 0)).toBeNull();
      expect(THEME_CATALOG.some((t) => t.premium && t.design === theme.design && t.background === theme.background)).toBe(true);
    }
  });
  it("preserves both different angel videos", () => {
    expect(THEME_CATALOG.find((t) => t.id === "premium-anjos")?.design).toBe("anjos");
    expect(THEME_CATALOG.find((t) => t.id === "premium-anjos-nuvens")?.design).toBe("anjos-nuvens");
    expect(THEME_CATALOG.find((t) => t.id === "free-anjos-classicos")?.design).toBe("anjos-classicos");
  });
  it("allows exactly five minutes of preview", () => {
    const trial = startThemeTrial("premium-maos", 1000);
    expect(trial?.endsAt).toBe(301000);
    expect(remainingTrialMs(trial, 1000)).toBe(300000);
    expect(resolveTheme("free-jesus", trial, 300999).id).toBe("premium-maos");
  });
  it("returns to the previous free theme automatically when time ends", () => {
    const trial = startThemeTrial("premium-anjos", 1000);
    expect(resolveTheme("free-maos", trial, 301000).id).toBe("free-maos");
    expect(remainingTrialMs(trial, 301000)).toBe(0);
  });
  it("does not restart the deadline after reload or permit a saved Premium fallback", () => {
    const trial = readTrial(JSON.stringify(startThemeTrial("premium-anjos", 1000)));
    expect(remainingTrialMs(trial, 61000)).toBe(240000);
    expect(resolveTheme("premium-anjos", null, 0).premium).toBe(false);
  });
});
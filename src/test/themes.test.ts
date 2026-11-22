import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_CATALOG, readLegacyTrialTheme, resolveTheme } from '@/lib/themes';
import { useThemeSelection } from '@/hooks/use-theme-selection';

describe('Free theme access', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); });
  it('makes all 20 themes free including the 10 former Premium variants', () => {
    expect(THEME_CATALOG).toHaveLength(20);
    expect(THEME_CATALOG.filter(t => t.premium)).toHaveLength(0);
    expect(THEME_CATALOG.filter(t => t.animated)).toHaveLength(10);
    for (const theme of THEME_CATALOG) expect(resolveTheme(theme.id).premium).toBe(false);
  });
  it('preserves a distinct sky per artwork shared between static and animated versions', () => {
    const staticThemes = THEME_CATALOG.filter(t => !t.animated);
    expect(new Set(staticThemes.map(t => t.sky)).size).toBe(10);
    for (const theme of staticThemes) {
      expect(theme.sky).not.toBe(theme.img);
      const animated = THEME_CATALOG.find(t => t.animated && t.design === theme.design && t.background === theme.background);
      expect(animated?.sky).toBe(theme.sky);
      expect(animated?.palette).toBe(theme.palette);
    }
  });
  it('preserves angel artworks and video identities', () => {
    expect(resolveTheme('premium-anjos').design).toBe('anjos');
    expect(resolveTheme('premium-anjos-nuvens').design).toBe('anjos-nuvens');
    expect(resolveTheme('free-anjos-classicos').design).toBe('anjos-classicos');
    expect(resolveTheme('premium-maos').animated).toBe(true);
    expect(resolveTheme('free-maos').animated).toBe(false);
  });
  it('keeps an animated selection beyond five minutes and after remount', () => {
    vi.useFakeTimers();
    const first = renderHook(() => useThemeSelection());
    act(() => first.result.current.choose('premium-maos'));
    act(() => vi.advanceTimersByTime(600000));
    expect(first.result.current.activeTheme.id).toBe('premium-maos');
    expect(first.result.current.activeTheme.animated).toBe(true);
    expect(localStorage.getItem('adora-free-theme')).toBe('premium-maos');
    expect(sessionStorage.getItem('adora-theme-trial')).toBeNull();
    first.unmount();
    const restored = renderHook(() => useThemeSelection());
    expect(restored.result.current.activeTheme.id).toBe('premium-maos');
    restored.unmount();
  });
  it('migrates a legacy trial to permanent animated selection regardless of its expired deadline', () => {
    localStorage.setItem('adora-free-theme', 'free-pomba');
    sessionStorage.setItem('adora-theme-trial', JSON.stringify({ themeId: 'premium-anjos', endsAt: 1 }));
    const hook = renderHook(() => useThemeSelection());
    expect(hook.result.current.activeTheme.id).toBe('premium-anjos');
    expect(localStorage.getItem('adora-free-theme')).toBe('premium-anjos');
    expect(sessionStorage.getItem('adora-theme-trial')).toBeNull();
    hook.unmount();
  });
  it('handles invalid legacy selection without losing a valid saved theme', () => {
    expect(readLegacyTrialTheme('{invalid')).toBeNull();
    expect(readLegacyTrialTheme(JSON.stringify({ themeId: 'missing' }))).toBeNull();
    localStorage.setItem('adora-free-theme', 'premium-pomba');
    const hook = renderHook(() => useThemeSelection());
    expect(hook.result.current.activeTheme.palette).toBe('teal');
    expect(hook.result.current.activeTheme.animated).toBe(true);
    hook.unmount();
  });
});

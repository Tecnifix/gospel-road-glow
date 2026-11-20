import anjos from "@/assets/design-anjos.jpg.asset.json";
import maos from "@/assets/design-maos.jpg.asset.json";
import jesus from "@/assets/design-jesus.jpg.asset.json";
import pomba from "@/assets/design-pomba.jpg.asset.json";
import type { CSSProperties } from "react";

// Posição do anel vazio em cada imagem (fração da largura/altura do quadro 16:9).
export const DESIGNS = [
  { id: "anjos", name: "Anjos Guardiões", img: anjos.url, x: 0.5, y: 0.465, d: 0.64, accent: "oklch(0.82 0.14 80)" },
  { id: "maos", name: "Mãos de Deus", img: maos.url, x: 0.5, y: 0.39, d: 0.56, accent: "oklch(0.8 0.15 75)" },
  { id: "jesus", name: "Luz do Mundo", img: jesus.url, x: 0.5, y: 0.53, d: 0.53, accent: "oklch(0.75 0.17 55)" },
  { id: "pomba", name: "Espírito Santo", img: pomba.url, x: 0.5, y: 0.555, d: 0.62, accent: "oklch(0.8 0.12 195)" },
] as const;
export type DesignId = (typeof DESIGNS)[number]["id"];

const MAX = 220;
function Gauge({ speed, rpm }: { speed: number; rpm: number }) {
  const start = 135, sweep = 270, r = 88;
  const pt = (deg: number, rad: number) => { const a = (deg * Math.PI) / 180; return [100 + rad * Math.cos(a), 100 + rad * Math.sin(a)] as const; };
  const arc = (from: number, to: number, rad: number) => { const [x1, y1] = pt(from, rad), [x2, y2] = pt(to, rad); return `M${x1} ${y1} A${rad} ${rad} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`; };
  const sp = start + (Math.min(speed, MAX) / MAX) * sweep;
  const rp = start + (Math.min(rpm, 8000) / 8000) * sweep;
  const ticks = Array.from({ length: 23 }, (_, i) => i);
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <defs>
        <radialGradient id="g-face"><stop offset="0%" stopColor="var(--background)" stopOpacity="0.2" /><stop offset="100%" stopColor="var(--background)" stopOpacity="0.85" /></radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#g-face)" />
      {ticks.map((i) => { const deg = start + (i / 22) * sweep, big = i % 2 === 0; const [x1, y1] = pt(deg, big ? 80 : 83), [x2, y2] = pt(deg, 87); const [tx, ty] = pt(deg, 71);
        return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={deg <= sp ? "var(--primary)" : "var(--muted-foreground)"} strokeWidth={big ? 1.4 : 0.7} opacity={deg <= sp ? 1 : 0.5} />{big && <text x={tx} y={ty} fill="var(--muted-foreground)" fontSize="6" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-display)">{i * 10}</text>}</g>; })}
      <path d={arc(start, start + sweep, r + 6)} stroke="var(--border)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {speed > 0 && <path d={arc(start, sp, r + 6)} stroke="var(--primary)" strokeWidth="3.5" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px var(--primary))" }} />}
      <path d={arc(start, start + sweep, 60)} stroke="var(--border)" strokeWidth="1.5" fill="none" />
      <path d={arc(start, rp, 60)} stroke="var(--destructive)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="100" y="98" textAnchor="middle" fill="var(--foreground)" fontSize="34" fontWeight="800" fontFamily="var(--font-display)" style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}>{speed}</text>
      <text x="100" y="114" textAnchor="middle" fill="var(--primary)" fontSize="7" letterSpacing="2" fontFamily="var(--font-display)">KM/H</text>
      <text x="100" y="134" textAnchor="middle" fill="var(--muted-foreground)" fontSize="6" fontFamily="var(--font-display)">{rpm} RPM</text>
    </svg>
  );
}

export function HaloDashboard({ design, speed, rpm, animated }: { design: DesignId; speed: number; rpm: number; animated: boolean }) {
  const d = DESIGNS.find((x) => x.id === design) ?? DESIGNS[0];
  const k = Math.min(speed / MAX, 1);
  const vars = { "--k": k, "--spin": `${Math.max(1.5, 12 - rpm / 700)}s` } as CSSProperties;
  return (
    <div className="absolute inset-0 overflow-hidden" style={vars}>
      <div className="halo-stage">
        <img src={d.img} alt={d.name} className="absolute inset-0 h-full w-full halo-bg" />
        <div className="absolute aspect-square -translate-x-1/2 -translate-y-1/2" style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%`, height: `${d.d * 100}%` }}>
          <div className={`absolute -inset-[18%] rounded-full halo-glow ${animated ? "" : "[animation:none]"}`} />
          {animated && <div className="absolute -inset-[6%] rounded-full halo-rays" />}
          <div className="absolute inset-[3%]"><Gauge speed={speed} rpm={rpm} /></div>
        </div>
      </div>
    </div>
  );
}

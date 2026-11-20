import { useRef, useState } from "react";
import { ScanLine, Usb, CheckCircle2, AlertTriangle, XCircle, Sparkles, Circle, LoaderCircle } from "lucide-react";
import scanImg from "@/assets/scanner-monte.png.asset.json";
import { Button } from "@/components/ui/button";
import { Elm327, demoScan, hasUsbSerial, realScan, type ScanItem } from "@/lib/obd";

const STEPS = ["Conectando ao veículo", "Motor", "Óleo", "Bateria", "Combustível", "Códigos de falha"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Scanner() {
  const [state, setState] = useState<"idle" | "scanning" | "done">("idle");
  const [step, setStep] = useState(0);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [mode, setMode] = useState<"usb" | "demo">("demo");
  const [msg, setMsg] = useState("");
  const elm = useRef<Elm327 | null>(null);

  const start = async (useUsb: boolean) => {
    setState("scanning"); setStep(0); setItems([]); setMsg("");
    const t0 = Date.now();
    let result: ScanItem[];
    try {
      if (useUsb) {
        elm.current = new Elm327();
        await elm.current.connect();
        setMode("usb");
        result = await realScan(elm.current, setStep);
        await elm.current.close();
      } else throw new Error("demo");
    } catch (e) {
      if (useUsb && (e as Error).message !== "demo") setMsg("Não foi possível ler o adaptador USB. Mostrando demonstração.");
      setMode("demo");
      for (let i = 1; i < STEPS.length; i++) { await sleep(900); setStep(i); }
      result = demoScan();
    }
    const left = 6000 - (Date.now() - t0);
    if (left > 0) await sleep(left);
    setStep(STEPS.length); setItems(result); setState("done");
  };

  const scanning = state === "scanning";
  const pct = Math.round((step / STEPS.length) * 100);
  const Icon = { ok: CheckCircle2, warn: AlertTriangle, bad: XCircle };
  const color = { ok: "text-primary", warn: "text-chart-4", bad: "text-destructive" };
  const bad = items.filter((i) => i.status !== "ok").length;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5 min-h-full">
      <div className="min-w-0 flex flex-col justify-center">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-background" data-scan-state={state}>
        <img src={scanImg.url} alt="Carro sobre um pedestal no pico de um monte" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2 rounded-md bg-background/80 px-3 py-2 text-primary"><ScanLine size={16} /><span className="hidden sm:inline">{scanning ? "DIAGNÓSTICO EM CURSO" : state === "done" ? "DIAGNÓSTICO CONCLUÍDO" : "SCANNER DO VEÍCULO"}</span></span>
          <span className="rounded-md bg-background/80 px-3 py-2 font-display">{pct}%</span>
        </div>
        {scanning && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="summit-scan-plane" />
            <svg viewBox="0 0 1000 563" className="absolute inset-0 h-full w-full text-primary" fill="none" stroke="currentColor">
              <g className="summit-scan-rings"><ellipse cx="500" cy="340" rx="288" ry="43" strokeWidth="2" /><ellipse cx="500" cy="340" rx="258" ry="34" strokeWidth="1" strokeDasharray="12 8" /></g>
              <g className="summit-scan-contour" strokeWidth="1.5"><path d="M280 325V260Q285 245 312 242L380 198Q400 183 454 180H552Q588 185 604 216L641 246V320" /><path d="M290 252H635M340 223H612M395 194H569" strokeDasharray="6 7" /></g>
              <g className="summit-scan-nodes"><circle cx="336" cy="277" r="5" /><circle cx="445" cy="312" r="5" /><circle cx="624" cy="300" r="5" /><path d="M336 277L300 235H240M445 312L460 365H520M624 300L675 260H750" strokeWidth="1" /></g>
            </svg>
          </div>
        )}
        {state === "done" && <div className="absolute bottom-4 right-4 rounded-full border border-primary bg-background/80 p-3 text-primary"><CheckCircle2 size={28} /></div>}
      </div>
        <div className="py-4" role="status" aria-live="polite">
          {state === "idle" && <p className="text-lg text-muted-foreground">Veículo pronto para diagnóstico</p>}
          {scanning && (
            <div>
              <div className="flex justify-between text-lg"><span className="flex items-center gap-2"><Sparkles size={18} className="text-primary" />{STEPS[Math.min(step, STEPS.length - 1)]}...</span><span className="font-display text-primary">{pct}%</span></div>
              <div className="mt-2 h-2 rounded-full bg-accent overflow-hidden"><div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} /></div>
            </div>
          )}
          {state === "done" && <p className="text-2xl font-bold">{bad === 0 ? "Veículo abençoado e em ordem! 🙏" : `Atenção: ${bad} item(ns) precisam de cuidado.`}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button disabled={scanning} onClick={() => start(true)} className="h-auto min-h-14 w-full whitespace-normal px-4 py-4 text-lg">
          <Usb size={26} />Escanear via USB
        </Button>
        <Button variant="outline" disabled={scanning} onClick={() => start(false)} className="h-auto min-h-14 w-full whitespace-normal px-4 py-4 text-base">
          <ScanLine size={22} />Escanear (demonstração)
        </Button>
        <ol className="my-2 border-y py-2">
          {STEPS.map((label, i) => {
            const complete = state === "done" || (scanning && i < step);
            const current = scanning && i === step;
            const StepIcon = complete ? CheckCircle2 : current ? LoaderCircle : Circle;
            return <li key={label} className={`flex items-center gap-3 py-2 text-sm ${complete || current ? "text-primary" : "text-muted-foreground"}`}><StepIcon size={16} className={current ? "animate-spin" : ""} /><span>{label}</span></li>;
          })}
        </ol>
        {!hasUsbSerial() && <p className="text-sm text-muted-foreground">Este aparelho não permite leitura USB pelo navegador; será usada a demonstração.</p>}
        {msg && <p className="text-sm text-chart-4">{msg}</p>}
        {items.length > 0 && (
          <div className="glass rounded-lg p-4">
            <p className="text-xs font-display tracking-widest text-primary mb-2">RESULTADO {mode === "demo" ? "· DEMONSTRAÇÃO" : "· USB"}</p>
            {items.map((it) => { const I = Icon[it.status]; return (
              <div key={it.key} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="flex items-center gap-2"><I size={18} className={color[it.status]} />{it.label}</span><span className="font-bold">{it.value}</span>
              </div>
            ); })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { ScanLine, Usb, CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import scanImg from "@/assets/scan-anjos.jpg.asset.json";
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
    <div className="grid lg:grid-cols-[1fr_340px] gap-4 h-full">
      <div className="relative glass rounded-lg overflow-hidden min-h-[320px]">
        <img src={scanImg.url} alt="Anjos escaneando o carro" className={`absolute inset-0 h-full w-full object-cover transition duration-1000 ${scanning ? "scale-105 brightness-110" : "brightness-75"}`} />
        {scanning && (
          <>
            <div className="absolute inset-0 animate-rays bg-[radial-gradient(ellipse_at_50%_55%,var(--primary),transparent_55%)] mix-blend-screen" />
            <div className="scan-beam absolute top-[40%] bottom-[18%] w-24" />
            <div className="absolute left-[20%] right-[20%] top-[45%] bottom-[22%] scan-grid" />
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-background to-transparent">
          {state === "idle" && <p className="text-xl">Toque em <b className="text-primary">Escanear</b> e deixe os anjos do Senhor examinarem seu veículo.</p>}
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
        <button disabled={scanning} onClick={() => start(true)} className="glass rounded-lg p-5 flex items-center gap-3 text-xl font-bold text-primary ring-1 ring-primary disabled:opacity-50">
          <Usb size={26} />Escanear via USB
        </button>
        <button disabled={scanning} onClick={() => start(false)} className="glass rounded-lg p-4 flex items-center gap-3 text-lg disabled:opacity-50">
          <ScanLine size={22} />Escanear (demonstração)
        </button>
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

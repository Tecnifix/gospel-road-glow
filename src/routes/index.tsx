import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Home, Gauge, Palette, Play, Pause, SkipBack, SkipForward, Volume2, Droplet, Thermometer, Fuel, Battery, Bluetooth, Wifi, Radio, Music, HandHeart, Flower2, X, ScanLine, KeyRound, ShoppingBag } from "lucide-react";
import { Scanner } from "@/components/Scanner";
import { HaloDashboard, type DesignId } from "@/components/HaloDashboard";
import { ThemeGallery } from "@/components/ThemeGallery";
import { Button } from "@/components/ui/button";
import { useThemeSelection } from "@/hooks/use-theme-selection";
import { useIsMobile } from "@/hooks/use-mobile";
import b1 from "@/assets/bencao-1.mp3.asset.json";
import b2 from "@/assets/bencao-2.mp3.asset.json";
import b3 from "@/assets/bencao-3.mp3.asset.json";
import v1 from "@/assets/versiculo-1.mp3.asset.json";
import v2 from "@/assets/versiculo-2.mp3.asset.json";
import welcome from "@/assets/boas-vindas.mp3.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AdoraDrive — Temas gospel para central multimídia" },
      { name: "description", content: "Fundos gospel animados com velocímetro, RPM, óleo e motor para sua central multimídia." },
      { property: "og:title", content: "AdoraDrive — Temas gospel" },
      { property: "og:description", content: "Personalize sua central multimídia com fé em cada trajeto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const VERSES = [
  ["Confie no Senhor de todo o seu coração.", "Provérbios 3:5"],
  ["O Senhor é o meu pastor; nada me faltará.", "Salmos 23:1"],
  ["Tudo posso naquele que me fortalece.", "Filipenses 4:13"],
  ["Ele dará ordens a seus anjos a seu respeito.", "Salmos 91:11"],
  ["Entrega o teu caminho ao Senhor, confia nele, e ele tudo fará.", "Salmos 37:5"],
  ["Não temas, porque eu sou contigo.", "Isaías 41:10"],
  ["O Senhor guardará a tua saída e a tua entrada.", "Salmos 121:8"],
  ["Sê forte e corajoso; o Senhor teu Deus é contigo por onde quer que andares.", "Josué 1:9"],
  ["A paz vos deixo, a minha paz vos dou.", "João 14:27"],
  ["Deus é o nosso refúgio e fortaleza.", "Salmos 46:1"],
];
const PRAYERS = [
  "Senhor, abençoa esta viagem. Guarda cada pessoa neste carro, livra-nos de todo perigo e conduz-nos em paz ao nosso destino. Em nome de Jesus, amém.",
  "Pai, coloca teus anjos ao redor deste veículo. Dá-me atenção, calma e prudência no trânsito. Que a tua paz nos acompanhe. Amém.",
  "Senhor Jesus, entrego este trajeto em tuas mãos. Protege-nos na ida e na volta. Amém.",
];
const RADIOS = [
  { name: "Melodia 97.5 FM", url: "https://26573.live.streamtheworld.com/MELODIAFMAAC.aac" },
  { name: "MGT Gospel", url: "https://cast.mgtradio.net/radio/8040/aac" },
  { name: "Gospel Hits", url: "https://webradio.bsoundradio.com.br/listen/gospelhits/live" },
  { name: "On Gospel", url: "https://radiosnet.site/stream/webradioongospel" },
  { name: "Gospel Kids", url: "https://radiosnet.site/stream/radiogospelkids" },
];
const PLAYLISTS = [
  ["Spotify · Gospel Hits", "https://open.spotify.com/search/gospel%20brasil/playlists"],
  ["Deezer · Louvor", "https://www.deezer.com/search/louvor/playlist"],
  ["YouTube Music · Adoração", "https://music.youtube.com/search?q=louvor+e+adora%C3%A7%C3%A3o"],
];
const PRAYER_AUDIO = [b1.url, b2.url, b3.url];
const VERSE_AUDIO: (string | undefined)[] = [v1.url, v2.url];
let voice: HTMLAudioElement | null = null;
function playVoice(url: string | undefined, fallback: string) {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel(); voice?.pause();
  if (url) { voice = new Audio(url); voice.play().catch(() => speak(fallback)); return; }
  speak(fallback);
}
function stopVoice() { voice?.pause(); window.speechSynthesis?.cancel(); }
function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = "pt-BR"; u.rate = 0.95;
  const v = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith("pt")); if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

function useTelemetry() {
  const [t, setT] = useState({ speed: 0, rpm: 800, oil: 85, engine: 88, fuel: 72, battery: 13.8, oilPress: 3.2 });
  useEffect(() => {
    let phase = 0;
    const id = setInterval(() => {
      phase += 0.05;
      setT((p) => {
        const speed = Math.max(0, Math.round(60 + 50 * Math.sin(phase) + Math.random() * 4));
        return {
          speed, rpm: Math.round(800 + speed * 32 + Math.random() * 120),
          oil: +(Math.min(110, p.oil + 0.05)).toFixed(0), engine: Math.round(88 + 4 * Math.sin(phase / 3)),
          fuel: Math.max(5, +(p.fuel - 0.01).toFixed(2)), battery: +(13.6 + Math.random() * 0.4).toFixed(1),
          oilPress: +(2 + speed / 60).toFixed(1),
        };
      });
    }, 500);
    return () => clearInterval(id);
  }, []);
  return t;
}

function Speedo({ speed, rpm }: { speed: number; rpm: number }) {
  const r = 120, c = 2 * Math.PI * r, arc = c * 0.75;
  const pct = Math.min(speed / 220, 1), rp = Math.min(rpm / 8000, 1);
  return (
    <div className="relative aspect-square w-full max-w-[300px]">
      <svg viewBox="0 0 300 300" className="w-full h-full -rotate-[225deg]">
        <circle cx="150" cy="150" r={r} fill="none" stroke="var(--border)" strokeWidth="14" strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
        <circle cx="150" cy="150" r={r} fill="none" stroke="var(--primary)" strokeWidth="14" strokeDasharray={`${arc * pct} ${c}`} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 8px var(--primary))", transition: "stroke-dasharray .5s" }} />
        <circle cx="150" cy="150" r={98} fill="none" stroke="var(--destructive)" strokeWidth="5" strokeDasharray={`${2 * Math.PI * 98 * 0.75 * rp} ${2 * Math.PI * 98}`} strokeLinecap="round" style={{ transition: "stroke-dasharray .5s" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl font-extrabold glow-text">{speed}</span>
        <span className="text-primary font-display text-sm tracking-widest">KM/H</span>
        <span className="mt-2 text-muted-foreground font-display text-xs">{rpm} RPM</span>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit, pct }: { icon: typeof Droplet; label: string; value: string | number; unit: string; pct: number }) {
  return (
    <div className="glass min-w-0 rounded-lg p-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-2 text-primary text-[10px] sm:text-xs font-display"><Icon size={16} />{label}</div>
      <div className="mt-2 text-2xl sm:text-3xl font-bold">{value}<span className="text-base text-muted-foreground ml-1">{unit}</span></div>
      <div className="mt-2 h-1.5 rounded-full bg-accent overflow-hidden"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, pct)}%` }} /></div>
    </div>
  );
}

function App() {
  const isMobile = useIsMobile(1024);
  const [tab, setTab] = useState<"home" | "cockpit" | "louvor" | "scanner" | "temas">("home");
  const { activeTheme, remaining, choose, stopTrial, notice } = useThemeSelection();
  const animated = activeTheme.premium;
  const design = activeTheme.design;
  const [now, setNow] = useState<Date | null>(null);
  const [verse, setVerse] = useState(0);
  const [radio, setRadio] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [radioErr, setRadioErr] = useState("");
  const [worship, setWorship] = useState(false);
  const [blessing, setBlessing] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [vol, setVol] = useState(60);
  const tel = useTelemetry();

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    const day = Math.floor(Date.now() / 86400000); setVerse(day % VERSES.length);
    if (localStorage.getItem("adora-bless") !== "0") setBlessing(PRAYERS[day % PRAYERS.length] ?? null);
    const v = setInterval(() => setVerse((x) => (x + 1) % VERSES.length), 30000);
    return () => { clearInterval(id); clearInterval(v); };
  }, []);
  useEffect(() => { if (audio.current) audio.current.volume = vol / 100; }, [vol]);
  const playToken = useRef(0);
  const stopRadio = () => {
    playToken.current++;
    const a = audio.current; if (!a) return;
    a.pause(); a.removeAttribute("src"); a.load();
    setPlaying(false); setLoading(false);
  };
  const playRadio = (i: number) => {
    const a = audio.current; if (!a) return;
    const token = ++playToken.current;
    setRadio(i); setRadioErr(""); setLoading(true);
    const station = RADIOS[i]; if (!station) return;
    a.src = station.url; a.volume = vol / 100;
    a.play()
      .then(() => { if (token === playToken.current) setPlaying(true); })
      .catch(() => { if (token === playToken.current) { setPlaying(false); setRadioErr("Rádio indisponível agora. Tente outra."); } })
      .finally(() => { if (token === playToken.current) setLoading(false); });
  };
  const isOn = () => { const a = audio.current; return !!a && (!a.paused || loading); };
  const toggleRadio = () => { if (isOn()) stopRadio(); else playRadio(radio); };
  const pickRadio = (i: number) => { if (i === radio && isOn()) stopRadio(); else playRadio(i); };

  const theme = activeTheme;
  const halo = tab === "home" && design !== "classico" && !worship;
  const motion = animated && tab === "home" && !worship;
  const skyBackground = tab !== "home" || worship;
  const picker = (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
      <Button variant="outline" onClick={() => setTab("temas")}><Palette />Temas</Button>
      <span className="min-w-0 text-sm text-primary">{activeTheme.name} · {animated ? "Premium" : "Free"}</span>
    </div>
  );
  const particles = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ left: (i * 37) % 100, dur: 8 + (i % 7) * 2, delay: (i % 9) * 1.3 })), []);
  const nav = [["home", Home, "Início"], ["cockpit", Gauge, "Cockpit"], ["louvor", Music, "Louvor"], ["scanner", ScanLine, "Scanner"], ["temas", Palette, "Temas"]] as const;

  return (
    <div className="adora-theme relative h-screen w-full overflow-hidden bg-background text-foreground" data-theme={activeTheme.palette}>
      {halo ? <>
        <div className="absolute inset-0 lg:hidden"><img src={theme.sky} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-background/60" /></div>
        {!isMobile && <div className="hidden lg:block"><HaloDashboard design={design as DesignId} speed={tel.speed} rpm={tel.rpm} animated={animated} /></div>}
      </> : <>
      <div className={skyBackground || design === "classico" ? "absolute inset-0" : "halo-stage"}>
        <img key={skyBackground ? theme.sky : theme.id} src={skyBackground ? theme.sky : theme.img} alt={skyBackground ? `Céu de ${theme.name}` : theme.name} className={`absolute inset-0 h-full w-full object-cover ${motion ? "animate-kenburns" : ""}`} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </>}
      {motion && <div className="absolute inset-0 pointer-events-none animate-rays bg-[radial-gradient(circle_at_65%_35%,var(--primary),transparent_45%)] mix-blend-soft-light" />}
      {motion && particles.map((p, i) => <span key={i} className="particle" style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />)}

      <aside className={`${worship ? "hidden" : ""} app-nav absolute inset-x-0 bottom-0 glass flex items-center justify-around gap-0 px-1 pt-2 z-20 lg:left-3 lg:right-auto lg:top-3 lg:bottom-3 lg:w-24 lg:rounded-lg lg:flex-col lg:justify-start lg:py-4 lg:gap-2`}>
        {nav.map(([id, Icon, label]) => (
          <Button variant="ghost" key={id} onClick={() => setTab(id)} className={`min-w-0 h-auto min-h-12 flex-1 px-1 py-1 lg:flex-none lg:w-20 lg:py-3 rounded-lg flex flex-col items-center gap-1 text-[10px] lg:text-sm transition [&_svg]:size-5 lg:[&_svg]:size-6 ${tab === id ? "bg-accent text-primary ring-1 ring-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon size={26} />{label}
          </Button>
        ))}
      </aside>

      <main className={`${worship ? "hidden" : ""} app-main absolute left-3 right-3 top-3 bottom-20 lg:left-32 lg:right-4 lg:bottom-3 z-10 flex min-w-0 flex-col`}>
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 lg:flex lg:justify-between shrink-0">
          <div className="min-w-0"><h1 className="font-display text-xl sm:text-3xl font-extrabold">Adora<span className="text-primary">Drive</span></h1><p className="text-[10px] sm:text-xs text-muted-foreground">FÉ EM CADA TRAJETO</p></div>
          <p className="hidden xl:block font-script text-3xl text-foreground/90">Deus guia, cuida e abençoa!</p>
          <div className="flex shrink-0 items-center gap-1 lg:gap-4 text-xl"><Button variant="ghost" onClick={() => setWorship(true)} aria-label="Modo Adoração" className="glass h-10 w-10 lg:w-auto rounded-lg p-2 lg:px-3 text-base flex items-center gap-2 text-primary"><Flower2 size={18} /><span className="hidden lg:inline">Modo Adoração</span></Button><Button variant="ghost" aria-label="Bênção da viagem" onClick={() => setBlessing(PRAYERS[Math.floor(Math.random() * PRAYERS.length)] ?? null)} className="h-10 w-10 p-2 text-primary"><HandHeart size={22} /></Button><Bluetooth size={20} className="hidden lg:block" /><Wifi size={20} className="hidden lg:block" /><span className="hidden lg:inline font-display">{now ? now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span></div>
        </header>
        <nav aria-label="Licença e loja" className="mt-2 flex justify-end gap-2 shrink-0">
          <Button asChild variant="outline" size="sm"><Link to="/ativacao"><KeyRound />Ativação</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/loja"><ShoppingBag />Loja</Link></Button>
        </nav>

        {(remaining > 0 || notice) && <div role="status" className="mt-3 shrink-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border bg-background/95 px-4 py-2 text-sm">
          <span>{remaining > 0 ? `Teste Premium · ${Math.floor(Math.ceil(remaining / 1000) / 60)}:${String(Math.ceil(remaining / 1000) % 60).padStart(2, "0")}` : notice}</span>
          {remaining > 0 && <Button variant="ghost" size="sm" onClick={stopTrial}><X />Encerrar teste</Button>}
        </div>}

        <section className="app-content flex-1 min-h-0 min-w-0 mt-4 overflow-x-hidden overflow-y-auto pb-3 lg:pb-0">
          {halo && (
            <div className="flex min-h-full flex-col gap-4 lg:h-full lg:justify-between lg:pointer-events-none">
              <div className="pointer-events-auto">{picker}</div>
              {isMobile && <div className="relative aspect-video w-full overflow-hidden rounded-lg border lg:hidden"><HaloDashboard design={design as DesignId} speed={tel.speed} rpm={tel.rpm} animated={animated} contained /></div>}
              <div className="grid grid-cols-1 gap-3 lg:flex lg:items-end lg:justify-between lg:gap-4">
                <div className="grid min-w-0 grid-cols-2 gap-3 lg:w-[300px] pointer-events-auto">
                  <Stat icon={Thermometer} label="MOTOR" value={tel.engine} unit="°C" pct={tel.engine / 1.3} />
                  <Stat icon={Droplet} label="ÓLEO" value={tel.oil} unit="°C" pct={tel.oil / 1.4} />
                </div>
                <div className="glass rounded-lg px-4 py-2 lg:max-w-sm text-center pointer-events-auto order-last lg:order-none">
                  <p className="italic">“{(VERSES[verse]?.[0] ?? "")}”</p><p className="text-primary text-sm">{(VERSES[verse]?.[1] ?? "")}</p>
                </div>
                <div className="grid min-w-0 grid-cols-2 gap-3 lg:w-[300px] pointer-events-auto">
                  <Stat icon={Fuel} label="COMBUSTÍVEL" value={tel.fuel.toFixed(0)} unit="%" pct={tel.fuel} />
                  <Stat icon={Battery} label="BATERIA" value={tel.battery} unit="V" pct={(tel.battery - 11) * 25} />
                </div>
              </div>
            </div>
          )}

          {tab === "home" && !halo && <div className="mb-3">{picker}<img src={theme.img} alt={theme.name} className="mt-4 aspect-video w-full rounded-lg object-contain lg:hidden" /></div>}
          {tab === "home" && !halo && (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 lg:h-full">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="font-display text-5xl sm:text-7xl lg:text-8xl font-extrabold">{now ? now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</div>
                  <div className="text-2xl capitalize">{now?.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}</div>
                  <blockquote className="mt-6 max-w-lg text-xl italic">“{(VERSES[verse]?.[0] ?? "")}”<footer className="text-primary not-italic mt-1">{(VERSES[verse]?.[1] ?? "")}</footer></blockquote>
                  <Button variant="ghost" onClick={() => playVoice(VERSE_AUDIO[verse], `${(VERSES[verse]?.[0] ?? "")} ${(VERSES[verse]?.[1] ?? "")}`)} className="mt-3 glass rounded-lg px-4 py-2 flex items-center gap-2 text-primary"><Volume2 size={18} />Ouvir versículo</Button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  <Stat icon={Gauge} label="VELOCIDADE" value={tel.speed} unit="km/h" pct={tel.speed / 2.2} />
                  <Stat icon={Thermometer} label="MOTOR" value={tel.engine} unit="°C" pct={tel.engine / 1.3} />
                  <Stat icon={Droplet} label="ÓLEO" value={tel.oil} unit="°C" pct={tel.oil / 1.4} />
                  <Stat icon={Fuel} label="COMBUSTÍVEL" value={tel.fuel.toFixed(0)} unit="%" pct={tel.fuel} />
                </div>
              </div>
              <div className="glass rounded-lg p-5 self-start">
                <div className="aspect-video rounded-lg overflow-hidden"><img src={theme.img} alt="" className="h-full w-full object-cover" /></div>
                <div className="mt-3 flex min-w-0 items-center gap-2 text-primary text-[10px] sm:text-xs font-display"><Radio size={14} />RÁDIO GOSPEL AO VIVO</div>
                <h3 className="text-2xl font-bold">{RADIOS[radio]?.name}</h3>
                <p className="text-muted-foreground text-sm">{loading ? "Conectando..." : playing ? "Tocando agora" : radioErr || "Pausado"}</p>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <Button variant="ghost" aria-label="Anterior" onClick={() => playRadio((radio + RADIOS.length - 1) % RADIOS.length)}><SkipBack size={30} /></Button>
                  <Button variant="ghost" aria-label={playing ? "Pausar" : "Tocar"} onClick={toggleRadio} className="h-16 w-16 rounded-full ring-2 ring-primary flex items-center justify-center text-primary">{playing || loading ? <Pause size={30} /> : <Play size={30} />}</Button>
                  <Button variant="ghost" aria-label="Próxima" onClick={() => playRadio((radio + 1) % RADIOS.length)}><SkipForward size={30} /></Button>
                </div>
                <div className="flex items-center gap-3 mt-4"><Volume2 size={20} /><input type="range" value={vol} onChange={(e) => setVol(+e.target.value)} className="w-full accent-[var(--primary)]" /><span className="w-8 text-sm">{vol}</span></div>
              </div>
            </div>
          )}

          {tab === "cockpit" && (
            <div className="grid lg:grid-cols-[auto_minmax(0,1fr)] gap-4 lg:gap-6 items-center lg:h-full">
              <div className="glass aspect-square w-full max-w-[332px] justify-self-center rounded-full p-4"><Speedo speed={tel.speed} rpm={tel.rpm} /></div>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                <Stat icon={Gauge} label="RPM" value={tel.rpm} unit="rpm" pct={tel.rpm / 80} />
                <Stat icon={Thermometer} label="TEMP. MOTOR" value={tel.engine} unit="°C" pct={tel.engine / 1.3} />
                <Stat icon={Droplet} label="TEMP. ÓLEO" value={tel.oil} unit="°C" pct={tel.oil / 1.4} />
                <Stat icon={Droplet} label="PRESSÃO ÓLEO" value={tel.oilPress} unit="bar" pct={tel.oilPress * 20} />
                <Stat icon={Fuel} label="COMBUSTÍVEL" value={tel.fuel.toFixed(1)} unit="%" pct={tel.fuel} />
                <Stat icon={Battery} label="BATERIA" value={tel.battery} unit="V" pct={(tel.battery - 11) * 25} />
              </div>
            </div>
          )}

          {tab === "scanner" && <Scanner />}

          {tab === "louvor" && (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="glass min-w-0 rounded-lg p-3 sm:p-4">
                <h2 className="font-display text-primary tracking-widest text-sm mb-3">RÁDIOS GOSPEL</h2>
                {RADIOS.map((r, i) => (
                  <Button variant="ghost" key={r.name} onClick={() => pickRadio(i)} className={`h-auto min-h-12 w-full flex items-center justify-between rounded-lg px-4 py-3 mb-2 text-left text-lg ${i === radio && playing ? "bg-accent text-primary ring-1 ring-primary" : "hover:bg-accent"}`}>
                    <span className="flex items-center gap-3"><Radio size={18} />{r.name}</span>{i === radio && playing ? <Pause size={18} /> : <Play size={18} />}
                  </Button>
                ))}
                {radioErr && <p className="text-destructive text-sm">{radioErr}</p>}
                <div className="flex items-center gap-3 mt-3"><Volume2 size={20} /><input type="range" value={vol} onChange={(e) => setVol(+e.target.value)} className="w-full accent-[var(--primary)]" /></div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="glass min-w-0 rounded-lg p-3 sm:p-4">
                  <h2 className="font-display text-primary tracking-widest text-sm mb-3">PLAYLISTS</h2>
                  {PLAYLISTS.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-4 py-3 text-lg hover:bg-accent"><Music size={18} />{n}</a>)}
                </div>
                <div className="glass min-w-0 rounded-lg p-3 sm:p-4">
                  <h2 className="font-display text-primary tracking-widest text-sm mb-3">ORAÇÕES DE VIAGEM</h2>
                  {PRAYERS.map((p, i) => <Button variant="ghost" key={p} onClick={() => playVoice(PRAYER_AUDIO[i], p)} className="h-auto whitespace-normal w-full text-left justify-start flex gap-3 rounded-lg px-3 py-2 hover:bg-accent text-muted-foreground"><Volume2 size={18} className="shrink-0 text-primary mt-1" />{p}</Button>)}
                  <label className="flex items-center gap-3 mt-3 cursor-pointer"><input type="checkbox" defaultChecked={typeof window !== "undefined" && localStorage.getItem("adora-bless") !== "0"} onChange={(e) => localStorage.setItem("adora-bless", e.target.checked ? "1" : "0")} className="accent-[var(--primary)] h-5 w-5" />Mostrar bênção ao ligar</label>
                </div>
              </div>
            </div>
          )}

          {tab === "temas" && <ThemeGallery activeId={activeTheme.id} onSelect={(id) => { choose(id); setTab("home"); }} />}

        </section>
      </main>

      <audio ref={audio} preload="none" onError={() => { if (audio.current?.getAttribute("src")) { setPlaying(false); setLoading(false); setRadioErr("Rádio indisponível agora. Tente outra."); } }} />

      {worship && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-4 sm:px-10 bg-background/40 overflow-y-auto">
          <Button variant="ghost" aria-label="Sair do Modo Adoração" onClick={() => setWorship(false)} className="absolute top-5 right-5 glass rounded-full p-3"><X size={26} /></Button>
          <Flower2 size={40} className="text-primary" />
          <p className="mt-6 max-w-3xl text-2xl sm:text-4xl italic glow-text">“{(VERSES[verse]?.[0] ?? "")}”</p>
          <p className="mt-3 text-2xl text-primary">{(VERSES[verse]?.[1] ?? "")}</p>
          <div className="mt-6 sm:mt-10 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:gap-6">
            <Button variant="ghost" onClick={toggleRadio} className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-full ring-2 ring-primary flex items-center justify-center text-primary glass">{playing || loading ? <Pause size={36} /> : <Play size={36} />}</Button>
            <div className="text-left"><p className="text-2xl font-bold">{RADIOS[radio]?.name}</p><p className="text-muted-foreground">{tel.speed} km/h · {now?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p></div>
          </div>
        </div>
      )}

      {blessing && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass w-full rounded-lg p-5 sm:p-8 max-w-xl max-h-full overflow-y-auto text-center">
            <HandHeart size={40} className="mx-auto text-primary" />
            <h2 className="font-display text-xl sm:text-2xl mt-3">Bênção da viagem</h2>
            <p className="mt-4 text-lg sm:text-xl leading-relaxed">{blessing}</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 justify-center gap-3">
              <Button variant="ghost" onClick={() => playVoice(PRAYER_AUDIO[PRAYERS.indexOf(blessing)], blessing)} className="glass h-auto min-h-12 rounded-lg px-5 py-3 flex items-center gap-2 text-primary"><Volume2 size={18} />Ouvir oração</Button>
              <Button variant="ghost" onClick={() => { stopVoice(); setBlessing(null); playVoice(welcome.url, "Bem-vindo ao AdoraDrive. Que Deus guie, cuide e abençoe o seu caminho hoje."); }} className="h-auto min-h-12 rounded-lg px-5 py-3 bg-primary text-primary-foreground font-bold">Amém, vamos!</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

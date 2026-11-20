import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Home, Gauge, Palette, Sparkles, Play, Pause, SkipBack, SkipForward, Volume2, Droplet, Thermometer, Fuel, Battery, Copy, Check, Bluetooth, Wifi, Radio, Music, HandHeart, Flower2, X } from "lucide-react";
import jesus from "@/assets/fundo-jesus.jpg.asset.json";
import anjo from "@/assets/fundo-anjo.jpg.asset.json";
import cruz from "@/assets/fundo-cruz.jpg.asset.json";
import pomba from "@/assets/fundo-pomba.jpg.asset.json";

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

const THEMES = [
  { id: "jesus", name: "Luz do Mundo", img: jesus.url, accent: "oklch(0.8 0.15 75)" },
  { id: "anjo", name: "Anjo da Estrada", img: anjo.url, accent: "oklch(0.78 0.12 230)" },
  { id: "cruz", name: "Monte Calvário", img: cruz.url, accent: "oklch(0.72 0.17 50)" },
  { id: "pomba", name: "Espírito Santo", img: pomba.url, accent: "oklch(0.8 0.11 190)" },
];
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
function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = "pt-BR"; u.rate = 0.95;
  const v = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith("pt")); if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}
const PROMPTS: [string, string][] = [
  ["Fundo estático — Jesus", "Wallpaper cinematográfico 16:9 para central multimídia automotiva, silhueta de Jesus Cristo de braços abertos no alto de um monte ao nascer do sol, raios de luz divina dourados, nuvens volumosas, lado esquerdo e bordas escuras para sobrepor velocímetro e widgets, sem texto, ultra detalhado, 4K."],
  ["Fundo estático — Anjo", "Wallpaper 16:9 para painel de carro, anjo majestoso de asas brancas luminosas protegendo uma estrada vazia à noite, luz azul e dourada, estrelas, espaço livre no centro para velocímetro circular, sem texto, estilo cinematográfico, 4K."],
  ["Vídeo em loop (Flow / Veo)", "Vídeo em loop perfeito de 8 segundos, câmera fixa. Silhueta de Jesus de braços abertos no monte ao nascer do sol; raios de luz pulsam suavemente, nuvens se movem devagar, partículas douradas sobem. Sem cortes, sem texto. Termina no mesmo enquadramento do início. Áudio: nenhum."],
  ["Vídeo em loop — Anjo na estrada", "Loop de 8 segundos, câmera fixa. Anjo de asas brancas sobre a rodovia à noite, asas se movendo lentamente, faróis distantes passando, estrelas cintilando, brilho dourado pulsando. Sem texto, sem cortes, final igual ao início."],
  ["Interface completa (referência)", "Tela de central multimídia automotiva 1280x720 tema gospel dourado: logo 'AdoraDrive – Fé em cada trajeto', relógio grande, versículo do dia, velocímetro circular neon dourado com RPM, cards de temperatura do motor, pressão do óleo, combustível e bateria em vidro fosco, player de louvor, barra lateral com ícones, fundo com cruz ao pôr do sol."],
];

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
    <div className="relative w-[300px] h-[300px]">
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
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 text-primary text-xs font-display tracking-widest"><Icon size={16} />{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}<span className="text-base text-muted-foreground ml-1">{unit}</span></div>
      <div className="mt-2 h-1.5 rounded-full bg-accent overflow-hidden"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, pct)}%` }} /></div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<"home" | "cockpit" | "louvor" | "temas" | "prompts">("home");
  const [themeId, setThemeId] = useState("jesus");
  const [animated, setAnimated] = useState(true);
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
  const [copied, setCopied] = useState(-1);
  const tel = useTelemetry();

  useEffect(() => {
    const s = localStorage.getItem("adora-theme"); if (s) setThemeId(s);
    const a = localStorage.getItem("adora-anim"); if (a) setAnimated(a === "1");
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    const day = Math.floor(Date.now() / 86400000); setVerse(day % VERSES.length);
    if (localStorage.getItem("adora-bless") !== "0") setBlessing(PRAYERS[day % PRAYERS.length]!);
    const v = setInterval(() => setVerse((x) => (x + 1) % VERSES.length), 30000);
    return () => { clearInterval(id); clearInterval(v); };
  }, []);
  useEffect(() => { localStorage.setItem("adora-theme", themeId); }, [themeId]);
  useEffect(() => { localStorage.setItem("adora-anim", animated ? "1" : "0"); }, [animated]);
  useEffect(() => { if (audio.current) audio.current.volume = vol / 100; }, [vol]);
  const playRadio = (i: number) => {
    const a = audio.current; if (!a) return;
    setRadio(i); setRadioErr(""); setLoading(true);
    a.src = RADIOS[i]!.url; a.volume = vol / 100;
    a.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); setRadioErr("Rádio indisponível agora. Tente outra."); }).finally(() => setLoading(false));
  };
  const toggleRadio = () => { const a = audio.current; if (!a) return; if (playing) { a.pause(); setPlaying(false); } else playRadio(radio); };

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;
  const particles = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ left: (i * 37) % 100, dur: 8 + (i % 7) * 2, delay: (i % 9) * 1.3 })), []);
  const nav = [["home", Home, "Início"], ["cockpit", Gauge, "Cockpit"], ["louvor", Music, "Louvor"], ["temas", Palette, "Temas"], ["prompts", Sparkles, "Prompts"]] as const;

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ "--primary": theme.accent, "--border": `color-mix(in oklch, ${theme.accent} 35%, transparent)`, "--accent": `color-mix(in oklch, ${theme.accent} 18%, transparent)` } as CSSProperties}>
      <img key={theme.id} src={theme.img} alt={theme.name} className={`absolute inset-0 h-full w-full object-cover ${animated ? "animate-kenburns" : ""}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      {animated && <div className="absolute inset-0 pointer-events-none animate-rays bg-[radial-gradient(circle_at_65%_35%,var(--primary),transparent_45%)] mix-blend-soft-light" />}
      {animated && particles.map((p, i) => <span key={i} className="particle" style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />)}

      <aside className={`${worship ? "hidden" : ""} absolute left-3 top-3 bottom-3 w-24 glass rounded-lg flex flex-col items-center py-4 gap-2 z-10`}>
        {nav.map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`w-20 py-3 rounded-lg flex flex-col items-center gap-1 text-sm transition ${tab === id ? "bg-accent text-primary ring-1 ring-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon size={26} />{label}
          </button>
        ))}
      </aside>

      <main className={`${worship ? "hidden" : ""} absolute left-32 right-4 top-3 bottom-3 z-10 flex flex-col`}>
        <header className="flex items-center justify-between">
          <div><h1 className="font-display text-3xl font-extrabold">Adora<span className="text-primary">Drive</span></h1><p className="text-xs tracking-[0.3em] text-muted-foreground">FÉ EM CADA TRAJETO</p></div>
          <p className="hidden md:block font-script text-3xl text-foreground/90">Deus guia, cuida e abençoa!</p>
          <div className="flex items-center gap-4 text-xl"><button onClick={() => setWorship(true)} className="glass rounded-lg px-3 py-1.5 text-base flex items-center gap-2 text-primary"><Flower2 size={18} />Modo Adoração</button><button aria-label="Bênção da viagem" onClick={() => setBlessing(PRAYERS[Math.floor(Math.random() * PRAYERS.length)]!)} className="text-primary"><HandHeart size={22} /></button><Bluetooth size={20} /><Wifi size={20} /><span className="font-display">{now ? now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span></div>
        </header>

        <section className="flex-1 min-h-0 mt-4 overflow-auto">
          {tab === "home" && (
            <div className="grid lg:grid-cols-[1fr_360px] gap-4 h-full">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="font-display text-8xl font-extrabold">{now ? now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</div>
                  <div className="text-2xl capitalize">{now?.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}</div>
                  <blockquote className="mt-6 max-w-lg text-xl italic">“{VERSES[verse]![0]}”<footer className="text-primary not-italic mt-1">{VERSES[verse]![1]}</footer></blockquote>
                  <button onClick={() => speak(`${VERSES[verse]![0]} ${VERSES[verse]![1]}`)} className="mt-3 glass rounded-lg px-4 py-2 flex items-center gap-2 text-primary"><Volume2 size={18} />Ouvir versículo</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <Stat icon={Gauge} label="VELOCIDADE" value={tel.speed} unit="km/h" pct={tel.speed / 2.2} />
                  <Stat icon={Thermometer} label="MOTOR" value={tel.engine} unit="°C" pct={tel.engine / 1.3} />
                  <Stat icon={Droplet} label="ÓLEO" value={tel.oil} unit="°C" pct={tel.oil / 1.4} />
                  <Stat icon={Fuel} label="COMBUSTÍVEL" value={tel.fuel.toFixed(0)} unit="%" pct={tel.fuel} />
                </div>
              </div>
              <div className="glass rounded-lg p-5 self-start">
                <div className="aspect-video rounded-lg overflow-hidden"><img src={theme.img} alt="" className="h-full w-full object-cover" /></div>
                <div className="mt-3 flex items-center gap-2 text-primary text-xs font-display tracking-widest"><Radio size={14} />RÁDIO GOSPEL AO VIVO</div>
                <h3 className="text-2xl font-bold">{RADIOS[radio]!.name}</h3>
                <p className="text-muted-foreground text-sm">{loading ? "Conectando..." : playing ? "Tocando agora" : radioErr || "Pausado"}</p>
                <div className="flex items-center justify-center gap-6 mt-2">
                  <button aria-label="Anterior" onClick={() => playRadio((radio + RADIOS.length - 1) % RADIOS.length)}><SkipBack size={30} /></button>
                  <button aria-label={playing ? "Pausar" : "Tocar"} onClick={toggleRadio} className="h-16 w-16 rounded-full ring-2 ring-primary flex items-center justify-center text-primary">{playing ? <Pause size={30} /> : <Play size={30} />}</button>
                  <button aria-label="Próxima" onClick={() => playRadio((radio + 1) % RADIOS.length)}><SkipForward size={30} /></button>
                </div>
                <div className="flex items-center gap-3 mt-4"><Volume2 size={20} /><input type="range" value={vol} onChange={(e) => setVol(+e.target.value)} className="w-full accent-[var(--primary)]" /><span className="w-8 text-sm">{vol}</span></div>
              </div>
            </div>
          )}

          {tab === "cockpit" && (
            <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-center h-full">
              <div className="glass rounded-full p-4"><Speedo speed={tel.speed} rpm={tel.rpm} /></div>
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

          {tab === "louvor" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass rounded-lg p-4">
                <h2 className="font-display text-primary tracking-widest text-sm mb-3">RÁDIOS GOSPEL</h2>
                {RADIOS.map((r, i) => (
                  <button key={r.name} onClick={() => playRadio(i)} className={`w-full flex items-center justify-between rounded-lg px-4 py-3 mb-2 text-left text-lg ${i === radio && playing ? "bg-accent text-primary ring-1 ring-primary" : "hover:bg-accent"}`}>
                    <span className="flex items-center gap-3"><Radio size={18} />{r.name}</span>{i === radio && playing ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                ))}
                {radioErr && <p className="text-destructive text-sm">{radioErr}</p>}
                <div className="flex items-center gap-3 mt-3"><Volume2 size={20} /><input type="range" value={vol} onChange={(e) => setVol(+e.target.value)} className="w-full accent-[var(--primary)]" /></div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="glass rounded-lg p-4">
                  <h2 className="font-display text-primary tracking-widest text-sm mb-3">PLAYLISTS</h2>
                  {PLAYLISTS.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-4 py-3 text-lg hover:bg-accent"><Music size={18} />{n}</a>)}
                </div>
                <div className="glass rounded-lg p-4">
                  <h2 className="font-display text-primary tracking-widest text-sm mb-3">ORAÇÕES DE VIAGEM</h2>
                  {PRAYERS.map((p) => <button key={p} onClick={() => speak(p)} className="w-full text-left flex gap-3 rounded-lg px-3 py-2 hover:bg-accent text-muted-foreground"><Volume2 size={18} className="shrink-0 text-primary mt-1" />{p}</button>)}
                  <label className="flex items-center gap-3 mt-3 cursor-pointer"><input type="checkbox" defaultChecked={typeof window !== "undefined" && localStorage.getItem("adora-bless") !== "0"} onChange={(e) => localStorage.setItem("adora-bless", e.target.checked ? "1" : "0")} className="accent-[var(--primary)] h-5 w-5" />Mostrar bênção ao ligar</label>
                </div>
              </div>
            </div>
          )}

          {tab === "temas" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl">Escolha seu tema</h2>
                <label className="glass rounded-lg px-4 py-2 flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={animated} onChange={(e) => setAnimated(e.target.checked)} className="accent-[var(--primary)] h-5 w-5" />Fundo animado</label>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {THEMES.map((t) => (
                  <button key={t.id} onClick={() => setThemeId(t.id)} className={`glass rounded-lg overflow-hidden text-left transition ${t.id === themeId ? "ring-2 ring-primary scale-[1.02]" : "hover:scale-[1.02]"}`}>
                    <img src={t.img} alt={t.name} className="aspect-video w-full object-cover" />
                    <div className="p-3 flex items-center justify-between"><span className="text-lg font-bold">{t.name}</span><span className="h-4 w-4 rounded-full" style={{ background: t.accent }} /></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "prompts" && (
            <div className="grid md:grid-cols-2 gap-4">
              {PROMPTS.map(([title, text], i) => (
                <div key={title} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between"><h3 className="text-primary font-display text-sm tracking-widest">{title}</h3>
                    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(-1), 1500); }} className="flex items-center gap-1 text-sm">{copied === i ? <Check size={16} /> : <Copy size={16} />}{copied === i ? "Copiado" : "Copiar"}</button>
                  </div>
                  <p className="mt-2 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <audio ref={audio} preload="none" onError={() => { if (audio.current?.src) { setPlaying(false); setLoading(false); setRadioErr("Rádio indisponível agora. Tente outra."); } }} />

      {worship && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-10 bg-background/40">
          <button aria-label="Sair do Modo Adoração" onClick={() => setWorship(false)} className="absolute top-5 right-5 glass rounded-full p-3"><X size={26} /></button>
          <Flower2 size={40} className="text-primary" />
          <p className="mt-6 max-w-3xl text-4xl italic glow-text">“{VERSES[verse]![0]}”</p>
          <p className="mt-3 text-2xl text-primary">{VERSES[verse]![1]}</p>
          <div className="mt-10 flex items-center gap-6">
            <button onClick={toggleRadio} className="h-20 w-20 rounded-full ring-2 ring-primary flex items-center justify-center text-primary glass">{playing ? <Pause size={36} /> : <Play size={36} />}</button>
            <div className="text-left"><p className="text-2xl font-bold">{RADIOS[radio]!.name}</p><p className="text-muted-foreground">{tel.speed} km/h · {now?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p></div>
          </div>
        </div>
      )}

      {blessing && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="glass rounded-lg p-8 max-w-xl text-center">
            <HandHeart size={40} className="mx-auto text-primary" />
            <h2 className="font-display text-2xl mt-3">Bênção da viagem</h2>
            <p className="mt-4 text-xl leading-relaxed">{blessing}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => speak(blessing)} className="glass rounded-lg px-5 py-3 flex items-center gap-2 text-primary"><Volume2 size={18} />Ouvir oração</button>
              <button onClick={() => { window.speechSynthesis?.cancel(); setBlessing(null); }} className="rounded-lg px-5 py-3 bg-primary text-primary-foreground font-bold">Amém, vamos!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

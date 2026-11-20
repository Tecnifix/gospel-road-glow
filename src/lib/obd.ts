// Leitura OBD2 via adaptador ELM327 USB usando Web Serial (Chrome/Android WebView).
// Quando não houver adaptador, o scanner roda em modo demonstração.
type SerialPortLike = {
  open(o: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
};

export type ScanItem = { key: string; label: string; value: string; status: "ok" | "warn" | "bad" };

export const hasUsbSerial = () => typeof navigator !== "undefined" && "serial" in navigator;

export class Elm327 {
  private port: SerialPortLike | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private dec = new TextDecoder();

  async connect() {
    const serial = (navigator as unknown as { serial: { requestPort(): Promise<SerialPortLike> } }).serial;
    this.port = await serial.requestPort();
    await this.port.open({ baudRate: 38400 });
    this.reader = this.port.readable.getReader();
    for (const c of ["ATZ", "ATE0", "ATL0", "ATS0", "ATSP0"]) await this.cmd(c);
  }

  async cmd(c: string, timeout = 4000): Promise<string> {
    if (!this.port || !this.reader) throw new Error("Não conectado");
    const w = this.port.writable.getWriter();
    await w.write(new TextEncoder().encode(c + "\r"));
    w.releaseLock();
    let out = "";
    const end = Date.now() + timeout;
    while (!out.includes(">") && Date.now() < end) {
      const r = await Promise.race([this.reader.read(), new Promise<null>((res) => setTimeout(() => res(null), 500))]);
      if (r && r.value) out += this.dec.decode(r.value);
      if (r && r.done) break;
    }
    return out.replace(/[>\r]/g, " ").replace(/SEARCHING\.\.\./g, "").trim();
  }

  async pid(p: string): Promise<number[] | null> {
    const r = (await this.cmd("01" + p)).replace(/\s/g, "");
    const i = r.indexOf("41" + p);
    if (i < 0) return null;
    const hex = r.slice(i + 4);
    const bytes: number[] = [];
    for (let k = 0; k + 1 < hex.length && bytes.length < 4; k += 2) bytes.push(parseInt(hex.slice(k, k + 2), 16));
    return bytes;
  }

  async dtcs(): Promise<string[]> {
    const r = (await this.cmd("03", 6000)).replace(/\s/g, "");
    const i = r.indexOf("43");
    if (i < 0) return [];
    const data = r.slice(i + 2);
    const codes: string[] = [];
    for (let k = 0; k + 3 < data.length; k += 4) {
      const v = data.slice(k, k + 4);
      if (v === "0000") continue;
      const first = parseInt(v[0]!, 16);
      codes.push("PCBU"[first >> 2]! + (first & 3) + v.slice(1));
    }
    return codes;
  }

  async close() {
    try { this.reader?.releaseLock(); await this.port?.close(); } catch { /* ignore */ }
  }
}

export async function realScan(elm: Elm327, onStep: (i: number) => void): Promise<ScanItem[]> {
  const items: ScanItem[] = [];
  onStep(1);
  const temp = await elm.pid("05");
  items.push(temp ? { key: "motor", label: "Temperatura do motor", value: `${temp[0]! - 40} °C`, status: temp[0]! - 40 > 105 ? "bad" : "ok" } : { key: "motor", label: "Temperatura do motor", value: "N/D", status: "warn" });
  onStep(2);
  const oil = await elm.pid("5C");
  items.push(oil ? { key: "oleo", label: "Temperatura do óleo", value: `${oil[0]! - 40} °C`, status: oil[0]! - 40 > 120 ? "bad" : "ok" } : { key: "oleo", label: "Temperatura do óleo", value: "N/D", status: "warn" });
  onStep(3);
  const v = await elm.cmd("ATRV");
  const volts = parseFloat(v);
  items.push({ key: "bateria", label: "Bateria", value: isNaN(volts) ? "N/D" : `${volts.toFixed(1)} V`, status: isNaN(volts) ? "warn" : volts < 12.2 ? "bad" : "ok" });
  onStep(4);
  const fuel = await elm.pid("2F");
  items.push(fuel ? { key: "comb", label: "Combustível", value: `${Math.round((fuel[0]! * 100) / 255)} %`, status: fuel[0]! < 25 ? "warn" : "ok" } : { key: "comb", label: "Combustível", value: "N/D", status: "warn" });
  onStep(5);
  const codes = await elm.dtcs();
  items.push({ key: "falhas", label: "Códigos de falha", value: codes.length ? codes.join(", ") : "Nenhuma falha", status: codes.length ? "bad" : "ok" });
  return items;
}

export function demoScan(): ScanItem[] {
  return [
    { key: "motor", label: "Temperatura do motor", value: "89 °C", status: "ok" },
    { key: "oleo", label: "Temperatura do óleo", value: "92 °C", status: "ok" },
    { key: "bateria", label: "Bateria", value: "12.1 V", status: "warn" },
    { key: "comb", label: "Combustível", value: "68 %", status: "ok" },
    { key: "falhas", label: "Códigos de falha", value: "Nenhuma falha", status: "ok" },
  ];
}

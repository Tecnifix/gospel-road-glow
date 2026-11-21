import { z } from 'zod';
import type { ScanItem } from '@/lib/obd';

export const scanItemSchema = z.object({ key: z.enum(['motor', 'oleo', 'bateria', 'comb', 'falhas']), label: z.string().max(80), value: z.string().max(500), status: z.enum(['ok', 'warn', 'bad', 'unavailable']) });
export const scanItemsSchema = z.array(scanItemSchema).length(5);
export type ScanRecord = { id: string; vehicle: string; mode: 'usb' | 'demo'; items: ScanItem[]; created_at: string };
const DTC: Record<string, string> = {
 P0100: 'Circuito do sensor de fluxo de ar (MAF).', P0101: 'Leitura do fluxo de ar fora da faixa esperada.',
 P0115: 'Circuito do sensor de temperatura do líquido de arrefecimento.', P0128: 'Motor não atingiu a temperatura esperada de funcionamento.',
 P0130: 'Circuito da sonda de oxigênio (banco 1, sensor 1).', P0171: 'Mistura pobre: excesso de ar ou falta de combustível (banco 1).',
 P0172: 'Mistura rica: excesso de combustível (banco 1).', P0300: 'Falhas de combustão aleatórias ou em vários cilindros.',
 P0301: 'Falha de combustão no cilindro 1.', P0302: 'Falha de combustão no cilindro 2.', P0303: 'Falha de combustão no cilindro 3.', P0304: 'Falha de combustão no cilindro 4.',
 P0420: 'Eficiência do catalisador abaixo do esperado (banco 1).', P0442: 'Pequeno vazamento detectado no sistema de vapores de combustível.',
 P0455: 'Grande vazamento detectado no sistema de vapores de combustível.', P0562: 'Tensão baixa no sistema elétrico.',
};
export function explainDtc(code: string) {
 return DTC[code.toUpperCase()] ?? 'Código sem descrição neste catálogo. Consulte a documentação do fabricante; o significado pode variar conforme o veículo.';
}
export function itemExplanation(item: ScanItem) {
 if (item.status === 'unavailable') return 'O veículo ou adaptador não forneceu este dado. Isso não significa uma falha detectada.';
 if (item.key === 'falhas') return item.status === 'ok' ? 'Nenhum código armazenado retornou nesta leitura OBD. Outros sistemas podem não ter sido verificados.' : 'O código indica uma condição registrada, não a peça a substituir. Confirme a causa com uma oficina; não apague os códigos antes da avaliação.';
 if (item.key === 'bateria') return item.status === 'ok' ? 'Tensão dentro da referência desta leitura. A avaliação depende de o motor estar ligado ou desligado.' : 'Tensão baixa na leitura. Confira carga, terminais e alternador com uma oficina; não é um teste completo da bateria.';
 if (item.key === 'comb') return item.status === 'ok' ? 'Nível de combustível informado pelo veículo.' : 'Nível de combustível baixo. Planeje o abastecimento.';
 return item.status === 'ok' ? 'Temperatura dentro da referência desta leitura. Os limites podem variar conforme o fabricante.' : 'Temperatura elevada nesta leitura. Se houver superaquecimento ou luz de alerta, pare em local seguro e procure assistência.';
}
export function compareItems(current: ScanItem[], previous: ScanItem[]) {
 return current.map(item => {
  const before = previous.find(p => p.key === item.key);
  return { key: item.key, label: item.label, before: before?.value ?? 'Sem leitura anterior', after: item.value, changed: !!before && (before.value !== item.value || before.status !== item.status), comparable: !!before && before.status !== 'unavailable' && item.status !== 'unavailable' };
 });
}
export function previousRecord(record: ScanRecord, history: ScanRecord[]) {
 return history.filter(r => r.id !== record.id && r.vehicle === record.vehicle && r.mode === record.mode && r.created_at < record.created_at).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
}

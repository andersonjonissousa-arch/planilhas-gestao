// Regras de cálculo — reproduzem as fórmulas das abas da planilha original.
import type {
  AcaoAI,
  Conformidade,
  Indicador,
  IndicadorContratual,
  Interacao,
  LinhaFmea,
  LinhaPriorizacao,
  Status,
  TipoCalculo,
} from '../types';

export const chave = (ano: number, periodo: number) => `${ano}-${periodo}`;

export function mediana(valores: (number | null | undefined)[]): number | null {
  const v = valores.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export function soma(valores: (number | null | undefined)[]): number {
  return valores.reduce<number>((s, x) => s + (typeof x === 'number' && Number.isFinite(x) ? x : 0), 0);
}

export function media(valores: (number | null | undefined)[]): number | null {
  const v = valores.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  return v.length ? soma(v) / v.length : null;
}

// INDICADORES --------------------------------------------------------------

export const FATOR: Record<TipoCalculo, number> = { percentual: 100, densidade: 1000, taxa: 1, absoluto: 1 };

export const ROTULO_TIPO: Record<TipoCalculo, string> = {
  percentual: 'Percentual (num/den × 100)',
  densidade: 'Densidade (num/den × 1000)',
  taxa: 'Razão / média (num/den)',
  absoluto: 'Valor absoluto (numerador)',
};

/** Resultado de um período. Equivale a ABS(numerador/denominador) da base histórica. */
export function resultadoPeriodo(tipo: TipoCalculo, num: number | null | undefined, den: number | null | undefined): number | null {
  if (num == null || !Number.isFinite(num)) return null;
  if (tipo === 'absoluto') return num;
  if (den == null || !Number.isFinite(den) || den === 0) return null;
  return Math.abs(num / den) * FATOR[tipo];
}

export function periodosDoIndicador(ind: Pick<Indicador, 'periodicidade'>): number {
  return ind.periodicidade === 'trimestral' ? 4 : 12;
}

export function serieAno(ind: Indicador, ano: number): (number | null)[] {
  const n = periodosDoIndicador(ind);
  return Array.from({ length: n }, (_, i) => {
    const d = ind.dados[chave(ano, i + 1)];
    return d ? resultadoPeriodo(ind.tipoCalculo, d.num, d.den) : null;
  });
}

/** Resultado anual: soma dos numeradores / soma dos denominadores (ou soma, se absoluto). */
export function resultadoAnual(ind: Indicador, ano: number): number | null {
  const n = periodosDoIndicador(ind);
  const nums: (number | null)[] = [];
  const dens: (number | null)[] = [];
  for (let p = 1; p <= n; p++) {
    const d = ind.dados[chave(ano, p)];
    if (d && d.num != null) {
      nums.push(d.num);
      dens.push(d.den);
    }
  }
  if (!nums.length) return null;
  return resultadoPeriodo(ind.tipoCalculo, soma(nums), ind.tipoCalculo === 'absoluto' ? 1 : soma(dens));
}

export type Avaliacao = 'atingida' | 'nao-atingida' | 'neutra' | 'sem-dados';

/** Compara resultado com a meta conforme a polaridade (▲ maior melhor, ▼ menor melhor, ►◄ estabilidade). */
export function avaliarMeta(resultado: number | null, meta: number | null | undefined, polaridade: string): Avaliacao {
  if (resultado == null) return 'sem-dados';
  if (meta == null || !Number.isFinite(meta)) return 'neutra';
  if (polaridade === '▲') return resultado >= meta ? 'atingida' : 'nao-atingida';
  if (polaridade === '▼') return resultado <= meta ? 'atingida' : 'nao-atingida';
  return 'neutra';
}

export function ultimoResultado(ind: Indicador): { ano: number; periodo: number; valor: number } | null {
  const n = periodosDoIndicador(ind);
  let melhor: { ano: number; periodo: number; valor: number } | null = null;
  for (const k of Object.keys(ind.dados)) {
    const [a, p] = k.split('-').map(Number);
    if (p > n) continue;
    const v = resultadoPeriodo(ind.tipoCalculo, ind.dados[k].num, ind.dados[k].den);
    if (v == null) continue;
    if (!melhor || a > melhor.ano || (a === melhor.ano && p > melhor.periodo)) melhor = { ano: a, periodo: p, valor: v };
  }
  return melhor;
}

// INDICADORES CONTRATUAIS -----------------------------------------------------

/**
 * % Realizado mensal.
 *  ▲  resultado / meta  (fórmula =B/C da planilha)
 *  ▼  100% enquanto resultado ≤ meta; acima disso, 2 − resultado/meta (fórmula =IF(B<=10,1,1-(B/10)+1)), mínimo 0
 */
export function realizadoContratual(polaridade: '▲' | '▼', resultado: number | null | undefined, meta: number | null | undefined): number | null {
  if (resultado == null || meta == null || !Number.isFinite(resultado) || !Number.isFinite(meta) || meta === 0) return null;
  if (polaridade === '▼') return resultado <= meta ? 1 : Math.max(0, 2 - resultado / meta);
  return resultado / meta > 0 ? resultado / meta : 0;
}

export function realizadoTrimestral(ind: IndicadorContratual, ano: number, trimestre: number): number | null {
  const v = [1, 2, 3].map((i) => {
    const d = ind.dados[chave(ano, (trimestre - 1) * 3 + i)];
    return d ? realizadoContratual(ind.polaridade, d.resultado, d.meta) : null;
  });
  return media(v);
}

// MAPEAMENTO — MATRIZ DE PRIORIZAÇÃO -------------------------------------

export function totalPriorizacao(l: LinhaPriorizacao): number {
  return soma([l.financeiro, l.assistencia, l.perfil, l.estrategia]);
}

/** Legenda da planilha: 4-8 baixa · 9-13 média · 14-18 alta · ≥19 muito alta */
export function classePriorizacao(total: number): { rotulo: string; nivel: 0 | 1 | 2 | 3 } {
  if (total >= 19) return { rotulo: 'MUITO ALTA PRIORIZAÇÃO', nivel: 3 };
  if (total >= 14) return { rotulo: 'ALTA PRIORIZAÇÃO', nivel: 2 };
  if (total >= 9) return { rotulo: 'MÉDIA PRIORIZAÇÃO', nivel: 1 };
  return { rotulo: 'BAIXA PRIORIZAÇÃO', nivel: 0 };
}

// INTERAÇÕES --------------------------------------------------------------

function percConformidade(valores: Conformidade[]): number | null {
  const c = valores.filter((v) => v === 'C').length;
  const nc = valores.filter((v) => v === 'NC').length;
  return c + nc ? c / (c + nc) : null;
}

/** % de conformidade de todas as interações em um mês. */
export function conformidadeMes(itens: Interacao[], ano: number, mes: number): number | null {
  return percConformidade(itens.map((i) => i.meses[chave(ano, mes)]?.conformidade ?? ''));
}

/** Coluna ANUAL: % de meses conformes de uma interação no ano. */
export function conformidadeAnual(item: Interacao, ano: number): number | null {
  return percConformidade(Array.from({ length: 12 }, (_, m) => item.meses[chave(ano, m + 1)]?.conformidade ?? ''));
}

/** % de conformidade de todas as interações em todos os meses do ano. */
export function conformidadeGeralAno(itens: Interacao[], ano: number): number | null {
  return percConformidade(itens.flatMap((i) => Array.from({ length: 12 }, (_, m) => i.meses[chave(ano, m + 1)]?.conformidade ?? '')));
}

// PLANOS DE AÇÃO ------------------------------------------------------------

/** % de conclusão = concluídas / ações válidas (exclui canceladas e sem status), como em =COUNTIF(...,"CONCLUÍDO")/SOMA(...) */
export function percConclusao(status: Status[]): number | null {
  const validos = status.filter((s) => s && s !== 'CANCELADO');
  if (!validos.length) return null;
  return validos.filter((s) => s === 'CONCLUÍDO').length / validos.length;
}

export function percConclusaoAcoes(acoes: AcaoAI[]): number | null {
  return percConclusao(acoes.map((a) => a.status));
}

export function contarStatus(status: Status[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const s of status) r[s || 'SEM STATUS'] = (r[s || 'SEM STATUS'] ?? 0) + 1;
  return r;
}

// FMEA ----------------------------------------------------------------------

export function npr(g: number | null, o: number | null, d: number | null): number {
  return (g ?? 0) * (o ?? 0) * (d ?? 0);
}

export function nprInicial(l: LinhaFmea) {
  return npr(l.g, l.o, l.d);
}

export function nprFinal(l: LinhaFmea) {
  return npr(l.g2, l.o2, l.d2);
}

// FORMATAÇÃO ----------------------------------------------------------------

export function fmtNum(v: number | null | undefined, casas = 2): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

export function fmtPct(v: number | null | undefined, casas = 1): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: casas }) + '%';
}

export function fmtResultado(tipo: TipoCalculo, v: number | null | undefined, unidade = ''): string {
  if (v == null) return '—';
  if (tipo === 'percentual') return fmtNum(v) + '%';
  return fmtNum(v) + (unidade ? ' ' + unidade : '');
}

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

import { describe, expect, it } from 'vitest';
import { hospitalHRVJ, novaInteracao, novaNotificacao, novoContratual, novoIndicador, novoSetor } from '../seed';
import { normalizar } from '../store';
import {
  avaliarMeta,
  classePriorizacao,
  conformidadeAnual,
  conformidadeGeralAno,
  conformidadeMes,
  mediana,
  npr,
  percConclusao,
  realizadoContratual,
  realizadoTrimestral,
  resultadoAnual,
  resultadoPeriodo,
  serieAno,
  ultimoResultado,
} from './calc';
import { resumoSetor } from './resumo';

describe('indicadores', () => {
  it('calcula resultado por tipo', () => {
    expect(resultadoPeriodo('percentual', 85, 100)).toBe(85);
    expect(resultadoPeriodo('densidade', 3, 1500)).toBe(2);
    expect(resultadoPeriodo('taxa', 230, 20)).toBe(11.5);
    expect(resultadoPeriodo('absoluto', 7, null)).toBe(7);
    expect(resultadoPeriodo('percentual', 5, 0)).toBeNull();
    expect(resultadoPeriodo('percentual', null, 10)).toBeNull();
  });

  it('resultado anual = Σnum/Σden e série por período', () => {
    const i = novoIndicador();
    i.dados = { '2025-1': { num: 8, den: 10 }, '2025-2': { num: 9, den: 10 }, '2025-3': { num: null, den: 10 } };
    expect(serieAno(i, 2025).slice(0, 3)).toEqual([80, 90, null]);
    expect(resultadoAnual(i, 2025)).toBeCloseTo(85);
    expect(ultimoResultado(i)).toEqual({ ano: 2025, periodo: 2, valor: 90 });
  });

  it('indicador trimestral tem 4 períodos e ignora chaves acima de 4', () => {
    const i = novoIndicador();
    i.periodicidade = 'trimestral';
    i.dados = { '2024-4': { num: 1, den: 2 }, '2024-7': { num: 1, den: 1 } };
    expect(serieAno(i, 2024)).toEqual([null, null, null, 50]);
    expect(ultimoResultado(i)?.periodo).toBe(4);
  });

  it('avalia meta pela polaridade', () => {
    expect(avaliarMeta(90, 85, '▲')).toBe('atingida');
    expect(avaliarMeta(80, 85, '▲')).toBe('nao-atingida');
    expect(avaliarMeta(6, 7, '▼')).toBe('atingida');
    expect(avaliarMeta(8, 7, '▼')).toBe('nao-atingida');
    expect(avaliarMeta(8, 7, '►◄')).toBe('neutra');
    expect(avaliarMeta(null, 7, '▲')).toBe('sem-dados');
  });

  it('mediana', () => {
    expect(mediana([3, null, 1, 2])).toBe(2);
    expect(mediana([4, 1, 2, 3])).toBe(2.5);
    expect(mediana([])).toBeNull();
  });
});

describe('indicadores contratuais', () => {
  it('▲ resultado/meta e ▼ limite (fórmula IF(B<=10,1,1-B/10+1))', () => {
    expect(realizadoContratual('▲', 45, 50)).toBeCloseTo(0.9);
    expect(realizadoContratual('▼', 8, 10)).toBe(1);
    expect(realizadoContratual('▼', 12, 10)).toBeCloseTo(0.8);
    expect(realizadoContratual('▼', 30, 10)).toBe(0);
    expect(realizadoContratual('▲', 5, 0)).toBeNull();
  });

  it('trimestral = média dos meses com dados', () => {
    const c = novoContratual();
    c.dados = { '2024-1': { resultado: 10, meta: 10 }, '2024-2': { resultado: 5, meta: 10 } };
    expect(realizadoTrimestral(c, 2024, 1)).toBeCloseTo(0.75);
    expect(realizadoTrimestral(c, 2024, 2)).toBeNull();
  });
});

describe('mapeamento, interações, planos e FMEA', () => {
  it('classifica priorização conforme a legenda', () => {
    expect(classePriorizacao(7).nivel).toBe(0);
    expect(classePriorizacao(13).nivel).toBe(1);
    expect(classePriorizacao(18).nivel).toBe(2);
    expect(classePriorizacao(19).nivel).toBe(3);
  });

  it('conformidade das interações', () => {
    const a = novaInteracao();
    const b = novaInteracao();
    a.meses = { '2024-1': { notificacoes: 0, conformidade: 'C' }, '2024-2': { notificacoes: 2, conformidade: 'NC' } };
    b.meses = { '2024-1': { notificacoes: 1, conformidade: 'NC' } };
    expect(conformidadeMes([a, b], 2024, 1)).toBe(0.5);
    expect(conformidadeMes([a, b], 2024, 3)).toBeNull();
    expect(conformidadeAnual(a, 2024)).toBe(0.5);
    expect(conformidadeGeralAno([a, b], 2024)).toBeCloseTo(1 / 3);
  });

  it('% conclusão ignora canceladas e vazias', () => {
    expect(percConclusao(['CONCLUÍDO', 'INICIADO', 'CANCELADO', ''])).toBe(0.5);
    expect(percConclusao(['CANCELADO'])).toBeNull();
  });

  it('NPR = G × O × D', () => {
    expect(npr(9, 4, 6)).toBe(216);
    expect(npr(null, 4, 6)).toBe(0);
  });
});

describe('multi-hospital / setor', () => {
  it('resumo do setor considera notificações do hospital pelo nome do setor', () => {
    const h = hospitalHRVJ();
    const s = novoSetor('UTI ADULTO');
    h.setores.push(s);
    h.notificacoes.push(
      { ...novaNotificacao(), codigo: '1', dataOcorrencia: '2025-03-02T10:00', setorNotificado: 'uti adulto' },
      { ...novaNotificacao(), codigo: '2', dataOcorrencia: '2025-04-02T10:00', setorNotificado: 'CENTRO CIRÚRGICO' },
    );
    s.indicadores[0].metas = { '2025': 90 };
    s.indicadores[0].dados = { '2025-1': { num: 80, den: 100 } };
    const r = resumoSetor(h, s, 2025);
    expect(r.incidentesAno).toBe(1);
    expect(r.foraMeta).toBe(1);
  });

  it('normalizar mantém hospitais e completa campos ausentes', () => {
    const d = normalizar({ hospitais: [{ sigla: 'HWGA', nome: 'Outro', setores: [{ nome: 'EMERGÊNCIA' }] }] });
    expect(d.hospitais[0].sigla).toBe('HWGA');
    expect(d.hospitais[0].setores[0].nome).toBe('EMERGÊNCIA');
    expect(d.hospitais[0].setores[0].indicadores.length).toBeGreaterThan(0);
    expect(d.hospitais[0].notificacoes).toEqual([]);
    expect(normalizar(null).hospitais[0].sigla).toBe('HRVJ');
  });
});

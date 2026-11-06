import type { Hospital, Setor, Status } from '../types';
import { avaliarMeta, nprInicial, percConclusao, percConclusaoAcoes, ultimoResultado } from './calc';

export interface ResumoSetor {
  setor: Setor;
  indicadores: number;
  naMeta: number;
  foraMeta: number;
  semAvaliacao: number;
  acoesTotal: number;
  acoesPendentes: number;
  acoesAtrasadas: number;
  percConclusaoGestao: number | null;
  percConclusaoAI: number | null;
  incidentesAno: number;
  maiorNpr: number;
}

const ABERTO = (s: Status) => s !== 'CONCLUÍDO' && s !== 'CANCELADO';

/** Consolida as abas de um setor em números para o painel do hospital. */
export function resumoSetor(h: Hospital, s: Setor, ano: number, hoje = new Date().toISOString().slice(0, 10)): ResumoSetor {
  let naMeta = 0;
  let foraMeta = 0;
  let semAvaliacao = 0;
  for (const i of s.indicadores) {
    const u = ultimoResultado(i);
    const av = u ? avaliarMeta(u.valor, i.metas[u.ano], i.polaridade) : 'sem-dados';
    if (av === 'atingida') naMeta++;
    else if (av === 'nao-atingida') foraMeta++;
    else semAvaliacao++;
  }

  // todas as ações com status: FCA (indicadores, contratuais, interações, incidentes), gestão e AI
  const fcas = [
    ...s.indicadores.flatMap((i) => i.plano.linhas),
    ...s.contratuais.flatMap((c) => c.plano.linhas),
    ...s.interacoes.plano.linhas,
    ...s.gerenciamentoIncidentes.plano.linhas,
  ].filter((l) => l.status || l.acao);
  const ai = s.planoAI.macroentregas.flatMap((m) => m.entregas.flatMap((e) => e.acoes));
  const acoes: { status: Status; prazo: string }[] = [
    ...fcas.map((l) => ({ status: l.status, prazo: l.prazo })),
    ...ai.map((a) => ({ status: a.status, prazo: a.prazo })),
    ...s.planoGestao.acoes.map((a) => ({ status: a.status, prazo: '' })),
  ];

  const nome = s.nome.trim().toUpperCase();
  const incidentesAno = h.notificacoes.filter(
    (n) => n.setorNotificado.trim().toUpperCase() === nome && n.dataOcorrencia && new Date(n.dataOcorrencia).getFullYear() === ano,
  ).length;

  return {
    setor: s,
    indicadores: s.indicadores.length,
    naMeta,
    foraMeta,
    semAvaliacao,
    acoesTotal: acoes.length,
    acoesPendentes: acoes.filter((a) => ABERTO(a.status)).length,
    acoesAtrasadas: acoes.filter((a) => ABERTO(a.status) && a.prazo && a.prazo < hoje).length,
    percConclusaoGestao: percConclusao(s.planoGestao.acoes.filter((a) => a.ano === ano).map((a) => a.status)),
    percConclusaoAI: percConclusaoAcoes(ai),
    incidentesAno,
    maiorNpr: Math.max(0, ...s.fmeas.flatMap((f) => f.linhas.map(nprInicial))),
  };
}

import * as XLSX from 'xlsx';
import { novaNotificacao } from '../seed';
import { ANOS, MESES, TRIMESTRES, type Hospital, type Notificacao, type PlanoFca, type Setor } from '../types';
import {
  chave,
  classePriorizacao,
  conformidadeAnual,
  nprFinal,
  nprInicial,
  percConclusaoAcoes,
  periodosDoIndicador,
  realizadoContratual,
  realizadoTrimestral,
  resultadoAnual,
  serieAno,
  totalPriorizacao,
} from './calc';

type Celula = string | number | null | undefined;
type Linhas = Celula[][];

const nomeAba = (s: string, usados: Set<string>) => {
  let base = s.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31).trim();
  let n = 2;
  let nome = base;
  while (usados.has(nome.toUpperCase())) {
    const suf = ` (${n++})`;
    nome = base.slice(0, 31 - suf.length) + suf;
  }
  usados.add(nome.toUpperCase());
  return nome;
};

/** Salva o workbook com nome de arquivo garantido (independe do navegador). */
function salvar(wb: XLSX.WorkBook, nome: string) {
  const dados = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const url = URL.createObjectURL(new Blob([dados], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  // sem acentos no nome do arquivo: alguns navegadores descartam nomes não-ASCII
  a.download = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '-')
    .replace(/[\\/:*?"<>|]/g, '-');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const r2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

function blocoFca(plano: PlanoFca, rotulo: (ano: number, p: number) => string): Linhas {
  const linhas: Linhas = [];
  for (const ano of ANOS) {
    const doAno = plano.linhas.filter((l) => l.ano === ano).sort((a, b) => a.periodo - b.periodo);
    if (!doAno.length && !plano.analises[ano]) continue;
    linhas.push([], [`PLANO DE AÇÃO ${ano}`], ['PERÍODO', 'FATO', 'CAUSA', 'AÇÕES', 'PRAZO', 'RESPONSÁVEL', 'STATUS']);
    for (const l of doAno) linhas.push([rotulo(ano, l.periodo), l.fato, l.causa, l.acao, l.prazo, l.responsavel, l.status]);
    linhas.push([`ANÁLISE ANUAL ${ano}`, plano.analises[ano] ?? '']);
  }
  return linhas;
}

const mesAno = (ano: number, p: number) => `${MESES[p - 1]}/${ano}`;

function abasHospital(h: Hospital): [string, Linhas][] {
  const e = h.estrategia;
  const m = h.mapeamento;
  return [
    [
      '3. ESTRATÉGIA 2024-2027',
      [
        ['DIRECIONADORES DA ESTRATÉGIA'],
        ['MISSÃO', e.missao],
        ['VISÃO', e.visao],
        ['VALORES', e.valores],
        ['PROPÓSITO', e.proposito],
        [],
        [`PAINEL ESTRATÉGICO ${h.sigla}`],
        ['PERSPECTIVA', 'OBJETIVO ESTRATÉGICO', 'INDICADOR ESTRATÉGICO', ...ANOS.map((a) => `META ${a}`), 'RESPONSÁVEL-DIRETORIA'],
        ...e.painel.map((l) => [l.perspectiva, l.objetivo, l.indicador, ...ANOS.map((a) => l.metas[a] ?? ''), l.responsavel]),
      ],
    ],
    [
      '4. MAPEAMENTO DE PROCESSOS',
      [
        [m.titulo, '', `CÓD.: ${m.codigo}`, `VERSÃO: ${m.versao}`, `REVISÃO: ${m.revisao}`],
        [],
        ['PROCESSOS GERENCIAIS', ...m.gerenciais],
        ['PROCESSOS FINALÍSTICOS', ...m.finalisticos],
        ['PROCESSOS DE APOIO', ...m.apoio],
        [],
        ['MATRIZ DE PRIORIZAÇÃO DE PROCESSOS'],
        ['PROCESSO', 'IMPACTO NA SUSTENTABILIDADE FINANCEIRA', 'IMPACTO NA ASSISTÊNCIA AO PACIENTE', 'RELAÇÃO COM O PERFIL DE PACIENTES', 'CONTRIBUIÇÃO PARA A ESTRATÉGIA', 'TOTAL DE PONTOS', 'PRIORIZAÇÃO'],
        ...m.priorizacao.map((l) => {
          const t = totalPriorizacao(l);
          return [l.processo, l.financeiro, l.assistencia, l.perfil, l.estrategia, t, classePriorizacao(t).rotulo];
        }),
      ],
    ],
    [
      'NOTIFICAÇÕES DE INCIDENTES',
      [
        CABECALHO_NOTIF.map((c) => c.rotulo),
        ...h.notificacoes.map((n) => {
          const d = n.dataOcorrencia ? new Date(n.dataOcorrencia) : null;
          return [d ? d.getFullYear() : null, d ? MESES[d.getMonth()] : null, ...CABECALHO_NOTIF.slice(2).map((c) => (n as unknown as Record<string, string>)[c.campo!])];
        }),
      ],
    ],
  ];
}

function abasSetor(s: Setor, h: Hospital): [string, Linhas][] {
  const abas: [string, Linhas][] = [];
  abas.push([
    '1. INTRODUÇÃO',
    [
      ['NOME DO SETOR', s.nome],
      ['HOSPITAL', `${h.sigla} — ${h.nome}`],
      ['COORDENADOR', s.introducao.coordenador],
      ['TIME DE LIDERANÇA', ...s.introducao.lideranca.filter(Boolean)],
      ['BREVE HISTÓRICO DO SERVIÇO', s.introducao.historico],
    ],
  ]);

  const perfil: Linhas = [[s.perfil.tipo]];
  for (const t of s.perfil.tabelasMensais) {
    perfil.push([], [`${t.titulo} (${t.ano})`], ['CRITÉRIO', ...MESES, 'TOTAL']);
    for (const c of t.criterios) perfil.push([c.nome, ...c.valores, c.valores.reduce<number>((a, b) => a + (b ?? 0), 0)]);
  }
  for (const t of s.perfil.tabelasDistribuicao) {
    const tot = t.itens.reduce((a, b) => a + (b.quantidade ?? 0), 0);
    perfil.push([], [t.titulo], ['CRITÉRIO', 'QUANTIDADE', '%']);
    for (const i of t.itens) perfil.push([i.nome, i.quantidade, tot ? r2(((i.quantidade ?? 0) / tot) * 100) : null]);
  }
  abas.push(['2. PERFIL', perfil]);

  for (const mo of s.modelagens) {
    abas.push([
      `MODELAGEM ${mo.codigo}`,
      [
        ['TIPO DE DOCUMENTO: MAPEAMENTO DE PROCESSOS', '', `CÓD.: ${mo.codigo}`, `VERSÃO: ${mo.versao}`, `REVISÃO: ${mo.revisao}`],
        ['TÍTULO', mo.titulo],
        ['RESULTADO (OBJETIVO)', mo.objetivo],
        [],
        ['FORNECEDORES', 'ENTRADAS', 'MACROETAPAS', 'SAÍDAS', 'CLIENTES', 'ACORDOS'],
        [mo.fornecedores, mo.entradas, mo.macroetapas, mo.saidas, mo.clientes, mo.acordos],
        [],
        ['FLUXOGRAMA DO PROCESSO'],
        ['Nº', 'TIPO', 'ETAPA', 'RESPONSÁVEL'],
        ...mo.fluxo.map((f, i) => [i + 1, f.tipo, f.descricao, f.responsavel]),
        [],
        ['INDICADORES DE RESULTADO', 'META', 'RESPONSÁVEL'],
        ...mo.indicadoresResultado.map((i) => [i.indicador, i.meta, i.responsavel]),
        [],
        ['INDICADORES DE PROCESSO', 'META', 'RESPONSÁVEL'],
        ...mo.indicadoresProcesso.map((i) => [i.indicador, i.meta, i.responsavel]),
        [],
        ['HISTÓRICO DAS VERSÕES'],
        ['VERSÃO', 'DESCRIÇÃO DA ALTERAÇÃO', 'DATA', 'RESPONSÁVEL/FUNÇÃO', 'PRÓXIMA REVISÃO'],
        ...mo.historico.map((v) => [v.versao, v.descricao, v.data, v.responsavel, v.proximaRevisao]),
        ['VALIDAÇÃO', mo.validacao],
      ],
    ]);
  }

  const notifSetor = h.notificacoes.filter((n) => n.setorNotificado.trim().toUpperCase() === s.nome.trim().toUpperCase());
  const gi: Linhas = [
    [`INCIDENTES DE SEGURANÇA DO PACIENTE — ${s.nome}`],
    ['META', s.gerenciamentoIncidentes.meta, 'RESPONSÁVEL PELA META', s.gerenciamentoIncidentes.responsavel],
    [],
    ['ANO', ...MESES, 'TOTAL'],
  ];
  for (const ano of ANOS) {
    const cont = MESES.map((_, m) => notifSetor.filter((n) => n.dataOcorrencia && new Date(n.dataOcorrencia).getFullYear() === ano && new Date(n.dataOcorrencia).getMonth() === m).length);
    gi.push([ano, ...cont, cont.reduce((a, b) => a + b, 0)]);
  }
  gi.push(...blocoFca(s.gerenciamentoIncidentes.plano, mesAno));
  abas.push(['GERENCIAMENTO DE INCIDENTES', gi]);

  const inter: Linhas = [];
  for (const ano of ANOS) {
    inter.push([`GERENCIAMENTO DAS INTERAÇÕES DE PROCESSOS — ${ano}`], ['Nº', 'ELABORAÇÃO', 'REVISADO EM', 'VERSÃO', 'PRÓX. REVISÃO', 'FORNECEDOR', 'CLIENTE', 'PROCESSO', ...MESES.flatMap((m) => [`Nº NOTIF. ${m}`, m]), 'ANUAL %']);
    s.interacoes.itens.forEach((it, i) => {
      const anual = conformidadeAnual(it, ano);
      inter.push([
        i + 1,
        it.dataElaboracao,
        it.revisadoEm,
        it.versao,
        it.proximaRevisao,
        it.fornecedor,
        it.cliente,
        it.processo,
        ...MESES.flatMap((_, m) => {
          const v = it.meses[chave(ano, m + 1)];
          return [v?.notificacoes ?? null, v?.conformidade === 'NC' ? 'N/C' : (v?.conformidade ?? '')];
        }),
        anual == null ? null : r2(anual * 100),
      ]);
    });
    inter.push([]);
  }
  inter.push(...blocoFca(s.interacoes.plano, mesAno));
  abas.push(['GERENCIAMENTO DAS INTERAÇÕES', inter]);

  abas.push([
    'FICHAS TÉCNICAS DOS INDICADORES',
    [
      ['Nº', 'DATA DE ELABORAÇÃO', 'REVISADO EM', 'VERSÃO', 'PRÓXIMA REVISÃO', 'NOME DA FICHA TÉCNICA', 'TIPO', 'PERIODICIDADE', 'POLARIDADE', ...ANOS.map((a) => `META ${a}`), 'RESPONSÁVEL PELA META', 'JUSTIFICATIVA', 'CRITÉRIOS', 'NUMERADOR', 'DENOMINADOR', 'FÓRMULA', 'FONTE DA COLETA', 'SISTEMÁTICA DE AVALIAÇÃO', 'GESTOR DO INDICADOR'],
      ...s.indicadores.map((i, n) => [
        n + 1,
        i.dataElaboracao,
        i.revisadoEm,
        i.versao,
        i.proximaRevisao,
        i.nome,
        i.tipoCalculo,
        i.periodicidade,
        i.polaridade,
        ...ANOS.map((a) => i.metas[a] ?? null),
        i.responsavelMeta,
        i.justificativa,
        i.criterios,
        i.numerador,
        i.denominador,
        i.formula,
        i.fonteColeta,
        i.sistematica,
        i.gestor,
      ]),
    ],
  ]);

  for (const ind of s.indicadores) {
    const per = periodosDoIndicador(ind);
    const rot = ind.periodicidade === 'trimestral' ? TRIMESTRES : MESES;
    const l: Linhas = [[ind.nome], ['RESPONSÁVEL PELA META', ind.responsavelMeta, 'POLARIDADE', ind.polaridade], [], ['BASE HISTÓRICA'], ['ANO', 'PERÍODO', 'META', 'NUMERADOR', 'DENOMINADOR', 'RESULTADO']];
    for (const ano of ANOS) {
      const serie = serieAno(ind, ano);
      for (let p = 1; p <= per; p++) {
        const d = ind.dados[chave(ano, p)];
        if (!d || (d.num == null && d.den == null)) continue;
        l.push([ano, rot[p - 1], ind.metas[ano] ?? null, d.num, d.den, r2(serie[p - 1])]);
      }
      const anual = resultadoAnual(ind, ano);
      if (anual != null) l.push([`RESULTADO ANUAL ${ano}`, '', ind.metas[ano] ?? null, '', '', r2(anual)]);
    }
    l.push(...blocoFca(ind.plano, (a, p) => `${rot[p - 1]}/${a}`));
    abas.push([`IND - ${ind.nome}`, l]);
  }

  for (const c of s.contratuais) {
    const l: Linhas = [['INDICADORES CONTRATUAIS'], [c.nome], ['Responsável pela meta:', c.responsavel], [], ['MÊS', 'RESULTADOS', 'META', '%Realizado Mensal', '%Realizado Trimestral']];
    for (const ano of ANOS)
      for (let m = 1; m <= 12; m++) {
        const d = c.dados[chave(ano, m)];
        const rm = d ? realizadoContratual(c.polaridade, d.resultado, d.meta) : null;
        const rt = m % 3 === 1 ? realizadoTrimestral(c, ano, Math.ceil(m / 3)) : null;
        l.push([mesAno(ano, m), d?.resultado ?? null, d?.meta ?? null, rm == null ? null : r2(rm * 100), rt == null ? null : r2(rt * 100)]);
      }
    l.push([], ['Análise FCA'], ...blocoFca(c.plano, mesAno));
    abas.push([`CONTRATUAL - ${c.nome}`, l]);
  }

  const ai: Linhas = [[s.planoAI.titulo]];
  for (const me of s.planoAI.macroentregas) {
    const todas = me.entregas.flatMap((e) => e.acoes);
    const p = percConclusaoAcoes(todas);
    ai.push([], [me.nome, '', '', '', '%TOTAL', p == null ? null : r2(p * 100)], ['PRODUTOS A SEREM DESENVOLVIDOS', me.produtos]);
    for (const en of me.entregas) {
      const pe = percConclusaoAcoes(en.acoes);
      ai.push([en.nome, '', '', '', '% CONCLUSÃO', pe == null ? null : r2(pe * 100)], ['DIAGNÓSTICO INICIAL', 'AÇÕES', 'PRAZO', 'RESPONSÁVEL(S)', 'STATUS', 'MELHORIAS ALCANÇADAS']);
      for (const a of en.acoes) ai.push([a.diagnostico, a.acao, a.prazo, a.responsavel, a.status, a.melhorias]);
    }
  }
  abas.push(['PLANO DE AÇÃO - AI', ai]);

  const ges: Linhas = [];
  for (const ano of ANOS) {
    const acoes = s.planoGestao.acoes.filter((a) => a.ano === ano).sort((a, b) => a.mes - b.mes);
    ges.push([`GESTÃO - ${ano}`], ['MÊS / ANO', 'AÇÕES', 'DATA DA EFETIVA CONCLUSÃO', 'RESPONSÁVEL', 'STATUS']);
    for (const a of acoes) ges.push([mesAno(ano, a.mes), a.acao, a.dataConclusao, a.responsavel, a.status]);
    ges.push(['ANÁLISE ANUAL', s.planoGestao.analises[ano] ?? ''], []);
  }
  abas.push(['PLANO DE AÇÕES - GESTÃO', ges]);

  for (const f of s.fmeas) {
    abas.push([
      `FMEA - ${f.processo}`,
      [
        ['GERENCIAMENTO DE RISCO - FMEA'],
        ['Nome do processo:', f.processo, 'Equipe FMEA:', f.equipe, 'Data:', f.data, 'Revisão:', f.revisao, 'Responsável:', f.responsavel],
        ['Etapa do Processo', 'Modo de Falha', 'Efeito de Falha', 'GRAVIDADE', 'Causas', 'OCORRÊNCIA', 'Controles Atuais', 'DETECÇÃO', 'NPR', 'Ações Recomendadas', 'Responsável/Prazo', 'Ações Tomadas', 'GRAVIDADE', 'OCORRÊNCIA', 'DETECÇÃO', 'NPR'],
        ...f.linhas.map((l) => [l.etapa, l.modoFalha, l.efeito, l.g, l.causas, l.o, l.controles, l.d, nprInicial(l), l.acoesRecomendadas, l.responsavelPrazo, l.acoesTomadas, l.g2, l.o2, l.d2, nprFinal(l)]),
      ],
    ]);
  }
  return abas;
}

/** Gera a planilha .xlsx de um setor (com as abas institucionais do hospital). */
export function exportarSetorXlsx(h: Hospital, s: Setor) {
  const wb = XLSX.utils.book_new();
  const usados = new Set<string>();
  const doSetor = abasSetor(s, h);
  // ordem das abas da planilha original: introdução, perfil, estratégia, mapeamento, ...
  const todas = [...doSetor.slice(0, 2), ...abasHospital(h), ...doSetor.slice(2)];
  for (const [nome, linhas] of todas) {
    const ws = XLSX.utils.aoa_to_sheet(linhas);
    ws['!cols'] = Array.from({ length: Math.max(...linhas.map((l) => l.length), 1) }, () => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, nomeAba(nome, usados));
  }
  salvar(wb, `${h.sigla} - ${s.nome} - PLANILHA GESTÃO 2024-2027.xlsx`);
}

// NOTIFICAÇÕES ----------------------------------------------------------------

export const CABECALHO_NOTIF: { rotulo: string; campo?: keyof Notificacao }[] = [
  { rotulo: 'ANO' },
  { rotulo: 'MÊS' },
  { rotulo: 'CÓDIGO', campo: 'codigo' },
  { rotulo: 'DATA DA OCORRÊNCIA/HORA', campo: 'dataOcorrencia' },
  { rotulo: 'SETOR NOTIFICADO', campo: 'setorNotificado' },
  { rotulo: 'LOCAL OCORRÊNCIA', campo: 'localOcorrencia' },
  { rotulo: 'TIPO CLASSIFICAÇÃO', campo: 'tipoClassificacao' },
  { rotulo: 'COD. INTERAÇÃO', campo: 'codInteracao' },
  { rotulo: 'NATUREZA', campo: 'natureza' },
  { rotulo: 'AFETOU PACIENTE', campo: 'afetouPaciente' },
  { rotulo: 'PRONTUÁRIO', campo: 'prontuario' },
  { rotulo: 'STATUS', campo: 'status' },
  { rotulo: 'DAT. CLASSIFICAÇÃO', campo: 'dataClassificacao' },
  { rotulo: 'STATUS RESPOSTA', campo: 'statusResposta' },
  { rotulo: 'DAT. RESPOSTA', campo: 'dataResposta' },
  { rotulo: 'DAT. CONCLUSÃO', campo: 'dataConclusao' },
  { rotulo: 'DESCRIÇÃO', campo: 'descricao' },
  { rotulo: 'CAUSA', campo: 'causa' },
  { rotulo: 'OBSERVAÇÃO', campo: 'observacao' },
];

const normalizarCab = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();

const pad = (n: number) => String(n).padStart(2, '0');

function paraData(v: unknown, comHora: boolean): string {
  if (v instanceof Date && !isNaN(v.getTime())) {
    // datas do Excel são números de ponto flutuante: arredonda para o minuto mais próximo
    const t = new Date(Math.round(v.getTime() / 60000) * 60000);
    const d = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    return comHora ? `${d}T${pad(t.getHours())}:${pad(t.getMinutes())}` : d;
  }
  if (typeof v === 'string') {
    const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (m) {
      const d = `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
      return comHora ? `${d}T${pad(+(m[4] ?? 0))}:${m[5] ?? '00'}` : d;
    }
    return v.trim();
  }
  return v == null ? '' : String(v);
}

const CAMPOS_DATA_HORA = new Set<keyof Notificacao>(['dataOcorrencia']);
const CAMPOS_DATA = new Set<keyof Notificacao>(['dataClassificacao', 'dataResposta', 'dataConclusao']);

/** Lê uma planilha (.xlsx/.csv) com o cabeçalho da aba "NOTIFICAÇÕES DE INCIDENTES". */
export async function importarNotificacoes(arquivo: File): Promise<{ notificacoes: Notificacao[]; ignoradas: number }> {
  const wb = XLSX.read(await arquivo.arrayBuffer(), { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames.find((n) => normalizarCab(n).includes('NOTIFICAC')) ?? wb.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });
  const mapa = new Map(CABECALHO_NOTIF.filter((c) => c.campo).map((c) => [normalizarCab(c.rotulo), c.campo!]));
  const iCab = linhas.findIndex((l) => l.filter((c) => typeof c === 'string' && mapa.has(normalizarCab(c))).length >= 3);
  if (iCab < 0) throw new Error('Cabeçalho não encontrado. Use as colunas da aba "NOTIFICAÇÕES DE INCIDENTES" (CÓDIGO, DATA DA OCORRÊNCIA/HORA, SETOR NOTIFICADO...).');
  const colunas = linhas[iCab].map((c) => (typeof c === 'string' ? mapa.get(normalizarCab(c)) : undefined));
  const notificacoes: Notificacao[] = [];
  let ignoradas = 0;
  for (const linha of linhas.slice(iCab + 1)) {
    const n = novaNotificacao();
    let preenchidos = 0;
    colunas.forEach((campo, i) => {
      if (!campo) return;
      const v = linha[i];
      if (v == null || v === '') return;
      preenchidos++;
      const valor = CAMPOS_DATA_HORA.has(campo) ? paraData(v, true) : CAMPOS_DATA.has(campo) ? paraData(v, false) : String(v).trim();
      (n as unknown as Record<string, string>)[campo] = campo === 'afetouPaciente' ? (valor.toUpperCase().startsWith('S') ? 'SIM' : valor ? 'NÃO' : '') : valor;
    });
    if (preenchidos >= 2 && (n.codigo || n.dataOcorrencia)) notificacoes.push(n);
    else if (preenchidos) ignoradas++;
  }
  return { notificacoes, ignoradas };
}

export function exportarNotificacoesXlsx(h: Hospital) {
  const wb = XLSX.utils.book_new();
  const [nome, linhas] = abasHospital(h)[2];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhas), nome);
  salvar(wb, `${h.sigla} - NOTIFICAÇÕES DE INCIDENTES.xlsx`);
}

// Dados iniciais — extraídos da planilha "HRVJ – PLANILHA GESTÃO 2024-2027".
import type {
  AppData,
  Hospital,
  Setor,
  TipoSetor,
  FcaRow,
  Fmea,
  Indicador,
  IndicadorContratual,
  Interacao,
  LinhaFmea,
  LinhaPainel,
  LinhaPriorizacao,
  Modelagem,
  Notificacao,
  PlanoFca,
  TabelaDistribuicao,
  TabelaMensal,
} from './types';

export const SCHEMA = 2;

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// FÁBRICAS ---------------------------------------------------------------

export const novoPlano = (): PlanoFca => ({ linhas: [], analises: {} });

export const novaFca = (ano: number, periodo: number): FcaRow => ({
  id: uid(),
  ano,
  periodo,
  fato: '',
  causa: '',
  acao: '',
  prazo: '',
  responsavel: '',
  status: '',
});

export const novaTabelaMensal = (titulo: string, ano = 2024): TabelaMensal => ({
  id: uid(),
  titulo,
  ano,
  criterios: Array.from({ length: 4 }, (_, i) => ({ id: uid(), nome: `Critério ${i + 1}`, valores: Array(12).fill(null) })),
});

export const novaTabelaDistribuicao = (titulo: string): TabelaDistribuicao => ({
  id: uid(),
  titulo,
  itens: Array.from({ length: 4 }, (_, i) => ({ id: uid(), nome: `Critério ${i + 1}`, quantidade: null })),
});

export const novaModelagem = (): Modelagem => ({
  id: uid(),
  codigo: 'MOD.XXX.000',
  titulo: 'Novo processo',
  versao: '00',
  revisao: '',
  objetivo: '',
  fornecedores: '',
  entradas: '',
  macroetapas: '',
  saidas: '',
  clientes: '',
  acordos: '',
  fluxo: [
    { id: uid(), tipo: 'inicio', descricao: 'Início', responsavel: '' },
    { id: uid(), tipo: 'atividade', descricao: 'Atividade', responsavel: '' },
    { id: uid(), tipo: 'fim', descricao: 'Fim', responsavel: '' },
  ],
  indicadoresResultado: [],
  indicadoresProcesso: [],
  historico: [
    { id: uid(), versao: '0.0', descricao: 'Documento inicial', data: '', responsavel: '', proximaRevisao: '' },
  ],
  validacao: '',
});

export const novaNotificacao = (): Notificacao => ({
  id: uid(),
  codigo: '',
  dataOcorrencia: '',
  setorNotificado: '',
  localOcorrencia: '',
  tipoClassificacao: '',
  codInteracao: '',
  natureza: '',
  afetouPaciente: '',
  prontuario: '',
  status: '',
  dataClassificacao: '',
  statusResposta: '',
  dataResposta: '',
  dataConclusao: '',
  descricao: '',
  causa: '',
  observacao: '',
});

export const novaInteracao = (): Interacao => ({
  id: uid(),
  dataElaboracao: '',
  revisadoEm: '',
  versao: '',
  proximaRevisao: '',
  fornecedor: '',
  cliente: '',
  processo: '',
  meses: {},
});

export const novoIndicador = (nome = 'Novo indicador'): Indicador => ({
  id: uid(),
  nome,
  tipoCalculo: 'percentual',
  periodicidade: 'mensal',
  polaridade: '▲',
  unidade: '',
  metas: {},
  linhaBase: null,
  responsavelMeta: '',
  justificativa: '',
  criterios: '',
  numerador: '',
  denominador: '',
  formula: '',
  fonteColeta: '',
  sistematica: 'Mensal',
  gestor: '',
  dataElaboracao: '',
  revisadoEm: '',
  versao: '01',
  proximaRevisao: '',
  dados: {},
  plano: novoPlano(),
});

export const novoContratual = (nome = 'Novo indicador contratual'): IndicadorContratual => ({
  id: uid(),
  nome,
  responsavel: '',
  polaridade: '▲',
  dados: {},
  plano: novoPlano(),
});

export const novaLinhaFmea = (): LinhaFmea => ({
  id: uid(),
  etapa: '',
  modoFalha: '',
  efeito: '',
  g: null,
  causas: '',
  o: null,
  controles: '',
  d: null,
  acoesRecomendadas: '',
  responsavelPrazo: '',
  acoesTomadas: '',
  g2: null,
  o2: null,
  d2: null,
});

export const novoFmea = (): Fmea => ({
  id: uid(),
  processo: 'Novo processo',
  equipe: '',
  data: '',
  revisao: '',
  responsavel: '',
  linhas: [novaLinhaFmea()],
});

// DADOS DA PLANILHA ---------------------------------------------------------

const metas = (a: string, b: string, c: string, d: string) => ({ '2024': a, '2025': b, '2026': c, '2027': d });

const PAINEL: Omit<LinhaPainel, 'id'>[] = [
  { perspectiva: 'Resultado para Sociedade', objetivo: 'Proporcionar uma experiência para o paciente com entrega de valor através de uma jornada segura, humanizada e efetiva', indicador: 'Taxa de Satisfação de Usuário (NPS)', metas: metas('≥ 80%', '≥ 82%', '≥ 85%', '≥ 90%'), responsavel: 'Felipe Freitas / Dr. Bergson Moura' },
  { perspectiva: 'Resultado para Sociedade', objetivo: 'Alcançar resultados de excelência no cuidado, reconhecidos por certificação', indicador: 'Taxa de cumprimento do projeto (Projeto de certificação)', metas: metas('90% para certificação', '100% + Certificação', '100% + Manutenção', '100% + Recertificação'), responsavel: 'Lady Rosany / Dr. Bergson Moura' },
  { perspectiva: 'Resultado para Sociedade', objetivo: 'Contribuir para o fortalecimento da rede de atenção à saúde a fim de garantir acesso', indicador: 'Taxa de ocupação hospitalar', metas: metas('≥ 85%', '≥ 85%', '≥ 85%', '≥ 85%'), responsavel: 'Dra Sabrina / Irani' },
  { perspectiva: 'Resultado para Sociedade', objetivo: 'Contribuir para o fortalecimento da rede de atenção à saúde a fim de garantir acesso', indicador: 'Tempo Médio de Permanência', metas: metas('11,5', '11,5', '11,5', '11,5'), responsavel: 'Dra Sabrina / Irani' },
  { perspectiva: 'Resultado para Sociedade', objetivo: 'Contribuir para o fortalecimento da rede de atenção à saúde a fim de garantir acesso', indicador: 'Taxa de permanência em emergências acima de 24h', metas: metas('30%', '30%', '30%', '30%'), responsavel: 'Allyson / Matheus Leal / Drª Ana Paula' },
  { perspectiva: 'Desenvolvimento Institucional e Processos', objetivo: 'Promover a qualidade do cuidado e a segurança do paciente', indicador: 'Taxa de mortalidade institucional', metas: metas('10%', '9%', '9%', '9%'), responsavel: 'Dra Ana Paula Guedes / Dra Endara / Niélia' },
  { perspectiva: 'Desenvolvimento Institucional e Processos', objetivo: 'Promover a qualidade do cuidado e a segurança do paciente', indicador: 'Taxa de conformidade da caminhada da segurança', metas: metas('≥ 85%', '≥ 85%', '≥ 90%', '≥ 92%'), responsavel: 'Lady Rosany / Emanuelly Crisóstomo / Dr. Bergson Moura' },
  { perspectiva: 'Desenvolvimento Institucional e Processos', objetivo: 'Promover a qualidade do cuidado e a segurança do paciente', indicador: 'Taxa de Reinternação em até 30 dias da Alta Hospitalar', metas: metas('', '', '', ''), responsavel: 'Dra. Ana Paula Guedes / Dra Endara / Irani' },
  { perspectiva: 'Desenvolvimento Institucional e Processos', objetivo: 'Contribuir com linha de cuidado prioritária pactuada junto à rede.', indicador: 'Taxa de utilização de salas cirúrgicas eletivas', metas: metas('≥ 80%', '≥ 80%', '≥ 85%', '≥ 85%'), responsavel: 'Dra Ana Paula Guedes / Dr. Bruno Águila / Rhanna Façanha / Lizandra' },
  { perspectiva: 'Desenvolvimento Institucional e Processos', objetivo: 'Qualificar processos e protocolos internos para redução da mortalidade relacionada a SEPSE', indicador: 'Taxa de adesão global ao protocolo sepse.', metas: metas('', '', '', ''), responsavel: 'Dra Ana Paula Guedes / Coord. SCIH' },
  { perspectiva: 'Desenvolvimento Institucional e Processos', objetivo: 'Qualificar processos e protocolos internos para redução da mortalidade relacionada a SEPSE', indicador: 'Densidade de incidência de infecção hospitalar', metas: metas('< 7', '< 7', '< 6', '< 5'), responsavel: 'Dra Ana Paula Guedes / Coord. SCIH / Dr Bergson' },
  { perspectiva: 'Desenvolvimento Institucional e Processos', objetivo: 'Aprimorar processos e promover procedimentos cirúrgicos de forma segura', indicador: 'Taxa de conformidade do protocolo de cirurgia segura', metas: metas('≥ 85%', '≥ 85%', '≥ 90%', '≥ 92%'), responsavel: 'Dra Ana Paula Guedes / Dr. Bruno Águila / Rhanna Façanha' },
  { perspectiva: 'Desenvolvimento Institucional e Processos', objetivo: 'Aprimorar o processo de gestão da informação', indicador: 'Percentual de automatizações estratégicas em BI', metas: metas('100%', '100%', '100%', '100%'), responsavel: 'Dr. Bergson' },
  { perspectiva: 'Governança', objetivo: 'Fortalecer accountability como prática de gestão', indicador: 'Índice de desempenho institucional', metas: metas('≥ 75%', '≥ 75%', '≥ 75%', '≥ 75%'), responsavel: 'Lady Rosany / Dr. Bergson Moura' },
  { perspectiva: 'Governança', objetivo: 'Gerenciar riscos organizacionais', indicador: 'Taxa de cumprimento dos planos de ação (Projetos relacionados ao Compliance Gerenciados)', metas: metas('', '', '', ''), responsavel: '' },
  { perspectiva: 'Sustentabilidade Econômico-Financeira', objetivo: 'Aprimorar práticas de gestão orçamentária', indicador: 'Índice de desempenho orçamentário', metas: metas('100%', '100%', '100%', '100%'), responsavel: 'Hugo / Dra. Sabrina / Dr Bergson' },
  { perspectiva: 'Sustentabilidade Econômico-Financeira', objetivo: 'Aumentar a eficiência na utilização dos recursos', indicador: 'Percentual de Eficiência Financeira', metas: metas('100%', '100%', '100%', '100%'), responsavel: 'Dra. Sabrina / Hugo' },
  { perspectiva: 'Aprendizado, Crescimento e Inovação', objetivo: 'Desenvolver líderes para alta performance', indicador: 'Taxa de adesão ao PDL', metas: metas('', '', '', ''), responsavel: 'Dr Bergson / Emanuel Eleaquim' },
  { perspectiva: 'Aprendizado, Crescimento e Inovação', objetivo: 'Desenvolver projetos de ensino e pesquisa alinhados ao cuidado', indicador: 'Número de resumos e projetos cadastrados no Centro de Estudos', metas: metas('5', '8', '10', '12'), responsavel: 'Dr Bergson / Ticyanne' },
  { perspectiva: 'Aprendizado, Crescimento e Inovação', objetivo: 'Promover uma cultura do cuidado que garanta a melhor experiência do colaborador', indicador: 'Taxa de satisfação do colaborador (Pesquisa de clima organizacional)', metas: metas('80%', '', '', ''), responsavel: 'Dr Bergson / Emanuel Eleaquim' },
];

export const PERSPECTIVAS = [
  'Resultado para Sociedade',
  'Governança',
  'Desenvolvimento Institucional e Processos',
  'Sustentabilidade Econômico-Financeira',
  'Aprendizado, Crescimento e Inovação',
];

const PRIORIZACAO: [string, number, number, number, number][] = [
  ['ASSISTÊNCIA AMBULATORIAL', 1, 2, 2, 2],
  ['ASSISTÊNCIA EM CLÍNICA MÉDICA', 3, 4, 3, 3],
  ['ASSISTÊNCIA EM CLÍNICA PSIQUIÁTRICA', 2, 4, 2, 4],
  ['ASSISTÊNCIA EM TERAPIA INTENSIVA', 4, 5, 4, 5],
  ['ASSISTÊNCIA HEMODINÂMICA EM CARDIOLOGIA', 5, 5, 3, 5],
  ['ATENDIMENTO CIRÚRGICO', 5, 5, 5, 5],
  ['ASSISTÊNCIA EM CLÍNICA CIRÚRGICA', 3, 4, 3, 3],
  ['ASSISTÊNCIA EM CLÍNICA CIRÚRGICA TRAUMATOLÓGICA', 3, 4, 5, 5],
  ['ASSISTÊNCIA EM URGÊNCIA E EMERGÊNCIA', 4, 5, 5, 5],
  ['ASSISTÊNCIA ONCOLÓGICA', 5, 5, 4, 5],
];

/** Tabela de referência G.O.D (Gravidade, Ocorrência, Detecção) — Anvisa, 2017. */
export const GOD = {
  referencia:
    'Brasil. Agência Nacional de Vigilância Sanitária. Gestão de Riscos e Investigação de Eventos Adversos Relacionados à Assistência à Saúde. Brasília: Anvisa, 2017.',
  gravidade: [
    { efeito: 'Mínimo', indice: 1, criterio: 'O efeito da falha pode não ser reconhecido e não comprometer o tratamento ou função, não havendo dano e nem aumento da internação e do nível de cuidado.' },
    { efeito: 'Pequeno', indice: 2, criterio: 'O efeito da falha pode só ser reconhecido por pessoal altamente capacitado (médicos/enfermeiros), exigindo maior monitoramento, mas pode não comprometer nenhuma função e não causar dano.' },
    { efeito: 'Pequeno', indice: 3, criterio: 'O efeito da falha pode só ser reconhecido por pessoal altamente capacitado (médicos/enfermeiros), exigindo maior monitoramento, mas pode não comprometer nenhuma função e não causar dano.' },
    { efeito: 'Médio', indice: 4, criterio: 'O efeito da falha pode causar dano temporário ao paciente, exigindo monitoramento e avaliação especializada.' },
    { efeito: 'Médio', indice: 5, criterio: 'O efeito da falha pode causar dano temporário ao paciente, exigindo monitoramento, avaliação especializada e prolongamento da hospitalização.' },
    { efeito: 'Médio', indice: 6, criterio: 'O efeito da falha pode causar dano temporário ao paciente, exigindo monitoramento, avaliação especializada, uso de antídotos ou aplicação de outros medicamentos para reverter o dano, interferindo no tratamento de base, com prolongamento da hospitalização.' },
    { efeito: 'Alto', indice: 7, criterio: 'O efeito da falha pode resultar em intervenção para manter a vida do paciente com baixo risco de óbito/sequelas.' },
    { efeito: 'Alto', indice: 8, criterio: 'O efeito de falha pode resultar em intervenção para manter a vida do paciente com médio risco de óbito/sequelas, necessitando de monitoramento e medidas especiais em Unidade de Terapia Intensiva (UTI).' },
    { efeito: 'Muito Alto', indice: 9, criterio: 'O efeito da falha pode resultar em intervenção para manter a vida do paciente com alto risco de óbito/sequelas, necessitando de monitoramento e medidas especiais em UTI.' },
    { efeito: 'Muito Alto', indice: 10, criterio: 'O efeito da falha pode resultar em dano permanente de função - sensorial, motora, psicológica ou intelectual, ou pode resultar na morte do paciente.' },
  ],
  ocorrencia: [
    { probabilidade: 'Remota ou inexistente: quase impossível', indice: 1, taxa: '1 em 10.000', criterio: 'É mínima a probabilidade de ocorrência, processos semelhantes, de maneira geral, não apresentam este tipo de falha/evento.' },
    { probabilidade: 'Baixa ou relativamente baixa', indice: 2, taxa: '1 em 5.000', criterio: 'É pequena a probabilidade de ocorrência; processos semelhantes de maneira geral não apresentam este tipo de falha/evento.' },
    { probabilidade: 'Baixa ou relativamente baixa', indice: 3, taxa: '1 em 5.000', criterio: 'É pequena a probabilidade de ocorrência; processos semelhantes de maneira geral não apresentam este tipo de falha/evento.' },
    { probabilidade: 'Médio', indice: 4, taxa: '1 em 200', criterio: 'É média a probabilidade de ocorrência; processos semelhantes de maneira geral, apresentam, ocasionalmente, este tipo de falha/evento.' },
    { probabilidade: 'Médio', indice: 5, taxa: '1 em 200', criterio: 'É média a probabilidade de ocorrência; processos semelhantes de maneira geral, apresentam, ocasionalmente, este tipo de falha/evento.' },
    { probabilidade: 'Médio', indice: 6, taxa: '1 em 200', criterio: 'É média a probabilidade de ocorrência; processos semelhantes de maneira geral, apresentam, ocasionalmente, este tipo de falha/evento.' },
    { probabilidade: 'Alta probabilidade ou frequente', indice: 7, taxa: '1 em 100', criterio: 'É alta a probabilidade de ocorrência; processos semelhantes de maneira geral, apresentam com frequência este tipo de falha/evento.' },
    { probabilidade: 'Alta probabilidade ou frequente', indice: 8, taxa: '1 em 100', criterio: 'É alta a probabilidade de ocorrência; processos semelhantes de maneira geral, apresentam com frequência este tipo de falha/evento.' },
    { probabilidade: 'Muito alta ou extremamente alta: quase inevitável', indice: 9, taxa: '1 em 20', criterio: 'É muito alta a probabilidade de ocorrência; processos semelhantes de maneira geral, apresentam este tipo de falha/evento.' },
    { probabilidade: 'Muito alta ou extremamente alta: quase inevitável', indice: 10, taxa: '1 em 20', criterio: 'É muito alta a probabilidade de ocorrência; processos semelhantes de maneira geral, apresentam este tipo de falha/evento.' },
  ],
  deteccao: [
    { efeito: 'Muito alto: certo de detectar', indice: 1, taxa: '10 em cada 10', criterio: 'Alta possibilidade de detecção. O sistema não permite que o processo continue.' },
    { efeito: 'Alto: probabilidade alta de detecção', indice: 2, taxa: '7 em cada 10', criterio: 'Grande possibilidade de detecção. Há tripla checagem em locais diferentes.' },
    { efeito: 'Alto: probabilidade alta de detecção', indice: 3, taxa: '7 em cada 10', criterio: 'Grande possibilidade de detecção. Há dupla checagem em locais diferentes.' },
    { efeito: 'Médio: probabilidade moderada de detecção', indice: 4, taxa: '5 em cada 10', criterio: 'Razoável possibilidade de detecção. Há dupla checagem no mesmo local.' },
    { efeito: 'Médio: probabilidade moderada de detecção', indice: 5, taxa: '5 em cada 10', criterio: 'Razoável possibilidade de detecção. Há checagem cuidadosa.' },
    { efeito: 'Médio: probabilidade moderada de detecção', indice: 6, taxa: '5 em cada 10', criterio: 'Razoável possibilidade de detecção. Há dupla checagem com sobrecarga de trabalho.' },
    { efeito: 'Pequeno: probabilidade baixa de detecção', indice: 7, taxa: '2 em cada 10', criterio: 'Pequena possibilidade de detecção. A checagem é muito rápida.' },
    { efeito: 'Pequeno: probabilidade baixa de detecção', indice: 8, taxa: '2 em cada 10', criterio: 'Pequena possibilidade de detecção. Não há checagem.' },
    { efeito: 'Mínimo: quase certo de não detectar', indice: 9, taxa: '0 em cada 10', criterio: 'Mínima possibilidade de detecção.' },
    { efeito: 'Mínimo: quase certo de não detectar', indice: 10, taxa: '0 em cada 10', criterio: 'Possibilidade de detecção nula.' },
  ],
};

/** Setor em branco, com a estrutura de abas da planilha. */
export function novoSetor(nome = 'NOVO SETOR', tipo: TipoSetor = 'assistencial'): Setor {
  return {
    id: uid(),
    nome,
    tipo,
    introducao: {
      coordenador: '',
      lideranca: Array(5).fill(''),
      historico: 'O Serviço de ... iniciou suas atividades em .....',
    },
    perfil: {
      tipo: tipo === 'apoio' ? 'PERFIL DE DEMANDA (PROCESSOS DE APOIO)' : 'PERFIL EPIDEMIOLÓGICO (PROCESSOS ASSISTENCIAIS)',
      tabelasMensais: [novaTabelaMensal('<INDICADOR 1>'), novaTabelaMensal('<INDICADOR 2>')],
      tabelasDistribuicao: [novaTabelaDistribuicao('<INDICADOR 3>')],
    },
    modelagens: [novaModelagem()],
    gerenciamentoIncidentes: { meta: '', responsavel: '', plano: novoPlano() },
    interacoes: { itens: [novaInteracao()], plano: novoPlano() },
    indicadores: [novoIndicador('NOME DO INDICADOR')],
    contratuais: [novoContratual('NOME DO INDICADOR')],
    planoAI: {
      titulo: 'Auditoria Interna do Sistema de Gestão da Qualidade',
      macroentregas: [1, 2].map((n) => ({
        id: uid(),
        nome: `MACROENTREGA ${n}`,
        produtos: '',
        entregas: [{ id: uid(), nome: 'ENTREGA 1', acoes: [] }],
      })),
    },
    planoGestao: { acoes: [], analises: {} },
    fmeas: [novoFmea()],
  };
}

/** Hospital em branco (estratégia e macroprocesso vazios para preenchimento). */
export function novoHospital(sigla = 'NOVO', nome = 'Novo hospital'): Hospital {
  return {
    id: uid(),
    sigla,
    nome,
    cidade: '',
    estrategia: { missao: '', visao: '', valores: '', proposito: '', painel: [] },
    mapeamento: {
      titulo: `MACROPROCESSO UNIDADE ${sigla}`,
      codigo: 'MAP.GER.001',
      versao: '',
      revisao: '',
      gerenciais: [],
      finalisticos: [],
      apoio: [],
      priorizacao: [],
    },
    notificacoes: [],
    setores: [novoSetor('SETOR MODELO')],
  };
}

/** HRVJ — dados extraídos da planilha de gestão 2024-2027. */
export function hospitalHRVJ(): Hospital {
  const setor = novoSetor('SETOR MODELO');
  const ind = setor.indicadores[0];
  ind.nome = 'Taxa de conformidade da caminhada da segurança';
  ind.metas = { '2024': 85, '2025': 85, '2026': 90, '2027': 92 };
  ind.responsavelMeta = 'Lady Rosany / Emanuelly Crisóstomo / Dr. Bergson Moura';
  ind.numerador = 'Nº de itens conformes na caminhada da segurança';
  ind.denominador = 'Nº total de itens avaliados';
  ind.formula = 'Numerador / Denominador × 100';

  return {
    id: uid(),
    sigla: 'HRVJ',
    nome: 'Hospital Regional Vale do Jaguaribe',
    cidade: '',
    notificacoes: [],
    setores: [setor],
    estrategia: {
      missao:
        'Proporcionar o cuidado de alta complexidade com qualidade, aliado ao ensino e à pesquisa, integrado à Rede Estadual de Saúde.',
      visao:
        'Ser reconhecido nacionalmente pela excelência no cuidado de alta complexidade, promovendo inovação, ensino e pesquisa no âmbito da saúde.',
      valores:
        'Eficiência e Sustentabilidade · Valorização das pessoas · Comprometimento com o SUS · Transparência · Inovação e Conhecimento · Humanização · Inclusão e diversidade · Ética',
      proposito: 'Transformar a saúde para o bem-estar social.',
      painel: PAINEL.map((p) => ({ ...p, id: uid() })),
    },
    mapeamento: {
      titulo: 'MACROPROCESSO UNIDADE HRVJ',
      codigo: 'MAP.GER.001',
      versao: '02 - 17/04/2024',
      revisao: '02 - 17/04/2024',
      gerenciais: [
        'GESTÃO DA COMUNICAÇÃO',
        'DESENVOLVIMENTO HUMANO ORGANIZACIONAL',
        'GESTÃO ADMINISTRATIVA E FINANCEIRA',
        'GESTÃO DA CLÍNICA',
        'SATISFAÇÃO E EXPERIÊNCIA DOS USUÁRIOS',
        'VIGILÂNCIA EPIDEMIOLÓGICA',
        'PREVENÇÃO E CONTROLE DE INFECÇÕES HOSPITALARES',
        'GESTÃO DA QUALIDADE E SEGURANÇA DO PACIENTE',
      ],
      finalisticos: [
        'ASSISTÊNCIA AMBULATORIAL',
        'ASSISTÊNCIA EM CLÍNICA MÉDICA',
        'ASSISTÊNCIA EM TERAPIA INTENSIVA',
        'ASSISTÊNCIA HEMODINÂMICA EM CARDIOLOGIA',
        'ASSISTÊNCIA EM CLÍNICA PSIQUIÁTRICA',
        'ASSISTÊNCIA EM CLÍNICA CIRÚRGICA',
        'ASSISTÊNCIA EM CLÍNICA CIRÚRGICA TRAUMATOLÓGICA',
        'ATENDIMENTO CIRÚRGICO',
        'ASSISTÊNCIA EM URGÊNCIA E EMERGÊNCIA',
        'ASSISTÊNCIA ONCOLÓGICA',
      ],
      apoio: [
        'SEGURANÇA INSTITUCIONAL',
        'DIAGNÓSTICO POR IMAGEM',
        'TRANSPORTE HOSPITALAR',
        'ANÁLISES CLÍNICAS',
        'ENSINO E PESQUISA',
        'ASSISTÊNCIA HEMOTERÁPICA',
        'ROUPARIA',
        'HIGIENIZAÇÃO',
        'GESTÃO DO ACESSO',
        'FATURAMENTO E ARQUIVO DE PRONTUÁRIOS',
        'NUTRIÇÃO E DIETÉTICA',
        'ASSISTÊNCIA FARMACÊUTICA',
        'GESTÃO DE EQUIPAMENTOS E TECNOLOGIA HOSPITALAR',
        'GESTÃO DE INFRAESTRUTURA',
        'TECNOLOGIA DA INFORMAÇÃO',
        'PROCESSAMENTO DE PRODUTOS PARA A SAÚDE',
        'SEGURANÇA E MEDICINA DO TRABALHO',
        'ADMINISTRAÇÃO DE PESSOAL',
      ],
      priorizacao: PRIORIZACAO.map(
        ([processo, financeiro, assistencia, perfil, estrategia]): LinhaPriorizacao => ({
          id: uid(),
          processo,
          financeiro,
          assistencia,
          perfil,
          estrategia,
        }),
      ),
    },
  };
}

export function dadosIniciais(): AppData {
  return { versaoSchema: SCHEMA, hospitais: [hospitalHRVJ()] };
}

// Modelo de dados do sistema. Cada bloco corresponde a uma aba da planilha
// "PLANILHA GESTÃO 2024-2027".

export const ANOS = [2024, 2025, 2026, 2027] as const;
export type Ano = (typeof ANOS)[number];

export const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
export const TRIMESTRES = ['1º TRI', '2º TRI', '3º TRI', '4º TRI'];

export const STATUS = ['NÃO INICIADO', 'INICIADO', 'AVANÇADO', 'CONCLUÍDO', 'CANCELADO'] as const;
export type Status = (typeof STATUS)[number] | '';

/** Linha de análise FCA (Fato – Causa – Ação), usada nos planos de ação mensais. */
export interface FcaRow {
  id: string;
  ano: number;
  /** 1–12 (ou 1–4 para indicadores trimestrais) */
  periodo: number;
  fato: string;
  causa: string;
  acao: string;
  prazo: string;
  responsavel: string;
  status: Status;
}

export interface PlanoFca {
  linhas: FcaRow[];
  /** Análise anual por ano */
  analises: Record<string, string>;
}

// 1. INTRODUÇÃO ----------------------------------------------------------
export interface Introducao {
  coordenador: string;
  lideranca: string[];
  historico: string;
}

// 2. PERFIL --------------------------------------------------------------
export interface CriterioMensal {
  id: string;
  nome: string;
  valores: (number | null)[]; // 12 meses
}
export interface TabelaMensal {
  id: string;
  titulo: string;
  ano: number;
  criterios: CriterioMensal[];
}
export interface ItemDistribuicao {
  id: string;
  nome: string;
  quantidade: number | null;
}
export interface TabelaDistribuicao {
  id: string;
  titulo: string;
  itens: ItemDistribuicao[];
}
export interface Perfil {
  tipo: string;
  tabelasMensais: TabelaMensal[];
  tabelasDistribuicao: TabelaDistribuicao[];
}

// 3. ESTRATÉGIA 2024-2027 ------------------------------------------------
export interface LinhaPainel {
  id: string;
  perspectiva: string;
  objetivo: string;
  indicador: string;
  metas: Record<string, string>;
  responsavel: string;
}
export interface Estrategia {
  missao: string;
  visao: string;
  valores: string;
  proposito: string;
  painel: LinhaPainel[];
}

// 4. MAPEAMENTO DE PROCESSOS ---------------------------------------------
export interface LinhaPriorizacao {
  id: string;
  processo: string;
  financeiro: number | null;
  assistencia: number | null;
  perfil: number | null;
  estrategia: number | null;
}
export interface Mapeamento {
  titulo: string;
  codigo: string;
  versao: string;
  revisao: string;
  gerenciais: string[];
  finalisticos: string[];
  apoio: string[];
  priorizacao: LinhaPriorizacao[];
}

// 6. MODELAGEM (SIPOC) ---------------------------------------------------
export interface IndicadorModelagem {
  id: string;
  indicador: string;
  meta: string;
  responsavel: string;
}
export type TipoEtapa = 'inicio' | 'atividade' | 'decisao' | 'fim';
export interface EtapaFluxo {
  id: string;
  tipo: TipoEtapa;
  descricao: string;
  responsavel: string;
}
export interface VersaoDoc {
  id: string;
  versao: string;
  descricao: string;
  data: string;
  responsavel: string;
  proximaRevisao: string;
}
export interface Modelagem {
  id: string;
  codigo: string;
  titulo: string;
  versao: string;
  revisao: string;
  objetivo: string;
  fornecedores: string;
  entradas: string;
  macroetapas: string;
  saidas: string;
  clientes: string;
  acordos: string;
  fluxo: EtapaFluxo[];
  indicadoresResultado: IndicadorModelagem[];
  indicadoresProcesso: IndicadorModelagem[];
  historico: VersaoDoc[];
  validacao: string;
}

// 7/8/9. INCIDENTES ------------------------------------------------------
export interface Notificacao {
  id: string;
  codigo: string;
  dataOcorrencia: string; // ISO datetime-local
  setorNotificado: string;
  localOcorrencia: string;
  tipoClassificacao: string;
  codInteracao: string;
  natureza: string;
  afetouPaciente: 'SIM' | 'NÃO' | '';
  prontuario: string;
  status: string;
  dataClassificacao: string;
  statusResposta: string;
  dataResposta: string;
  dataConclusao: string;
  descricao: string;
  causa: string;
  observacao: string;
}
export interface GerenciamentoIncidentes {
  meta: string;
  responsavel: string;
  plano: PlanoFca;
}

// 10. GERENCIAMENTO DAS INTERAÇÕES ---------------------------------------
export type Conformidade = 'C' | 'NC' | '';
export interface MesInteracao {
  notificacoes: number | null;
  conformidade: Conformidade;
}
export interface Interacao {
  id: string;
  dataElaboracao: string;
  revisadoEm: string;
  versao: string;
  proximaRevisao: string;
  fornecedor: string;
  cliente: string;
  processo: string;
  /** chave `${ano}-${mes}` */
  meses: Record<string, MesInteracao>;
}
export interface Interacoes {
  itens: Interacao[];
  plano: PlanoFca;
}

// INDICADORES ------------------------------------------------------------
export type TipoCalculo = 'percentual' | 'densidade' | 'taxa' | 'absoluto';
export type Periodicidade = 'mensal' | 'trimestral';
export type Polaridade = '▲' | '▼' | '►◄';

export interface Indicador {
  id: string;
  nome: string;
  tipoCalculo: TipoCalculo;
  periodicidade: Periodicidade;
  polaridade: Polaridade;
  unidade: string;
  metas: Record<string, number | null>;
  linhaBase: number | null;
  responsavelMeta: string;
  justificativa: string;
  criterios: string;
  numerador: string;
  denominador: string;
  formula: string;
  fonteColeta: string;
  sistematica: string;
  gestor: string;
  // controle da ficha técnica
  dataElaboracao: string;
  revisadoEm: string;
  versao: string;
  proximaRevisao: string;
  /** chave `${ano}-${periodo}` */
  dados: Record<string, { num: number | null; den: number | null }>;
  plano: PlanoFca;
}

// MODELO - INDICADORES CONTRATUAIS ---------------------------------------
export interface IndicadorContratual {
  id: string;
  nome: string;
  responsavel: string;
  /** ▲ quanto maior melhor (resultado/meta); ▼ limite máximo (100% até a meta) */
  polaridade: '▲' | '▼';
  /** chave `${ano}-${mes}` */
  dados: Record<string, { resultado: number | null; meta: number | null }>;
  plano: PlanoFca;
}

// 11. PLANO DE AÇÃO - AI (Auditoria Interna) -----------------------------
export interface AcaoAI {
  id: string;
  diagnostico: string;
  acao: string;
  prazo: string;
  responsavel: string;
  status: Status;
  melhorias: string;
}
export interface EntregaAI {
  id: string;
  nome: string;
  acoes: AcaoAI[];
}
export interface MacroentregaAI {
  id: string;
  nome: string;
  produtos: string;
  entregas: EntregaAI[];
}
export interface PlanoAI {
  titulo: string;
  macroentregas: MacroentregaAI[];
}

// 12. PLANO DE AÇÕES - GESTÃO --------------------------------------------
export interface AcaoGestao {
  id: string;
  ano: number;
  mes: number;
  acao: string;
  dataConclusao: string;
  responsavel: string;
  status: Status;
}
export interface PlanoGestao {
  acoes: AcaoGestao[];
  analises: Record<string, string>;
}

// FMEA -------------------------------------------------------------------
export interface LinhaFmea {
  id: string;
  etapa: string;
  modoFalha: string;
  efeito: string;
  g: number | null;
  causas: string;
  o: number | null;
  controles: string;
  d: number | null;
  acoesRecomendadas: string;
  responsavelPrazo: string;
  acoesTomadas: string;
  g2: number | null;
  o2: number | null;
  d2: number | null;
}
export interface Fmea {
  id: string;
  processo: string;
  equipe: string;
  data: string;
  revisao: string;
  responsavel: string;
  linhas: LinhaFmea[];
}

// SETOR / HOSPITAL / RAIZ ---------------------------------------------------

export type TipoSetor = 'assistencial' | 'apoio' | 'gerencial';

/** Cada setor do hospital tem a sua própria "planilha de gestão". */
export interface Setor {
  id: string;
  nome: string;
  tipo: TipoSetor;
  introducao: Introducao;
  perfil: Perfil;
  modelagens: Modelagem[];
  gerenciamentoIncidentes: GerenciamentoIncidentes;
  interacoes: Interacoes;
  indicadores: Indicador[];
  contratuais: IndicadorContratual[];
  planoAI: PlanoAI;
  planoGestao: PlanoGestao;
  fmeas: Fmea[];
}

/** Itens institucionais ficam no hospital e são compartilhados por todos os setores. */
export interface Hospital {
  id: string;
  sigla: string;
  nome: string;
  cidade: string;
  estrategia: Estrategia;
  mapeamento: Mapeamento;
  notificacoes: Notificacao[];
  setores: Setor[];
}

export interface AppData {
  versaoSchema: number;
  hospitais: Hospital[];
}

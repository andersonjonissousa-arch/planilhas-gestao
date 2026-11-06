import { useState } from 'react';
import { FcaTable } from '../components/FcaTable';
import { GraficoSerie } from '../components/charts';
import { AnoTabs, Btn, Card, Campo, Kpi, ListaLateral, Num, PageHeader, Sel, Txt, useSelecao, Vazio } from '../components/ui';
import {
  avaliarMeta,
  chave,
  fmtResultado,
  mediana,
  periodosDoIndicador,
  resultadoAnual,
  resultadoPeriodo,
  ROTULO_TIPO,
  serieAno,
  ultimoResultado,
} from '../lib/calc';
import { novoIndicador, novoPlano } from '../seed';
import { useSetor } from '../store';
import { ANOS, MESES, TRIMESTRES, type Indicador, type Periodicidade, type Polaridade, type TipoCalculo } from '../types';

const ANO_ATUAL = Math.min(2027, Math.max(2024, new Date().getFullYear()));

export const POLARIDADES: { valor: Polaridade; rotulo: string }[] = [
  { valor: '▲', rotulo: '▲ Quanto maior, melhor' },
  { valor: '▼', rotulo: '▼ Quanto menor, melhor' },
  { valor: '►◄', rotulo: '►◄ Estabilidade (sem direção)' },
];

const TIPOS = (Object.keys(ROTULO_TIPO) as TipoCalculo[]).map((t) => ({ valor: t, rotulo: ROTULO_TIPO[t] }));
const PERIODICIDADES: { valor: Periodicidade; rotulo: string }[] = [
  { valor: 'mensal', rotulo: 'Mensal' },
  { valor: 'trimestral', rotulo: 'Trimestral' },
];

type Aba = 'desempenho' | 'base' | 'plano' | 'ficha';

export default function Indicadores() {
  const { setor, updS } = useSetor();
  const { item: ind, idx, selId, setSelId } = useSelecao(setor.indicadores);
  const [ano, setAno] = useState(ANO_ATUAL);
  const [aba, setAba] = useState<Aba>('desempenho');
  const set = (fn: (x: Indicador) => void) => updS((d) => fn(d.indicadores[idx]));

  return (
    <>
      <PageHeader titulo="Indicadores de Desempenho" descricao="Base histórica (numerador/denominador), análise de desempenho com série histórica e meta, plano de ação FCA e ficha técnica." />
      <div className="com-lista">
        <ListaLateral
          itens={setor.indicadores}
          selecionado={selId}
          onSelecionar={setSelId}
          rotulo={(i) => {
            const u = ultimoResultado(i);
            const av = u ? avaliarMeta(u.valor, i.metas[u.ano], i.polaridade) : 'sem-dados';
            return (
              <>
                <span className={`farol farol-${av}`} aria-hidden />
                {i.nome}
              </>
            );
          }}
          onNovo={() => {
            const n = novoIndicador();
            updS((d) => void d.indicadores.push(n));
            setSelId(n.id);
            setAba('ficha');
          }}
          textoNovo="+ Novo indicador"
        />
        <div className="conteudo-lista">
          {!ind ? (
            <Vazio>Nenhum indicador cadastrado neste setor.</Vazio>
          ) : (
            <>
              <Card>
                <div className="ind-topo">
                  <Txt className="titulo-inline grande" value={ind.nome} onChange={(v) => set((x) => void (x.nome = v))} ariaLabel="Nome do indicador" />
                  <div className="ind-meta">
                    <span className="chip">{ROTULO_TIPO[ind.tipoCalculo].split(' (')[0]}</span>
                    <span className="chip">{ind.periodicidade === 'trimestral' ? 'Trimestral' : 'Mensal'}</span>
                    <span className="chip">Polaridade {ind.polaridade}</span>
                    {ind.responsavelMeta && <span className="chip">Resp.: {ind.responsavelMeta}</span>}
                  </div>
                </div>
                <div className="tabs-linha">
                  <div className="tabs" role="tablist">
                    {(
                      [
                        ['desempenho', 'Análise de desempenho'],
                        ['base', 'Base histórica'],
                        ['plano', 'Plano de ação (FCA)'],
                        ['ficha', 'Ficha técnica'],
                      ] as [Aba, string][]
                    ).map(([k, r]) => (
                      <button key={k} className={aba === k ? 'tab ativo' : 'tab'} onClick={() => setAba(k)}>
                        {r}
                      </button>
                    ))}
                  </div>
                  {aba !== 'ficha' && <AnoTabs ano={ano} onChange={setAno} />}
                </div>
              </Card>

              {aba === 'desempenho' && <Desempenho ind={ind} ano={ano} />}
              {aba === 'base' && <BaseHistorica ind={ind} ano={ano} set={set} />}
              {aba === 'plano' && (
                <FcaTable
                  plano={ind.plano ?? novoPlano()}
                  setPlano={(fn) => set((x) => fn(x.plano))}
                  ano={ano}
                  periodos={periodosDoIndicador(ind)}
                  rotuloPeriodo={(p) => `${(ind.periodicidade === 'trimestral' ? TRIMESTRES : MESES)[p - 1]}/${ano}`}
                  resultado={(p) => fmtResultado(ind.tipoCalculo, serieAno(ind, ano)[p - 1], ind.unidade)}
                />
              )}
              {aba === 'ficha' && (
                <FichaTecnica
                  ind={ind}
                  set={set}
                  onExcluir={() => {
                    if (!confirm(`Excluir o indicador "${ind.nome}" e todos os seus dados?`)) return;
                    updS((d) => void d.indicadores.splice(idx, 1));
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Desempenho({ ind, ano }: { ind: Indicador; ano: number }) {
  const rot = ind.periodicidade === 'trimestral' ? TRIMESTRES : MESES;
  const anos = ANOS.filter((a) => a <= ano && a >= ano - 3);
  const series = Object.fromEntries(anos.map((a) => [a, serieAno(ind, a)]));
  const dados = rot.map((r, i) => ({ rotulo: r, ...Object.fromEntries(anos.map((a) => [String(a), series[a][i] == null ? null : Math.round(series[a][i]! * 100) / 100])) }));
  const meta = ind.metas[ano] ?? null;
  const anual = resultadoAnual(ind, ano);
  const med = mediana(series[ano]);
  const avAnual = avaliarMeta(anual, meta, ind.polaridade);
  const atingidos = series[ano].filter((v) => avaliarMeta(v, meta, ind.polaridade) === 'atingida').length;
  const comDados = series[ano].filter((v) => v != null).length;
  const suf = ind.tipoCalculo === 'percentual' ? '%' : '';

  return (
    <>
      <div className="kpis">
        <Kpi rotulo={`Meta ${ano}`} valor={meta == null ? '—' : fmtResultado(ind.tipoCalculo, meta, ind.unidade)} detalhe={`Polaridade ${ind.polaridade}`} />
        <Kpi
          rotulo={`Resultado anual ${ano}`}
          valor={fmtResultado(ind.tipoCalculo, anual, ind.unidade)}
          detalhe={ind.tipoCalculo === 'absoluto' ? 'soma do ano' : 'Σ numerador / Σ denominador'}
          tom={avAnual === 'atingida' ? 'ok' : avAnual === 'nao-atingida' ? 'ruim' : undefined}
        />
        <Kpi rotulo="Mediana do ano" valor={fmtResultado(ind.tipoCalculo, med, ind.unidade)} detalhe={ind.linhaBase != null ? `Linha de base: ${fmtResultado(ind.tipoCalculo, ind.linhaBase, ind.unidade)}` : undefined} />
        <Kpi rotulo="Períodos na meta" valor={comDados ? `${atingidos}/${comDados}` : '—'} detalhe={ind.polaridade === '►◄' ? 'polaridade sem direção' : undefined} />
      </div>
      <Card titulo={`SÉRIE HISTÓRICA — ${ind.nome}`}>
        <GraficoSerie dados={dados} series={anos.map((a) => ({ chave: String(a), nome: String(a), destaque: a === ano }))} meta={meta} sufixo={suf} altura={320} />
      </Card>
      <Card titulo="Tabela de resultados">
        <div className="tabela-scroll">
          <table className="tabela compacta">
            <thead>
              <tr>
                <th>PERÍODO</th>
                {anos.map((a) => (
                  <th key={a} colSpan={3}>
                    {a}
                  </th>
                ))}
              </tr>
              <tr>
                <th></th>
                {anos.map((a) => [
                  <th key={a + 'r'}>RESULTADO</th>,
                  <th key={a + 'n'}>NUM.</th>,
                  <th key={a + 'd'}>DEN.</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {rot.map((r, i) => (
                <tr key={r}>
                  <td className="periodo">{r}</td>
                  {anos.map((a) => {
                    const d = ind.dados[chave(a, i + 1)];
                    const av = avaliarMeta(series[a][i], ind.metas[a], ind.polaridade);
                    return [
                      <td key={a + 'r'} className={`num res-${av}`}>
                        {fmtResultado(ind.tipoCalculo, series[a][i], ind.unidade)}
                      </td>,
                      <td key={a + 'n'} className="num fraco">
                        {d?.num ?? ''}
                      </td>,
                      <td key={a + 'd'} className="num fraco">
                        {d?.den ?? ''}
                      </td>,
                    ];
                  })}
                </tr>
              ))}
              <tr className="linha-total">
                <td>MEDIANA</td>
                {anos.map((a) => [
                  <td key={a} className="num">
                    {fmtResultado(ind.tipoCalculo, mediana(series[a]), ind.unidade)}
                  </td>,
                  <td key={a + 'x'} colSpan={2}></td>,
                ])}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function BaseHistorica({ ind, ano, set }: { ind: Indicador; ano: number; set: (fn: (x: Indicador) => void) => void }) {
  const rot = ind.periodicidade === 'trimestral' ? TRIMESTRES : MESES;
  const meta = ind.metas[ano] ?? null;
  const setDado = (p: number, campo: 'num' | 'den', v: number | null) =>
    set((x) => {
      const k = chave(ano, p);
      x.dados[k] = { ...(x.dados[k] ?? { num: null, den: null }), [campo]: v };
    });
  const anual = resultadoAnual(ind, ano);
  return (
    <Card titulo={`BASE HISTÓRICA — ${ano}`} acoes={<span className="dica">Meta {ano}: {meta == null ? 'não definida (ver ficha técnica)' : fmtResultado(ind.tipoCalculo, meta, ind.unidade)}</span>}>
      <table className="tabela compacta base">
        <thead>
          <tr>
            <th>PERÍODO</th>
            <th>NUMERADOR</th>
            {ind.tipoCalculo !== 'absoluto' && <th>DENOMINADOR</th>}
            <th>RESULTADO</th>
            <th>SITUAÇÃO</th>
          </tr>
        </thead>
        <tbody>
          {rot.map((r, i) => {
            const d = ind.dados[chave(ano, i + 1)];
            const res = resultadoPeriodo(ind.tipoCalculo, d?.num, d?.den);
            const av = avaliarMeta(res, meta, ind.polaridade);
            return (
              <tr key={r}>
                <td className="periodo">{r}</td>
                <td>
                  <Num value={d?.num} onChange={(v) => setDado(i + 1, 'num', v)} ariaLabel={`Numerador ${r}`} />
                </td>
                {ind.tipoCalculo !== 'absoluto' && (
                  <td>
                    <Num value={d?.den} onChange={(v) => setDado(i + 1, 'den', v)} ariaLabel={`Denominador ${r}`} />
                  </td>
                )}
                <td className={`num res-${av}`}>{fmtResultado(ind.tipoCalculo, res, ind.unidade)}</td>
                <td>
                  <span className={`situacao sit-${av}`}>
                    {{ atingida: 'Meta atingida', 'nao-atingida': 'Abaixo da meta', neutra: '—', 'sem-dados': '' }[av]}
                  </span>
                </td>
              </tr>
            );
          })}
          <tr className="linha-total">
            <td>RESULTADO ANUAL {ano}</td>
            <td colSpan={ind.tipoCalculo !== 'absoluto' ? 2 : 1}></td>
            <td className="num">{fmtResultado(ind.tipoCalculo, anual, ind.unidade)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <p className="dica">
        Resultado = {ROTULO_TIPO[ind.tipoCalculo]}. Deixe em branco os períodos sem dados — eles não entram no cálculo.
      </p>
    </Card>
  );
}

export function FichaTecnica({ ind, set, onExcluir }: { ind: Indicador; set: (fn: (x: Indicador) => void) => void; onExcluir?: () => void }) {
  const txt = (rotulo: string, campo: keyof Indicador, multiline = false) => (
    <Campo rotulo={rotulo} largo={multiline}>
      <Txt multiline={multiline} rows={2} value={ind[campo] as string} onChange={(v) => set((x) => void ((x as unknown as Record<string, string>)[campo] = v))} />
    </Campo>
  );
  return (
    <Card titulo="FICHA TÉCNICA DO INDICADOR" acoes={onExcluir && <Btn variante="perigo" onClick={onExcluir}>Excluir indicador</Btn>}>
      <div className="grade-4">
        <Campo rotulo="TIPO DE CÁLCULO">
          <Sel value={ind.tipoCalculo} opcoes={TIPOS} onChange={(v) => set((x) => void (x.tipoCalculo = v))} />
        </Campo>
        <Campo rotulo="PERIODICIDADE">
          <Sel value={ind.periodicidade} opcoes={PERIODICIDADES} onChange={(v) => set((x) => void (x.periodicidade = v))} />
        </Campo>
        <Campo rotulo="POLARIDADE">
          <Sel value={ind.polaridade} opcoes={POLARIDADES} onChange={(v) => set((x) => void (x.polaridade = v))} />
        </Campo>
        <Campo rotulo="UNIDADE (opcional)">
          <Txt value={ind.unidade} placeholder="ex.: dias, por mil pac-dia" onChange={(v) => set((x) => void (x.unidade = v))} />
        </Campo>
      </div>
      <div className="grade-4">
        {ANOS.map((a) => (
          <Campo key={a} rotulo={`META ${a}`}>
            <Num value={ind.metas[a]} onChange={(v) => set((x) => void (x.metas[a] = v))} />
          </Campo>
        ))}
      </div>
      <div className="grade-3">
        <Campo rotulo="LINHA DE BASE">
          <Num value={ind.linhaBase} onChange={(v) => set((x) => void (x.linhaBase = v))} />
        </Campo>
        {txt('RESPONSÁVEL PELA META', 'responsavelMeta')}
        {txt('GESTOR DO INDICADOR', 'gestor')}
      </div>
      {txt('JUSTIFICATIVA', 'justificativa', true)}
      {txt('CRITÉRIOS', 'criterios', true)}
      <div className="grade-2">
        {txt('NUMERADOR', 'numerador', true)}
        {txt('DENOMINADOR', 'denominador', true)}
      </div>
      <div className="grade-3">
        {txt('FÓRMULA', 'formula')}
        {txt('FONTE DA COLETA', 'fonteColeta')}
        {txt('SISTEMÁTICA DE AVALIAÇÃO', 'sistematica')}
      </div>
      <h3 className="sub">Controle do documento</h3>
      <div className="grade-4">
        <Campo rotulo="DATA DE ELABORAÇÃO">
          <Txt type="date" value={ind.dataElaboracao} onChange={(v) => set((x) => void (x.dataElaboracao = v))} />
        </Campo>
        <Campo rotulo="REVISADO EM">
          <Txt type="date" value={ind.revisadoEm} onChange={(v) => set((x) => void (x.revisadoEm = v))} />
        </Campo>
        {txt('VERSÃO', 'versao')}
        <Campo rotulo="PRÓXIMA REVISÃO">
          <Txt type="date" value={ind.proximaRevisao} onChange={(v) => set((x) => void (x.proximaRevisao = v))} />
        </Campo>
      </div>
    </Card>
  );
}

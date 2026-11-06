import { Btn, Card, Campo, PageHeader, Remover, StatusSelect, Txt } from '../components/ui';
import { fmtPct, percConclusaoAcoes } from '../lib/calc';
import { uid } from '../seed';
import { useSetor } from '../store';
import type { MacroentregaAI } from '../types';

function Barra({ valor }: { valor: number | null }) {
  return (
    <div className="barra" title={fmtPct(valor)}>
      <div style={{ width: `${Math.round((valor ?? 0) * 100)}%` }} />
      <span>{fmtPct(valor, 0)}</span>
    </div>
  );
}

export default function PlanoAI() {
  const { setor, updS } = useSetor();
  const p = setor.planoAI;
  const geral = percConclusaoAcoes(p.macroentregas.flatMap((m) => m.entregas.flatMap((e) => e.acoes)));
  const setM = (mi: number, fn: (m: MacroentregaAI) => void) => updS((d) => fn(d.planoAI.macroentregas[mi]));

  return (
    <>
      <PageHeader numero="11" titulo="Plano de Ação — Auditoria Interna" descricao="Macroentregas → entregas → ações, com % de conclusão calculado pelo status (canceladas não contam).">
        <Btn
          variante="pri"
          onClick={() => updS((d) => void d.planoAI.macroentregas.push({ id: uid(), nome: `MACROENTREGA ${d.planoAI.macroentregas.length + 1}`, produtos: '', entregas: [{ id: uid(), nome: 'ENTREGA 1', acoes: [] }] }))}
        >
          + Macroentrega
        </Btn>
      </PageHeader>
      <Card>
        <div className="grade-2">
          <Campo rotulo="TÍTULO DO PLANO">
            <Txt value={p.titulo} onChange={(v) => updS((d) => void (d.planoAI.titulo = v))} />
          </Campo>
          <Campo rotulo="% CONCLUSÃO GERAL">
            <Barra valor={geral} />
          </Campo>
        </div>
      </Card>

      {p.macroentregas.map((m, mi) => {
        const pm = percConclusaoAcoes(m.entregas.flatMap((e) => e.acoes));
        return (
          <Card
            key={m.id}
            className="macroentrega"
            titulo={<Txt className="titulo-inline" value={m.nome} onChange={(v) => setM(mi, (x) => void (x.nome = v))} ariaLabel="Nome da macroentrega" />}
            acoes={
              <>
                <span className="rotulo-pct">%TOTAL</span>
                <Barra valor={pm} />
                <Remover rotulo="Remover macroentrega" onClick={() => confirm(`Remover ${m.nome}?`) && updS((d) => void d.planoAI.macroentregas.splice(mi, 1))} />
              </>
            }
          >
            <Campo rotulo="PRODUTOS A SEREM DESENVOLVIDOS (OBJETIVOS A SEREM ALCANÇADOS)" largo>
              <Txt multiline rows={2} value={m.produtos} onChange={(v) => setM(mi, (x) => void (x.produtos = v))} />
            </Campo>
            {m.entregas.map((e, ei) => {
              const setE = (fn: (x: typeof e) => void) => setM(mi, (x) => fn(x.entregas[ei]));
              return (
                <div key={e.id} className="entrega">
                  <div className="entrega-head">
                    <Txt className="titulo-inline" value={e.nome} onChange={(v) => setE((x) => void (x.nome = v))} ariaLabel="Nome da entrega" />
                    <span className="rotulo-pct">% CONCLUSÃO</span>
                    <Barra valor={percConclusaoAcoes(e.acoes)} />
                    <Remover rotulo="Remover entrega" onClick={() => confirm(`Remover ${e.nome}?`) && setM(mi, (x) => void x.entregas.splice(ei, 1))} />
                  </div>
                  <div className="tabela-scroll">
                    <table className="tabela compacta">
                      <thead>
                        <tr>
                          <th>DIAGNÓSTICO INICIAL (SITUAÇÃO ATUAL)</th>
                          <th>AÇÕES</th>
                          <th style={{ width: 140 }}>PRAZO</th>
                          <th style={{ width: 150 }}>RESPONSÁVEL(S)</th>
                          <th style={{ width: 140 }}>STATUS</th>
                          <th>MELHORIAS ALCANÇADAS (QUAL, ONDE E QUANDO)</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {e.acoes.map((a, ai) => {
                          const setA = (fn: (x: typeof a) => void) => setE((x) => fn(x.acoes[ai]));
                          return (
                            <tr key={a.id}>
                              <td>
                                <Txt multiline rows={2} value={a.diagnostico} onChange={(v) => setA((x) => void (x.diagnostico = v))} ariaLabel="Diagnóstico" />
                              </td>
                              <td>
                                <Txt multiline rows={2} value={a.acao} onChange={(v) => setA((x) => void (x.acao = v))} ariaLabel="Ação" />
                              </td>
                              <td>
                                <Txt type="date" value={a.prazo} onChange={(v) => setA((x) => void (x.prazo = v))} ariaLabel="Prazo" />
                              </td>
                              <td>
                                <Txt value={a.responsavel} onChange={(v) => setA((x) => void (x.responsavel = v))} ariaLabel="Responsável" />
                              </td>
                              <td>
                                <StatusSelect value={a.status} onChange={(v) => setA((x) => void (x.status = v))} />
                              </td>
                              <td>
                                <Txt multiline rows={2} value={a.melhorias} onChange={(v) => setA((x) => void (x.melhorias = v))} ariaLabel="Melhorias" />
                              </td>
                              <td>
                                <Remover onClick={() => setE((x) => void x.acoes.splice(ai, 1))} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Btn
                    variante="fantasma"
                    onClick={() => setE((x) => void x.acoes.push({ id: uid(), diagnostico: '', acao: '', prazo: '', responsavel: '', status: 'NÃO INICIADO', melhorias: '' }))}
                  >
                    + Ação
                  </Btn>
                </div>
              );
            })}
            <Btn onClick={() => setM(mi, (x) => void x.entregas.push({ id: uid(), nome: `ENTREGA ${x.entregas.length + 1}`, acoes: [] }))}>+ Entrega</Btn>
          </Card>
        );
      })}
    </>
  );
}

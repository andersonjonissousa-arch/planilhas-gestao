import { Btn, Card, Campo, ListaTexto, Num, PageHeader, Remover, Txt } from '../components/ui';
import { classePriorizacao, totalPriorizacao } from '../lib/calc';
import { uid } from '../seed';
import { useHospital } from '../store';
import type { LinhaPriorizacao } from '../types';

const CRITERIOS: { chave: keyof Omit<LinhaPriorizacao, 'id' | 'processo'>; rotulo: string }[] = [
  { chave: 'financeiro', rotulo: 'IMPACTO NA SUSTENTABILIDADE FINANCEIRA' },
  { chave: 'assistencia', rotulo: 'IMPACTO NA ASSISTÊNCIA AO PACIENTE' },
  { chave: 'perfil', rotulo: 'RELAÇÃO COM O PERFIL DE PACIENTES' },
  { chave: 'estrategia', rotulo: 'CONTRIBUIÇÃO PARA A ESTRATÉGIA (MISSÃO E VISÃO)' },
];

export default function Mapeamento() {
  const { hospital, updH } = useHospital();
  const m = hospital.mapeamento;
  const ordenada = [...m.priorizacao].sort((a, b) => totalPriorizacao(b) - totalPriorizacao(a));

  return (
    <>
      <PageHeader
        numero="4"
        titulo="Mapeamento de Processos"
        descricao="MACROPROCESSO é o conjunto de processos pelos quais a organização cumpre sua missão e entrega ao cliente seus produtos."
      />

      <Card titulo="Controle do documento">
        <div className="grade-4">
          <Campo rotulo="TÍTULO">
            <Txt value={m.titulo} onChange={(v) => updH((d) => void (d.mapeamento.titulo = v))} />
          </Campo>
          <Campo rotulo="CÓD. DO DOCUMENTO">
            <Txt value={m.codigo} onChange={(v) => updH((d) => void (d.mapeamento.codigo = v))} />
          </Campo>
          <Campo rotulo="VERSÃO">
            <Txt value={m.versao} onChange={(v) => updH((d) => void (d.mapeamento.versao = v))} />
          </Campo>
          <Campo rotulo="REVISÃO">
            <Txt value={m.revisao} onChange={(v) => updH((d) => void (d.mapeamento.revisao = v))} />
          </Campo>
        </div>
      </Card>

      <Card titulo="Cadeia de valor — Macroprocesso">
        <div className="macro">
          <div className="macro-faixa macro-ger">
            <h3>PROCESSOS GERENCIAIS</h3>
            <div className="macro-itens">
              {m.gerenciais.filter(Boolean).map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
          </div>
          <div className="macro-meio">
            <div className="macro-es">ENTRADAS</div>
            <div className="macro-faixa macro-fin">
              <h3>PROCESSOS FINALÍSTICOS</h3>
              <div className="macro-itens">
                {m.finalisticos.filter(Boolean).map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
            </div>
            <div className="macro-es">SAÍDAS</div>
          </div>
          <div className="macro-faixa macro-apo">
            <h3>PROCESSOS DE APOIO</h3>
            <div className="macro-itens">
              {m.apoio.filter(Boolean).map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
          </div>
        </div>
        <details className="editar-bloco">
          <summary>Editar processos</summary>
          <div className="grade-3">
            <Campo rotulo="PROCESSOS GERENCIAIS">
              <ListaTexto itens={m.gerenciais} onChange={(v) => updH((d) => void (d.mapeamento.gerenciais = v))} />
            </Campo>
            <Campo rotulo="PROCESSOS FINALÍSTICOS">
              <ListaTexto itens={m.finalisticos} onChange={(v) => updH((d) => void (d.mapeamento.finalisticos = v))} />
            </Campo>
            <Campo rotulo="PROCESSOS DE APOIO">
              <ListaTexto itens={m.apoio} onChange={(v) => updH((d) => void (d.mapeamento.apoio = v))} />
            </Campo>
          </div>
        </details>
      </Card>

      <Card
        titulo="MATRIZ DE PRIORIZAÇÃO DE PROCESSOS"
        acoes={
          <>
            <Btn
              variante="fantasma"
              title="Importa os processos finalísticos que ainda não estão na matriz"
              onClick={() =>
                updH((d) => {
                  const ja = new Set(d.mapeamento.priorizacao.map((l) => l.processo.trim().toUpperCase()));
                  for (const p of d.mapeamento.finalisticos)
                    if (p && !ja.has(p.trim().toUpperCase()))
                      d.mapeamento.priorizacao.push({ id: uid(), processo: p, financeiro: null, assistencia: null, perfil: null, estrategia: null });
                })
              }
            >
              Importar finalísticos
            </Btn>
            <Btn onClick={() => updH((d) => void d.mapeamento.priorizacao.push({ id: uid(), processo: '', financeiro: null, assistencia: null, perfil: null, estrategia: null }))}>
              + Processo
            </Btn>
          </>
        }
      >
        <div className="tabela-scroll">
          <table className="tabela">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>PROCESSOS FINALÍSTICOS</th>
                {CRITERIOS.map((c) => (
                  <th key={c.chave} style={{ width: 130 }}>
                    {c.rotulo}
                  </th>
                ))}
                <th style={{ width: 90 }}>TOTAL DE PONTOS</th>
                <th style={{ width: 190 }}>PRIORIZAÇÃO</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {m.priorizacao.map((l, i) => {
                const total = totalPriorizacao(l);
                const cl = classePriorizacao(total);
                return (
                  <tr key={l.id}>
                    <td>
                      <Txt value={l.processo} onChange={(v) => updH((d) => void (d.mapeamento.priorizacao[i].processo = v))} ariaLabel="Processo" />
                    </td>
                    {CRITERIOS.map((c) => (
                      <td key={c.chave}>
                        <Num min={1} max={5} value={l[c.chave]} onChange={(v) => updH((d) => void (d.mapeamento.priorizacao[i][c.chave] = v))} ariaLabel={c.rotulo} />
                      </td>
                    ))}
                    <td className="num total">{total}</td>
                    <td>
                      <span className={`prio prio-${cl.nivel}`}>{cl.rotulo}</span>
                    </td>
                    <td>
                      <Remover onClick={() => updH((d) => void d.mapeamento.priorizacao.splice(i, 1))} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="legenda-grade">
          <div>
            <b>PONTUAÇÃO</b>
            <p>ALTO IMPACTO: 4 – 5</p>
            <p>MÉDIO IMPACTO: 2 – 3</p>
            <p>BAIXO IMPACTO: 1</p>
          </div>
          <div>
            <b>SCORE / SOMATÓRIO</b>
            <p>
              <span className="prio prio-0">BAIXA</span> 4 – 8 pontos
            </p>
            <p>
              <span className="prio prio-1">MÉDIA</span> 9 – 13 pontos
            </p>
            <p>
              <span className="prio prio-2">ALTA</span> 14 – 18 pontos
            </p>
            <p>
              <span className="prio prio-3">MUITO ALTA</span> ≥ 19 pontos
            </p>
          </div>
          <div>
            <b>RANKING</b>
            <ol className="ranking">
              {ordenada.slice(0, 5).map((l) => (
                <li key={l.id}>
                  {l.processo || '(sem nome)'} — <b>{totalPriorizacao(l)}</b>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Card>
    </>
  );
}

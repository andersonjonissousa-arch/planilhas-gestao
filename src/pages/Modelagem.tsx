import { Btn, Card, Campo, ListaLateral, PageHeader, Remover, Sel, Txt, useSelecao, Vazio } from '../components/ui';
import { novaModelagem, uid } from '../seed';
import { useSetor } from '../store';
import type { IndicadorModelagem, Modelagem as TModelagem, TipoEtapa } from '../types';

const TIPOS: { valor: TipoEtapa; rotulo: string }[] = [
  { valor: 'inicio', rotulo: 'Início' },
  { valor: 'atividade', rotulo: 'Atividade' },
  { valor: 'decisao', rotulo: 'Decisão' },
  { valor: 'fim', rotulo: 'Fim' },
];

const SIPOC: { chave: keyof TModelagem; s: string; rotulo: string }[] = [
  { chave: 'fornecedores', s: 'S', rotulo: 'Suppliers — Fornecedores' },
  { chave: 'entradas', s: 'I', rotulo: 'Inputs — Entradas' },
  { chave: 'macroetapas', s: 'P', rotulo: 'Process — Macroetapas' },
  { chave: 'saidas', s: 'O', rotulo: 'Outputs — Saídas' },
  { chave: 'clientes', s: 'C', rotulo: 'Customers — Clientes' },
  { chave: 'acordos', s: '', rotulo: 'Acordos' },
];

export default function Modelagem() {
  const { setor, updS } = useSetor();
  const { item: m, idx, selId, setSelId } = useSelecao(setor.modelagens);
  const set = (fn: (x: TModelagem) => void) => updS((d) => fn(d.modelagens[idx]));

  return (
    <>
      <PageHeader numero="6" titulo="Modelagem de Processos" descricao="Documento de modelagem: SIPOC, fluxograma do processo, indicadores de resultado e de processo e histórico de versões." />
      <div className="com-lista">
        <ListaLateral
          itens={setor.modelagens}
          selecionado={selId}
          onSelecionar={setSelId}
          rotulo={(x) => (
            <>
              <small>{x.codigo}</small>
              {x.titulo}
            </>
          )}
          onNovo={() => {
            const n = novaModelagem();
            updS((d) => void d.modelagens.push(n));
            setSelId(n.id);
          }}
          textoNovo="+ Nova modelagem"
        />
        <div className="conteudo-lista">
          {!m ? (
            <Vazio>Selecione ou crie uma modelagem.</Vazio>
          ) : (
            <>
              <Card
                titulo="TIPO DE DOCUMENTO: MAPEAMENTO DE PROCESSOS"
                acoes={
                  <Btn
                    variante="perigo"
                    onClick={() => {
                      if (!confirm(`Excluir a modelagem "${m.titulo}"?`)) return;
                      updS((d) => void d.modelagens.splice(idx, 1));
                      setSelId(setor.modelagens.find((x) => x.id !== m.id)?.id);
                    }}
                  >
                    Excluir
                  </Btn>
                }
              >
                <div className="grade-4">
                  <Campo rotulo="TÍTULO" largo>
                    <Txt value={m.titulo} onChange={(v) => set((x) => void (x.titulo = v))} />
                  </Campo>
                  <Campo rotulo="CÓD. DO DOCUMENTO">
                    <Txt value={m.codigo} onChange={(v) => set((x) => void (x.codigo = v))} />
                  </Campo>
                  <Campo rotulo="VERSÃO">
                    <Txt value={m.versao} onChange={(v) => set((x) => void (x.versao = v))} />
                  </Campo>
                  <Campo rotulo="REVISÃO">
                    <Txt value={m.revisao} onChange={(v) => set((x) => void (x.revisao = v))} />
                  </Campo>
                </div>
                <Campo rotulo="RESULTADO (OBJETIVO)" largo>
                  <Txt multiline rows={2} value={m.objetivo} onChange={(v) => set((x) => void (x.objetivo = v))} />
                </Campo>
              </Card>

              <Card titulo="SIPOC">
                <div className="sipoc">
                  {SIPOC.map((c) => (
                    <div key={c.chave} className="sipoc-col">
                      <div className="sipoc-head">
                        {c.s && <b>{c.s}</b>}
                        <span>{c.rotulo}</span>
                      </div>
                      <Txt
                        multiline
                        rows={8}
                        placeholder="Um item por linha"
                        value={m[c.chave] as string}
                        onChange={(v) => set((x) => void ((x as unknown as Record<string, string>)[c.chave] = v))}
                        ariaLabel={c.rotulo}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card titulo="FLUXOGRAMA DO PROCESSO">
                <div className="grade-2 fluxo-grade">
                  <div>
                    {m.fluxo.map((e, i) => (
                      <div key={e.id} className="fluxo-edit">
                        <span className="lista-num">{i + 1}</span>
                        <Sel value={e.tipo} opcoes={TIPOS} onChange={(v) => set((x) => void (x.fluxo[i].tipo = v))} ariaLabel="Tipo de etapa" />
                        <Txt value={e.descricao} placeholder="Descrição" onChange={(v) => set((x) => void (x.fluxo[i].descricao = v))} />
                        <Txt value={e.responsavel} placeholder="Responsável" onChange={(v) => set((x) => void (x.fluxo[i].responsavel = v))} />
                        <div className="mover">
                          <button disabled={i === 0} aria-label="Subir" onClick={() => set((x) => void x.fluxo.splice(i - 1, 0, x.fluxo.splice(i, 1)[0]))}>
                            ↑
                          </button>
                          <button disabled={i === m.fluxo.length - 1} aria-label="Descer" onClick={() => set((x) => void x.fluxo.splice(i + 1, 0, x.fluxo.splice(i, 1)[0]))}>
                            ↓
                          </button>
                        </div>
                        <Remover onClick={() => set((x) => void x.fluxo.splice(i, 1))} />
                      </div>
                    ))}
                    <Btn variante="fantasma" onClick={() => set((x) => void x.fluxo.splice(Math.max(0, x.fluxo.length - 1), 0, { id: uid(), tipo: 'atividade', descricao: '', responsavel: '' }))}>
                      + Etapa
                    </Btn>
                  </div>
                  <div className="fluxo">
                    {m.fluxo.map((e, i) => (
                      <div key={e.id} className="fluxo-item">
                        <div className={`fluxo-no fluxo-${e.tipo}`}>
                          <span>{e.descricao || TIPOS.find((t) => t.valor === e.tipo)?.rotulo}</span>
                          {e.responsavel && <small>{e.responsavel}</small>}
                        </div>
                        {i < m.fluxo.length - 1 && <div className="fluxo-seta" aria-hidden />}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="dica">Legenda: ◯ início/fim · ▭ atividade · ◇ decisão</p>
              </Card>

              <div className="grade-2">
                <TabelaIndicadores titulo="INDICADORES DE RESULTADO" itens={m.indicadoresResultado} set={(fn) => set((x) => fn(x.indicadoresResultado))} />
                <TabelaIndicadores titulo="INDICADORES DE PROCESSO" itens={m.indicadoresProcesso} set={(fn) => set((x) => fn(x.indicadoresProcesso))} />
              </div>

              <Card
                titulo="HISTÓRICO DAS VERSÕES"
                acoes={
                  <Btn onClick={() => set((x) => void x.historico.push({ id: uid(), versao: `${x.historico.length}.0`, descricao: '', data: '', responsavel: '', proximaRevisao: '' }))}>
                    + Versão
                  </Btn>
                }
              >
                <div className="tabela-scroll">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>VERSÃO</th>
                        <th>DESCRIÇÃO DA ALTERAÇÃO</th>
                        <th style={{ width: 150 }}>DATA</th>
                        <th style={{ width: 200 }}>RESPONSÁVEL/FUNÇÃO</th>
                        <th style={{ width: 150 }}>PRÓXIMA REVISÃO</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.historico.map((h, i) => (
                        <tr key={h.id}>
                          <td>
                            <Txt value={h.versao} onChange={(v) => set((x) => void (x.historico[i].versao = v))} ariaLabel="Versão" />
                          </td>
                          <td>
                            <Txt multiline rows={2} value={h.descricao} onChange={(v) => set((x) => void (x.historico[i].descricao = v))} ariaLabel="Descrição" />
                          </td>
                          <td>
                            <Txt type="date" value={h.data} onChange={(v) => set((x) => void (x.historico[i].data = v))} ariaLabel="Data" />
                          </td>
                          <td>
                            <Txt value={h.responsavel} onChange={(v) => set((x) => void (x.historico[i].responsavel = v))} ariaLabel="Responsável" />
                          </td>
                          <td>
                            <Txt type="date" value={h.proximaRevisao} onChange={(v) => set((x) => void (x.historico[i].proximaRevisao = v))} ariaLabel="Próxima revisão" />
                          </td>
                          <td>
                            <Remover onClick={() => set((x) => void x.historico.splice(i, 1))} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Campo rotulo="VALIDAÇÃO" largo>
                  <Txt value={m.validacao} onChange={(v) => set((x) => void (x.validacao = v))} />
                </Campo>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function TabelaIndicadores({ titulo, itens, set }: { titulo: string; itens: IndicadorModelagem[]; set: (fn: (l: IndicadorModelagem[]) => void) => void }) {
  return (
    <Card titulo={titulo} acoes={<Btn onClick={() => set((l) => void l.push({ id: uid(), indicador: '', meta: '', responsavel: '' }))}>+ Indicador</Btn>}>
      {!itens.length ? (
        <Vazio>Nenhum indicador.</Vazio>
      ) : (
        <table className="tabela compacta">
          <thead>
            <tr>
              <th>INDICADOR</th>
              <th style={{ width: 110 }}>META</th>
              <th style={{ width: 150 }}>RESPONSÁVEL</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it, i) => (
              <tr key={it.id}>
                <td>
                  <Txt value={it.indicador} onChange={(v) => set((l) => void (l[i].indicador = v))} ariaLabel="Indicador" />
                </td>
                <td>
                  <Txt value={it.meta} onChange={(v) => set((l) => void (l[i].meta = v))} ariaLabel="Meta" />
                </td>
                <td>
                  <Txt value={it.responsavel} onChange={(v) => set((l) => void (l[i].responsavel = v))} ariaLabel="Responsável" />
                </td>
                <td>
                  <Remover onClick={() => set((l) => void l.splice(i, 1))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

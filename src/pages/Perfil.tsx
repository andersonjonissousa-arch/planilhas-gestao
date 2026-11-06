import { GraficoBarras } from '../components/charts';
import { Btn, Card, Num, PageHeader, Remover, Txt } from '../components/ui';
import { fmtNum, fmtPct, soma } from '../lib/calc';
import { novaTabelaDistribuicao, novaTabelaMensal, uid } from '../seed';
import { useSetor } from '../store';
import { ANOS, MESES } from '../types';

export default function Perfil() {
  const { setor, updS } = useSetor();
  const p = setor.perfil;

  return (
    <>
      <PageHeader
        numero="2"
        titulo="Perfil"
        descricao="Perfil epidemiológico (processos assistenciais) ou perfil de demanda (processos de apoio). Os gráficos são gerados automaticamente a partir de cada tabela."
      >
        <Btn onClick={() => updS((d) => void d.perfil.tabelasMensais.push(novaTabelaMensal(`<INDICADOR ${d.perfil.tabelasMensais.length + 1}>`)))}>+ Tabela mensal</Btn>
        <Btn onClick={() => updS((d) => void d.perfil.tabelasDistribuicao.push(novaTabelaDistribuicao(`<INDICADOR ${d.perfil.tabelasDistribuicao.length + 1}>`)))}>
          + Tabela de distribuição
        </Btn>
      </PageHeader>

      <Card titulo="Tipo de perfil">
        <Txt value={p.tipo} onChange={(v) => updS((d) => void (d.perfil.tipo = v))} ariaLabel="Tipo de perfil" />
      </Card>

      {p.tabelasMensais.map((t, ti) => {
        const totaisMes = MESES.map((_, m) => soma(t.criterios.map((c) => c.valores[m])));
        const set = (fn: (tab: typeof t) => void) => updS((d) => fn(d.perfil.tabelasMensais[ti]));
        return (
          <Card
            key={t.id}
            titulo={<Txt className="titulo-inline" value={t.titulo} onChange={(v) => set((x) => void (x.titulo = v))} ariaLabel="Título do indicador" />}
            acoes={
              <>
                <select className="inp" value={t.ano} aria-label="Ano" onChange={(e) => set((x) => void (x.ano = Number(e.target.value)))}>
                  {ANOS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
                <Remover rotulo="Remover tabela" onClick={() => confirm('Remover esta tabela?') && updS((d) => void d.perfil.tabelasMensais.splice(ti, 1))} />
              </>
            }
          >
            <div className="tabela-scroll">
              <table className="tabela compacta">
                <thead>
                  <tr>
                    <th>CRITÉRIO</th>
                    {MESES.map((m) => (
                      <th key={m}>{m}</th>
                    ))}
                    <th>TOTAL</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {t.criterios.map((c, ci) => (
                    <tr key={c.id}>
                      <td style={{ minWidth: 180 }}>
                        <Txt value={c.nome} onChange={(v) => set((x) => void (x.criterios[ci].nome = v))} ariaLabel="Critério" />
                      </td>
                      {MESES.map((m, mi) => (
                        <td key={m}>
                          <Num value={c.valores[mi]} onChange={(v) => set((x) => void (x.criterios[ci].valores[mi] = v))} ariaLabel={`${c.nome} ${m}`} />
                        </td>
                      ))}
                      <td className="num total">{fmtNum(soma(c.valores))}</td>
                      <td>
                        <Remover onClick={() => set((x) => void x.criterios.splice(ci, 1))} />
                      </td>
                    </tr>
                  ))}
                  <tr className="linha-total">
                    <td>TOTAL</td>
                    {totaisMes.map((v, i) => (
                      <td key={i} className="num">
                        {fmtNum(v)}
                      </td>
                    ))}
                    <td className="num">{fmtNum(soma(totaisMes))}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Btn variante="fantasma" onClick={() => set((x) => void x.criterios.push({ id: uid(), nome: 'Critério', valores: Array(12).fill(null) }))}>
              + Critério
            </Btn>
            <GraficoBarras
              empilhado
              dados={MESES.map((m, mi) => ({ rotulo: m, ...Object.fromEntries(t.criterios.map((c) => [c.id, c.valores[mi] ?? 0])) }))}
              series={t.criterios.map((c) => ({ chave: c.id, nome: c.nome }))}
            />
          </Card>
        );
      })}

      {p.tabelasDistribuicao.map((t, ti) => {
        const total = soma(t.itens.map((i) => i.quantidade));
        const set = (fn: (tab: typeof t) => void) => updS((d) => fn(d.perfil.tabelasDistribuicao[ti]));
        return (
          <Card
            key={t.id}
            titulo={<Txt className="titulo-inline" value={t.titulo} onChange={(v) => set((x) => void (x.titulo = v))} ariaLabel="Título do indicador" />}
            acoes={<Remover rotulo="Remover tabela" onClick={() => confirm('Remover esta tabela?') && updS((d) => void d.perfil.tabelasDistribuicao.splice(ti, 1))} />}
          >
            <div className="grade-2">
              <div>
                <table className="tabela compacta">
                  <thead>
                    <tr>
                      <th>CRITÉRIO</th>
                      <th style={{ width: 110 }}>QUANTIDADE</th>
                      <th style={{ width: 80 }}>%</th>
                      <th style={{ width: 32 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.itens.map((it, ii) => (
                      <tr key={it.id}>
                        <td>
                          <Txt value={it.nome} onChange={(v) => set((x) => void (x.itens[ii].nome = v))} ariaLabel="Critério" />
                        </td>
                        <td>
                          <Num value={it.quantidade} onChange={(v) => set((x) => void (x.itens[ii].quantidade = v))} ariaLabel="Quantidade" />
                        </td>
                        <td className="num">{total ? fmtPct((it.quantidade ?? 0) / total) : '—'}</td>
                        <td>
                          <Remover onClick={() => set((x) => void x.itens.splice(ii, 1))} />
                        </td>
                      </tr>
                    ))}
                    <tr className="linha-total">
                      <td>TOTAL</td>
                      <td className="num">{fmtNum(total)}</td>
                      <td className="num">{total ? '100%' : '—'}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                <Btn variante="fantasma" onClick={() => set((x) => void x.itens.push({ id: uid(), nome: 'Critério', quantidade: null }))}>
                  + Critério
                </Btn>
              </div>
              <GraficoBarras horizontal altura={Math.max(160, t.itens.length * 34)} dados={t.itens.map((i) => ({ rotulo: i.nome, qtd: i.quantidade ?? 0 }))} series={[{ chave: 'qtd', nome: 'Quantidade' }]} />
            </div>
          </Card>
        );
      })}
      <p className="dica">Dica: não é preciso excluir linhas não usadas — critérios vazios não interferem no resultado.</p>
    </>
  );
}

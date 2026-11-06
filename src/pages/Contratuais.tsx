import { useState } from 'react';
import { FcaTable } from '../components/FcaTable';
import { GraficoBarras } from '../components/charts';
import { AnoTabs, Btn, Card, Campo, Kpi, ListaLateral, Num, PageHeader, Sel, Txt, useSelecao, Vazio } from '../components/ui';
import { chave, fmtPct, media, realizadoContratual, realizadoTrimestral } from '../lib/calc';
import { novoContratual } from '../seed';
import { useSetor } from '../store';
import { MESES, TRIMESTRES, type IndicadorContratual } from '../types';

const ANO_ATUAL = Math.min(2027, Math.max(2024, new Date().getFullYear()));

export default function Contratuais() {
  const { setor, updS } = useSetor();
  const { item: ind, idx, selId, setSelId } = useSelecao(setor.contratuais);
  const [ano, setAno] = useState(ANO_ATUAL);
  const set = (fn: (x: IndicadorContratual) => void) => updS((d) => fn(d.contratuais[idx]));

  return (
    <>
      <PageHeader titulo="Indicadores Contratuais" descricao="Resultado × meta mensal, % realizado mensal e trimestral e análise FCA.">
        <AnoTabs ano={ano} onChange={setAno} />
      </PageHeader>
      <div className="com-lista">
        <ListaLateral
          itens={setor.contratuais}
          selecionado={selId}
          onSelecionar={setSelId}
          rotulo={(i) => i.nome}
          onNovo={() => {
            const n = novoContratual();
            updS((d) => void d.contratuais.push(n));
            setSelId(n.id);
          }}
          textoNovo="+ Novo indicador"
        />
        <div className="conteudo-lista">
          {!ind ? (
            <Vazio>Nenhum indicador contratual.</Vazio>
          ) : (
            <Conteudo ind={ind} ano={ano} set={set} onExcluir={() => confirm(`Excluir "${ind.nome}"?`) && updS((d) => void d.contratuais.splice(idx, 1))} />
          )}
        </div>
      </div>
    </>
  );
}

function Conteudo({ ind, ano, set, onExcluir }: { ind: IndicadorContratual; ano: number; set: (fn: (x: IndicadorContratual) => void) => void; onExcluir: () => void }) {
  const mensal = MESES.map((_, m) => {
    const d = ind.dados[chave(ano, m + 1)];
    return d ? realizadoContratual(ind.polaridade, d.resultado, d.meta) : null;
  });
  const tri = TRIMESTRES.map((_, t) => realizadoTrimestral(ind, ano, t + 1));
  const setDado = (m: number, campo: 'resultado' | 'meta', v: number | null) =>
    set((x) => {
      const k = chave(ano, m);
      x.dados[k] = { ...(x.dados[k] ?? { resultado: null, meta: null }), [campo]: v };
    });
  const replicarMeta = () =>
    set((x) => {
      const primeira = MESES.map((_, m) => x.dados[chave(ano, m + 1)]?.meta).find((v) => v != null);
      if (primeira == null) return;
      for (let m = 1; m <= 12; m++) {
        const k = chave(ano, m);
        x.dados[k] = { ...(x.dados[k] ?? { resultado: null, meta: null }), meta: x.dados[k]?.meta ?? primeira };
      }
    });

  return (
    <>
      <Card titulo="INDICADORES CONTRATUAIS" acoes={<Btn variante="perigo" onClick={onExcluir}>Excluir</Btn>}>
        <div className="grade-3">
          <Campo rotulo="NOME DO INDICADOR">
            <Txt value={ind.nome} onChange={(v) => set((x) => void (x.nome = v))} />
          </Campo>
          <Campo rotulo="RESPONSÁVEL PELA META">
            <Txt value={ind.responsavel} onChange={(v) => set((x) => void (x.responsavel = v))} />
          </Campo>
          <Campo rotulo="REGRA DE CÁLCULO">
            <Sel
              value={ind.polaridade}
              onChange={(v) => set((x) => void (x.polaridade = v))}
              opcoes={[
                { valor: '▲', rotulo: '▲ Meta mínima (resultado ÷ meta)' },
                { valor: '▼', rotulo: '▼ Limite máximo (100% até a meta)' },
              ]}
            />
          </Campo>
        </div>
        <div className="kpis">
          {TRIMESTRES.map((t, i) => (
            <Kpi key={t} rotulo={`%Realizado ${t}`} valor={fmtPct(tri[i])} tom={tri[i] == null ? undefined : tri[i]! >= 1 ? 'ok' : 'ruim'} />
          ))}
          <Kpi rotulo={`Média ${ano}`} valor={fmtPct(media(mensal))} />
        </div>
      </Card>
      <div className="grade-2">
        <Card titulo={`Resultados ${ano}`} acoes={<Btn variante="fantasma" onClick={replicarMeta} title="Copia a primeira meta preenchida para os meses sem meta">Replicar meta</Btn>}>
          <table className="tabela compacta">
            <thead>
              <tr>
                <th>MÊS</th>
                <th>RESULTADOS</th>
                <th>META</th>
                <th>%REALIZADO MENSAL</th>
                <th>%REALIZADO TRIMESTRAL</th>
              </tr>
            </thead>
            <tbody>
              {MESES.map((m, i) => {
                const d = ind.dados[chave(ano, i + 1)];
                return (
                  <tr key={m}>
                    <td className="periodo">
                      {m}/{ano}
                    </td>
                    <td>
                      <Num value={d?.resultado} onChange={(v) => setDado(i + 1, 'resultado', v)} ariaLabel={`Resultado ${m}`} />
                    </td>
                    <td>
                      <Num value={d?.meta} onChange={(v) => setDado(i + 1, 'meta', v)} ariaLabel={`Meta ${m}`} />
                    </td>
                    <td className={`num ${mensal[i] == null ? '' : mensal[i]! >= 1 ? 'res-atingida' : 'res-nao-atingida'}`}>{fmtPct(mensal[i])}</td>
                    {i % 3 === 0 && (
                      <td rowSpan={3} className="num total">
                        {fmtPct(tri[i / 3])}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card titulo="% Realizado mensal">
          <GraficoBarras
            sufixo="%"
            altura={420}
            dados={MESES.map((m, i) => ({ rotulo: m, real: mensal[i] == null ? null : Math.round(mensal[i]! * 1000) / 10 }))}
            series={[{ chave: 'real', nome: '% realizado' }]}
          />
        </Card>
      </div>
      <FcaTable
        titulo={`Análise FCA ${ano}`}
        plano={ind.plano}
        setPlano={(fn) => set((x) => fn(x.plano))}
        ano={ano}
        rotuloPeriodo={(p) => `${MESES[p - 1]}/${ano}`}
        resultado={(p) => {
          const r = ind.dados[chave(ano, p)]?.resultado;
          return r == null ? '—' : String(r).replace('.', ',');
        }}
      />
    </>
  );
}

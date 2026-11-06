import { useState } from 'react';
import { AnoTabs, Btn, Card, Kpi, PageHeader, Remover, StatusPill, StatusSelect, Txt } from '../components/ui';
import { contarStatus, fmtPct, percConclusao } from '../lib/calc';
import { uid } from '../seed';
import { useSetor } from '../store';
import { MESES, STATUS, type AcaoGestao } from '../types';

const ANO_ATUAL = Math.min(2027, Math.max(2024, new Date().getFullYear()));

export default function PlanoGestao() {
  const { setor, updS } = useSetor();
  const [ano, setAno] = useState(ANO_ATUAL);
  const acoes = setor.planoGestao.acoes;
  const doAno = acoes.filter((a) => a.ano === ano);
  const cont = contarStatus(doAno.map((a) => a.status));
  const setA = (id: string, fn: (a: AcaoGestao) => void) =>
    updS((d) => {
      const a = d.planoGestao.acoes.find((x) => x.id === id);
      if (a) fn(a);
    });
  const nova = (mes: number) => updS((d) => void d.planoGestao.acoes.push({ id: uid(), ano, mes, acao: '', dataConclusao: '', responsavel: '', status: 'NÃO INICIADO' }));

  return (
    <>
      <PageHeader numero="12" titulo="Plano de Ações — Gestão" descricao="Ações de gestão do setor por mês, com data da efetiva conclusão e status.">
        <AnoTabs ano={ano} onChange={setAno} />
      </PageHeader>
      <div className="kpis">
        <Kpi rotulo={`Ações em ${ano}`} valor={doAno.length} />
        <Kpi rotulo="% concluídas" valor={fmtPct(percConclusao(doAno.map((a) => a.status)))} detalhe="exclui canceladas" />
        {STATUS.filter((s) => cont[s]).map((s) => (
          <Kpi key={s} rotulo={s} valor={cont[s]} />
        ))}
      </div>
      <Card titulo={`GESTÃO — ${ano}`}>
        <div className="tabela-scroll">
          <table className="tabela">
            <thead>
              <tr>
                <th style={{ width: 90 }}>MÊS / ANO</th>
                <th>AÇÕES — (O que faremos para melhorar?)</th>
                <th style={{ width: 150 }}>DATA DA EFETIVA CONCLUSÃO</th>
                <th style={{ width: 170 }}>RESPONSÁVEL</th>
                <th style={{ width: 150 }}>STATUS</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {MESES.map((m, mi) => {
                const doMes = doAno.filter((a) => a.mes === mi + 1);
                if (!doMes.length)
                  return (
                    <tr key={m} className="mes-vazio">
                      <td className="periodo">
                        {m}/{ano}
                      </td>
                      <td colSpan={4}>
                        <button className="link" onClick={() => nova(mi + 1)}>
                          + adicionar ação
                        </button>
                      </td>
                      <td></td>
                    </tr>
                  );
                return doMes.map((a, i) => (
                  <tr key={a.id}>
                    {i === 0 && (
                      <td rowSpan={doMes.length} className="periodo">
                        {m}/{ano}
                      </td>
                    )}
                    <td>
                      <Txt multiline rows={2} value={a.acao} onChange={(v) => setA(a.id, (x) => void (x.acao = v))} ariaLabel="Ação" />
                    </td>
                    <td>
                      <Txt type="date" value={a.dataConclusao} onChange={(v) => setA(a.id, (x) => void (x.dataConclusao = v))} ariaLabel="Data de conclusão" />
                    </td>
                    <td>
                      <Txt value={a.responsavel} onChange={(v) => setA(a.id, (x) => void (x.responsavel = v))} ariaLabel="Responsável" />
                    </td>
                    <td>
                      <StatusSelect value={a.status} onChange={(v) => setA(a.id, (x) => void (x.status = v))} />
                    </td>
                    <td className="acoes-linha">
                      {i === doMes.length - 1 && (
                        <button className="btn-mais" aria-label="Adicionar ação" onClick={() => nova(mi + 1)}>
                          +
                        </button>
                      )}
                      <Remover onClick={() => updS((d) => void (d.planoGestao.acoes = d.planoGestao.acoes.filter((x) => x.id !== a.id)))} />
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
        <label className="campo campo-largo" style={{ marginTop: 12 }}>
          <span>ANÁLISE ANUAL {ano}</span>
          <Txt multiline rows={3} value={setor.planoGestao.analises[ano] ?? ''} onChange={(v) => updS((d) => void (d.planoGestao.analises[ano] = v))} />
        </label>
      </Card>
      {doAno.some((a) => a.status !== 'CONCLUÍDO' && a.status !== 'CANCELADO') && (
        <Card titulo="Pendências do ano">
          <ul className="pendencias">
            {doAno
              .filter((a) => a.status !== 'CONCLUÍDO' && a.status !== 'CANCELADO')
              .map((a) => (
                <li key={a.id}>
                  <StatusPill status={a.status} /> <b>{MESES[a.mes - 1]}</b> — {a.acao || '(sem descrição)'} {a.responsavel && <small>· {a.responsavel}</small>}
                </li>
              ))}
          </ul>
        </Card>
      )}
      <p className="dica">
        <Btn variante="fantasma" onClick={() => nova(new Date().getMonth() + 1)}>
          + Ação no mês atual
        </Btn>
      </p>
    </>
  );
}

import { useState } from 'react';
import { FcaTable } from '../components/FcaTable';
import { GraficoBarras } from '../components/charts';
import { AnoTabs, Btn, Card, Num, PageHeader, Remover, Txt } from '../components/ui';
import { chave, conformidadeAnual, conformidadeGeralAno, conformidadeMes, fmtPct } from '../lib/calc';
import { novaInteracao } from '../seed';
import { useSetor } from '../store';
import { MESES, type Conformidade, type Interacao } from '../types';

const ANO_ATUAL = Math.min(2027, Math.max(2024, new Date().getFullYear()));

export default function Interacoes() {
  const { hospital, setor, updS } = useSetor();
  const [ano, setAno] = useState(ANO_ATUAL);
  const itens = setor.interacoes.itens;
  const set = (i: number, fn: (x: Interacao) => void) => updS((d) => fn(d.interacoes.itens[i]));
  const setMes = (i: number, mes: number, campo: 'notificacoes' | 'conformidade', v: number | null | Conformidade) =>
    set(i, (x) => {
      const k = chave(ano, mes);
      x.meses[k] = { ...(x.meses[k] ?? { notificacoes: null, conformidade: '' }), [campo]: v };
    });

  const percMes = MESES.map((_, m) => conformidadeMes(itens, ano, m + 1));
  const nomesSetores = hospital.setores.map((s) => s.nome);

  return (
    <>
      <PageHeader
        numero="10"
        titulo="Gerenciamento das Interações"
        descricao="Interações cliente–fornecedor entre processos/setores: nº de notificações e conformidade (C / N/C) mês a mês."
      >
        <AnoTabs ano={ano} onChange={setAno} />
      </PageHeader>
      <datalist id="setores-hospital">
        {nomesSetores.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <Card titulo={`GERENCIAMENTO DAS INTERAÇÕES DE PROCESSOS — ${ano}`} acoes={<Btn onClick={() => updS((d) => void d.interacoes.itens.push(novaInteracao()))}>+ Interação</Btn>}>
        <div className="tabela-scroll">
          <table className="tabela compacta interacoes">
            <thead>
              <tr>
                <th rowSpan={2}>Nº</th>
                <th rowSpan={2}>ELABORAÇÃO</th>
                <th rowSpan={2}>REVISADO EM</th>
                <th rowSpan={2}>VERSÃO</th>
                <th rowSpan={2}>PRÓX. REVISÃO</th>
                <th rowSpan={2}>FORNECEDOR</th>
                <th rowSpan={2}>CLIENTE</th>
                <th rowSpan={2}>PROCESSO</th>
                {MESES.map((m) => (
                  <th key={m} colSpan={2}>
                    {m}
                  </th>
                ))}
                <th rowSpan={2}>ANUAL</th>
                <th rowSpan={2}></th>
              </tr>
              <tr>
                {MESES.map((m) => [
                  <th key={m + 'n'} title="Nº de notificações">
                    Nº
                  </th>,
                  <th key={m + 'c'}>C/NC</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {itens.map((it, i) => (
                <tr key={it.id}>
                  <td className="num">{i + 1}</td>
                  <td>
                    <Txt type="date" value={it.dataElaboracao} onChange={(v) => set(i, (x) => void (x.dataElaboracao = v))} ariaLabel="Data de elaboração" />
                  </td>
                  <td>
                    <Txt type="date" value={it.revisadoEm} onChange={(v) => set(i, (x) => void (x.revisadoEm = v))} ariaLabel="Revisado em" />
                  </td>
                  <td>
                    <Txt value={it.versao} onChange={(v) => set(i, (x) => void (x.versao = v))} ariaLabel="Versão" className="curto" />
                  </td>
                  <td>
                    <Txt type="date" value={it.proximaRevisao} onChange={(v) => set(i, (x) => void (x.proximaRevisao = v))} ariaLabel="Próxima revisão" />
                  </td>
                  <td>
                    <InputLista value={it.fornecedor} onChange={(v) => set(i, (x) => void (x.fornecedor = v))} rotulo="Fornecedor" />
                  </td>
                  <td>
                    <InputLista value={it.cliente} onChange={(v) => set(i, (x) => void (x.cliente = v))} rotulo="Cliente" />
                  </td>
                  <td>
                    <Txt value={it.processo} onChange={(v) => set(i, (x) => void (x.processo = v))} ariaLabel="Processo" />
                  </td>
                  {MESES.map((m, mi) => {
                    const v = it.meses[chave(ano, mi + 1)];
                    return [
                      <td key={m + 'n'}>
                        <Num value={v?.notificacoes} onChange={(n) => setMes(i, mi + 1, 'notificacoes', n)} ariaLabel={`Notificações ${m}`} className="curto" />
                      </td>,
                      <td key={m + 'c'}>
                        <select
                          className={`inp conf conf-${v?.conformidade || 'vazio'}`}
                          value={v?.conformidade ?? ''}
                          aria-label={`Conformidade ${m}`}
                          onChange={(e) => setMes(i, mi + 1, 'conformidade', e.target.value as Conformidade)}
                        >
                          <option value="">—</option>
                          <option value="C">C</option>
                          <option value="NC">N/C</option>
                        </select>
                      </td>,
                    ];
                  })}
                  <td className="num total">{fmtPct(conformidadeAnual(it, ano))}</td>
                  <td>
                    <Remover onClick={() => confirm('Remover interação?') && updS((d) => void d.interacoes.itens.splice(i, 1))} />
                  </td>
                </tr>
              ))}
              <tr className="linha-total">
                <td colSpan={8}>% DE CONFORMIDADE DA INTERAÇÃO</td>
                {percMes.map((p, i) => (
                  <td key={i} colSpan={2} className="num">
                    {fmtPct(p, 0)}
                  </td>
                ))}
                <td className="num">
                  {fmtPct(conformidadeGeralAno(itens, ano))}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="dica">LEGENDA: C — CONFORME · N/C — NÃO CONFORME. O % mensal considera apenas interações avaliadas no mês.</p>
        <GraficoBarras
          sufixo="%"
          dados={MESES.map((m, i) => ({ rotulo: m, conf: percMes[i] == null ? null : Math.round(percMes[i]! * 1000) / 10 }))}
          series={[{ chave: 'conf', nome: '% conformidade' }]}
          altura={220}
        />
      </Card>

      <FcaTable
        plano={setor.interacoes.plano}
        setPlano={(fn) => updS((d) => fn(d.interacoes.plano))}
        ano={ano}
        rotuloPeriodo={(p) => `${MESES[p - 1]}/${ano}`}
        resultado={(p) => fmtPct(percMes[p - 1], 0)}
      />
    </>
  );
}

function InputLista({ value, onChange, rotulo }: { value: string; onChange: (v: string) => void; rotulo: string }) {
  return (
    <input
      className="inp"
      list="setores-hospital"
      defaultValue={value}
      key={value}
      aria-label={rotulo}
      onBlur={(e) => e.target.value !== value && onChange(e.target.value)}
    />
  );
}

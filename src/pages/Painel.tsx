import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraficoBarras } from '../components/charts';
import { AnoTabs, Card, Kpi, PageHeader, Vazio } from '../components/ui';
import { plural } from '../lib/calc';
import { fmtPct } from '../lib/calc';
import { resumoSetor } from '../lib/resumo';
import { useHospital, useStore } from '../store';

const ANO_ATUAL = Math.min(2027, Math.max(2024, new Date().getFullYear()));

export default function Painel() {
  const { data, selecionar } = useStore();
  const { hospital } = useHospital();
  const navigate = useNavigate();
  const [ano, setAno] = useState(ANO_ATUAL);
  const resumos = hospital.setores.map((s) => resumoSetor(hospital, s, ano));
  const tot = resumos.reduce(
    (a, r) => ({
      ind: a.ind + r.indicadores,
      ok: a.ok + r.naMeta,
      fora: a.fora + r.foraMeta,
      pend: a.pend + r.acoesPendentes,
      atr: a.atr + r.acoesAtrasadas,
      inc: a.inc + r.incidentesAno,
    }),
    { ind: 0, ok: 0, fora: 0, pend: 0, atr: 0, inc: 0 },
  );
  const incidentesHospital = hospital.notificacoes.filter((n) => n.dataOcorrencia && new Date(n.dataOcorrencia).getFullYear() === ano).length;
  const abrir = (setorId: string, rota: string) => {
    selecionar({ hospitalId: hospital.id, setorId });
    navigate(rota);
  };

  return (
    <>
      <PageHeader titulo={`Painel — ${hospital.sigla}`} descricao={`${hospital.nome}. Consolidado das planilhas de gestão de todos os setores.`}>
        <AnoTabs ano={ano} onChange={setAno} />
      </PageHeader>

      <div className="kpis">
        <Kpi rotulo="Setores" valor={hospital.setores.length} />
        <Kpi rotulo="Indicadores na meta" valor={`${tot.ok}/${tot.ind}`} detalhe={tot.fora ? `${tot.fora} fora da meta` : 'último período de cada indicador'} tom={tot.fora ? 'ruim' : tot.ok ? 'ok' : undefined} />
        <Kpi rotulo="Ações pendentes" valor={tot.pend} detalhe={tot.atr ? `${tot.atr} com prazo vencido` : 'nenhuma atrasada'} tom={tot.atr ? 'ruim' : undefined} />
        <Kpi rotulo={`Incidentes notificados ${ano}`} valor={incidentesHospital} detalhe={`${tot.inc} vinculados a setores cadastrados`} />
        <Kpi rotulo="Objetivos estratégicos" valor={new Set(hospital.estrategia.painel.map((p) => p.objetivo)).size} detalhe={`${hospital.estrategia.painel.length} indicadores no painel`} />
      </div>

      <Card titulo="Setores">
        {!resumos.length ? (
          <Vazio>Nenhum setor cadastrado. Cadastre em “Hospitais e setores”.</Vazio>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela compacta clicavel">
              <thead>
                <tr>
                  <th>SETOR</th>
                  <th>INDICADORES</th>
                  <th>NA META</th>
                  <th>FORA DA META</th>
                  <th>AÇÕES PENDENTES</th>
                  <th>ATRASADAS</th>
                  <th>PLANO GESTÃO {ano}</th>
                  <th>PLANO AI</th>
                  <th>INCIDENTES {ano}</th>
                  <th>MAIOR NPR</th>
                </tr>
              </thead>
              <tbody>
                {resumos.map((r) => (
                  <tr key={r.setor.id} onClick={() => abrir(r.setor.id, '/indicadores')} title="Abrir indicadores do setor">
                    <td>
                      <b>{r.setor.nome}</b>
                      <small className="tipo-setor">{r.setor.tipo}</small>
                    </td>
                    <td className="num">{r.indicadores}</td>
                    <td className="num res-atingida">{r.naMeta || ''}</td>
                    <td className="num res-nao-atingida">{r.foraMeta || ''}</td>
                    <td className="num">{r.acoesPendentes || ''}</td>
                    <td className={`num ${r.acoesAtrasadas ? 'vencida' : ''}`}>{r.acoesAtrasadas || ''}</td>
                    <td className="num">{fmtPct(r.percConclusaoGestao, 0)}</td>
                    <td className="num">{fmtPct(r.percConclusaoAI, 0)}</td>
                    <td className="num">{r.incidentesAno || ''}</td>
                    <td className="num">{r.maiorNpr || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {resumos.length > 1 && (
        <Card titulo="Indicadores por setor (último período)">
          <GraficoBarras
            empilhado
            altura={Math.max(180, resumos.length * 36)}
            horizontal
            dados={resumos.map((r) => ({ rotulo: r.setor.nome, ok: r.naMeta, fora: r.foraMeta, sem: r.semAvaliacao }))}
            series={[
              { chave: 'ok', nome: 'Na meta', cor: '#2e9d6a' },
              { chave: 'fora', nome: 'Fora da meta', cor: '#c4425a' },
              { chave: 'sem', nome: 'Sem avaliação', cor: '#b8c4d1' },
            ]}
          />
        </Card>
      )}

      {data.hospitais.length > 1 && (
        <Card titulo="Rede — hospitais cadastrados">
          <div className="hospitais-cards">
            {data.hospitais.map((h) => (
              <button key={h.id} className={`hosp-card ${h.id === hospital.id ? 'ativo' : ''}`} onClick={() => selecionar({ hospitalId: h.id })}>
                <b>{h.sigla}</b>
                <span>{h.nome}</span>
                <small>
                  {plural(h.setores.length, 'setor', 'setores')} · {plural(h.setores.reduce((a, s) => a + s.indicadores.length, 0), 'indicador', 'indicadores')} · {plural(h.notificacoes.length, 'notificação', 'notificações')}
                </small>
              </button>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

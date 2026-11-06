import { useState } from 'react';
import { FcaTable } from '../components/FcaTable';
import { GraficoBarras } from '../components/charts';
import { AnoTabs, Card, Campo, Kpi, PageHeader, Txt } from '../components/ui';
import { useSetor } from '../store';
import { ANOS, MESES } from '../types';

const ANO_ATUAL = Math.min(2027, Math.max(2024, new Date().getFullYear()));
const mesmo = (a: string, b: string) => a.trim().toUpperCase() === b.trim().toUpperCase();

export default function GerenciamentoIncidentes() {
  const { hospital, setor, updS } = useSetor();
  const [ano, setAno] = useState(ANO_ATUAL);
  const gi = setor.gerenciamentoIncidentes;
  const doSetor = hospital.notificacoes.filter((n) => mesmo(n.setorNotificado, setor.nome) && n.dataOcorrencia);
  const contagem = (a: number) => MESES.map((_, m) => doSetor.filter((n) => new Date(n.dataOcorrencia).getFullYear() === a && new Date(n.dataOcorrencia).getMonth() === m).length);
  const atual = contagem(ano);
  const anterior = ANOS.includes(ano - 1 as (typeof ANOS)[number]) ? contagem(ano - 1) : null;
  const total = atual.reduce((a, b) => a + b, 0);
  const afetaram = doSetor.filter((n) => new Date(n.dataOcorrencia).getFullYear() === ano && n.afetouPaciente === 'SIM').length;

  return (
    <>
      <PageHeader
        numero="9"
        titulo="Gerenciamento de Incidentes"
        descricao={`Incidentes de segurança do paciente notificados para o setor ${setor.nome} (interfaces entre comissões) e plano de ação.`}
      >
        <AnoTabs ano={ano} onChange={setAno} />
      </PageHeader>

      <Card titulo={`Nº DE INCIDENTES DE SEGURANÇA POR MÊS (${ano}) — ${setor.nome}`}>
        <div className="grade-2">
          <Campo rotulo="META">
            <Txt value={gi.meta} placeholder="<Acrescentar meta>" onChange={(v) => updS((d) => void (d.gerenciamentoIncidentes.meta = v))} />
          </Campo>
          <Campo rotulo="RESPONSÁVEL PELA META">
            <Txt value={gi.responsavel} onChange={(v) => updS((d) => void (d.gerenciamentoIncidentes.responsavel = v))} />
          </Campo>
        </div>
        <div className="kpis">
          <Kpi rotulo={`Incidentes em ${ano}`} valor={total} />
          <Kpi rotulo="Afetaram o paciente" valor={afetaram} tom={afetaram ? 'ruim' : undefined} />
          {anterior && <Kpi rotulo={`Em ${ano - 1}`} valor={anterior.reduce((a, b) => a + b, 0)} />}
        </div>
        <GraficoBarras
          dados={MESES.map((m, i) => ({ rotulo: m, atual: atual[i], ...(anterior ? { anterior: anterior[i] } : {}) }))}
          series={[...(anterior ? [{ chave: 'anterior', nome: String(ano - 1), cor: '#b8c4d1' }] : []), { chave: 'atual', nome: String(ano) }]}
        />
        {!doSetor.length && (
          <p className="dica">
            Nenhuma notificação com "SETOR NOTIFICADO" = <b>{setor.nome}</b>. Os dados vêm da aba Notificações de Incidentes do hospital.
          </p>
        )}
      </Card>

      <FcaTable
        plano={gi.plano}
        setPlano={(fn) => updS((d) => fn(d.gerenciamentoIncidentes.plano))}
        ano={ano}
        rotuloPeriodo={(p) => `${MESES[p - 1]}/${ano}`}
        resultado={(p) => String(atual[p - 1])}
      />
    </>
  );
}

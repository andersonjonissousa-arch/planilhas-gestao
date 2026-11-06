import { useMemo, useRef, useState } from 'react';
import { GraficoBarras } from '../components/charts';
import { Btn, Card, Campo, Kpi, PageHeader, Remover, Sel, Txt, Vazio } from '../components/ui';
import { novaNotificacao } from '../seed';
import { useHospital } from '../store';
import { MESES, type Notificacao } from '../types';

const anoDe = (n: Notificacao) => (n.dataOcorrencia ? new Date(n.dataOcorrencia).getFullYear() : null);
const mesDe = (n: Notificacao) => (n.dataOcorrencia ? new Date(n.dataOcorrencia).getMonth() : null);
const fmtData = (s: string) => (s ? new Date(s.includes('T') ? s : s + 'T00:00').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: s.includes('T') ? 'short' : undefined }) : '—');

function contar<T>(itens: T[], f: (t: T) => string) {
  const m = new Map<string, number>();
  for (const i of itens) {
    const k = f(i) || '(não informado)';
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export default function Notificacoes() {
  const { hospital, updH } = useHospital();
  const todas = hospital.notificacoes;
  const anos = [...new Set(todas.map(anoDe).filter((a): a is number => a != null))].sort();
  const [ano, setAno] = useState<string>('');
  const [setor, setSetor] = useState('');
  const [busca, setBusca] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const arquivo = useRef<HTMLInputElement>(null);

  const filtradas = useMemo(
    () =>
      todas.filter(
        (n) =>
          (!ano || String(anoDe(n)) === ano) &&
          (!setor || n.setorNotificado === setor) &&
          (!busca || `${n.codigo} ${n.descricao} ${n.natureza} ${n.tipoClassificacao} ${n.localOcorrencia}`.toLowerCase().includes(busca.toLowerCase())),
      ),
    [todas, ano, setor, busca],
  );
  const setores = [...new Set([...hospital.setores.map((s) => s.nome), ...todas.map((n) => n.setorNotificado).filter(Boolean)])].sort();
  const editIdx = todas.findIndex((n) => n.id === editId);
  const edit = todas[editIdx];
  const setN = (fn: (n: Notificacao) => void) => updH((h) => fn(h.notificacoes[editIdx]));

  const porMes = MESES.map((m, i) => ({ rotulo: m, qtd: filtradas.filter((n) => mesDe(n) === i).length }));
  const porSetor = contar(filtradas, (n) => n.setorNotificado).slice(0, 10);
  const porNatureza = contar(filtradas, (n) => n.natureza).slice(0, 8);
  const afetou = filtradas.filter((n) => n.afetouPaciente === 'SIM').length;
  const visiveis = filtradas.slice().sort((a, b) => (b.dataOcorrencia || '').localeCompare(a.dataOcorrencia || '')).slice(0, 300);

  const importar = async (f: File) => {
    try {
      const { importarNotificacoes } = await import('../lib/excel');
      const { notificacoes, ignoradas } = await importarNotificacoes(f);
      const existentes = new Set(todas.map((n) => n.codigo).filter(Boolean));
      const novas = notificacoes.filter((n) => !n.codigo || !existentes.has(n.codigo));
      updH((h) => void h.notificacoes.push(...novas));
      setMsg(`${novas.length} notificações importadas${notificacoes.length - novas.length ? `, ${notificacoes.length - novas.length} já existiam (mesmo código)` : ''}${ignoradas ? `, ${ignoradas} linhas ignoradas` : ''}.`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        numero="8"
        titulo="Notificações de Incidentes"
        descricao={`Registro institucional de notificações de incidentes de segurança do paciente — ${hospital.sigla}. Cada setor acompanha as suas em "Gerenciamento de Incidentes".`}
      >
        <input ref={arquivo} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => e.target.files?.[0] && importar(e.target.files[0]).finally(() => (e.target.value = ''))} />
        <Btn onClick={() => arquivo.current?.click()} title="Importa planilha com as colunas da aba NOTIFICAÇÕES DE INCIDENTES">
          Importar Excel/CSV
        </Btn>
        <Btn onClick={() => import('../lib/excel').then((m) => m.exportarNotificacoesXlsx(hospital))}>Exportar</Btn>
        <Btn
          variante="pri"
          onClick={() => {
            const n = novaNotificacao();
            if (setor) n.setorNotificado = setor;
            updH((h) => void h.notificacoes.push(n));
            setEditId(n.id);
          }}
        >
          + Nova notificação
        </Btn>
      </PageHeader>
      {msg && (
        <div className="aviso" role="status">
          {msg} <button onClick={() => setMsg('')}>×</button>
        </div>
      )}

      <div className="filtros">
        <Campo rotulo="Ano">
          <Sel value={ano} onChange={setAno} opcoes={[{ valor: '', rotulo: 'Todos' }, ...anos.map((a) => ({ valor: String(a), rotulo: String(a) }))]} />
        </Campo>
        <Campo rotulo="Setor notificado">
          <Sel value={setor} onChange={setSetor} opcoes={[{ valor: '', rotulo: 'Todos' }, ...setores.map((s) => ({ valor: s, rotulo: s }))]} />
        </Campo>
        <Campo rotulo="Buscar">
          <input className="inp" value={busca} placeholder="Código, descrição, natureza..." onChange={(e) => setBusca(e.target.value)} />
        </Campo>
      </div>

      <div className="kpis">
        <Kpi rotulo="Notificações" valor={filtradas.length} detalhe={ano ? `em ${ano}` : 'todo o período'} />
        <Kpi rotulo="Afetaram o paciente" valor={afetou} detalhe={filtradas.length ? `${Math.round((afetou / filtradas.length) * 100)}% do total` : ''} tom={afetou ? 'ruim' : undefined} />
        <Kpi rotulo="Concluídas" valor={filtradas.filter((n) => n.dataConclusao).length} detalhe="com data de conclusão" />
        <Kpi rotulo="Setores envolvidos" valor={new Set(filtradas.map((n) => n.setorNotificado).filter(Boolean)).size} />
      </div>

      {editIdx >= 0 && edit && (
        <Card titulo={`Notificação ${edit.codigo || '(sem código)'}`} acoes={<Btn onClick={() => setEditId(null)}>Fechar</Btn>} className="card-destaque">
          <div className="grade-4">
            <Campo rotulo="CÓDIGO">
              <Txt value={edit.codigo} onChange={(v) => setN((n) => void (n.codigo = v))} />
            </Campo>
            <Campo rotulo="DATA DA OCORRÊNCIA/HORA">
              <Txt type="datetime-local" value={edit.dataOcorrencia} onChange={(v) => setN((n) => void (n.dataOcorrencia = v))} />
            </Campo>
            <Campo rotulo="SETOR NOTIFICADO">
              <input className="inp" list="setores-notif" defaultValue={edit.setorNotificado} key={edit.id + edit.setorNotificado} onBlur={(e) => setN((n) => void (n.setorNotificado = e.target.value))} />
            </Campo>
            <Campo rotulo="LOCAL OCORRÊNCIA">
              <input className="inp" list="setores-notif" defaultValue={edit.localOcorrencia} key={edit.id + edit.localOcorrencia} onBlur={(e) => setN((n) => void (n.localOcorrencia = e.target.value))} />
            </Campo>
            <Campo rotulo="TIPO CLASSIFICAÇÃO">
              <Txt value={edit.tipoClassificacao} onChange={(v) => setN((n) => void (n.tipoClassificacao = v))} />
            </Campo>
            <Campo rotulo="COD. INTERAÇÃO">
              <Txt value={edit.codInteracao} onChange={(v) => setN((n) => void (n.codInteracao = v))} />
            </Campo>
            <Campo rotulo="NATUREZA">
              <Txt value={edit.natureza} onChange={(v) => setN((n) => void (n.natureza = v))} />
            </Campo>
            <Campo rotulo="AFETOU PACIENTE">
              <Sel value={edit.afetouPaciente} opcoes={['', 'SIM', 'NÃO'] as const} onChange={(v) => setN((n) => void (n.afetouPaciente = v))} />
            </Campo>
            <Campo rotulo="PRONTUÁRIO">
              <Txt value={edit.prontuario} onChange={(v) => setN((n) => void (n.prontuario = v))} />
            </Campo>
            <Campo rotulo="STATUS">
              <Txt value={edit.status} onChange={(v) => setN((n) => void (n.status = v))} />
            </Campo>
            <Campo rotulo="DAT. CLASSIFICAÇÃO">
              <Txt type="date" value={edit.dataClassificacao} onChange={(v) => setN((n) => void (n.dataClassificacao = v))} />
            </Campo>
            <Campo rotulo="STATUS RESPOSTA">
              <Txt value={edit.statusResposta} onChange={(v) => setN((n) => void (n.statusResposta = v))} />
            </Campo>
            <Campo rotulo="DAT. RESPOSTA">
              <Txt type="date" value={edit.dataResposta} onChange={(v) => setN((n) => void (n.dataResposta = v))} />
            </Campo>
            <Campo rotulo="DAT. CONCLUSÃO">
              <Txt type="date" value={edit.dataConclusao} onChange={(v) => setN((n) => void (n.dataConclusao = v))} />
            </Campo>
          </div>
          <div className="grade-3">
            <Campo rotulo="DESCRIÇÃO">
              <Txt multiline rows={4} value={edit.descricao} onChange={(v) => setN((n) => void (n.descricao = v))} />
            </Campo>
            <Campo rotulo="CAUSA">
              <Txt multiline rows={4} value={edit.causa} onChange={(v) => setN((n) => void (n.causa = v))} />
            </Campo>
            <Campo rotulo="OBSERVAÇÃO">
              <Txt multiline rows={4} value={edit.observacao} onChange={(v) => setN((n) => void (n.observacao = v))} />
            </Campo>
          </div>
        </Card>
      )}
      <datalist id="setores-notif">
        {setores.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {filtradas.length > 0 && (
        <div className="grade-2">
          <Card titulo="Notificações por mês">
            <GraficoBarras dados={porMes} series={[{ chave: 'qtd', nome: 'Notificações' }]} altura={220} />
          </Card>
          <Card titulo="Por setor notificado (top 10)">
            <GraficoBarras horizontal altura={Math.max(160, porSetor.length * 28)} dados={porSetor.map(([rotulo, qtd]) => ({ rotulo, qtd }))} series={[{ chave: 'qtd', nome: 'Notificações' }]} />
          </Card>
        </div>
      )}
      {porNatureza.length > 0 && filtradas.length > 0 && (
        <Card titulo="Por natureza">
          <GraficoBarras horizontal altura={Math.max(140, porNatureza.length * 28)} dados={porNatureza.map(([rotulo, qtd]) => ({ rotulo, qtd }))} series={[{ chave: 'qtd', nome: 'Notificações', cor: '#e07b39' }]} />
        </Card>
      )}

      <Card titulo={`Registros (${filtradas.length}${filtradas.length > visiveis.length ? `, exibindo os ${visiveis.length} mais recentes` : ''})`}>
        {!visiveis.length ? (
          <Vazio>Nenhuma notificação. Cadastre uma nova ou importe a planilha do sistema de notificações.</Vazio>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela compacta clicavel">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>DATA/HORA</th>
                  <th>SETOR NOTIFICADO</th>
                  <th>LOCAL</th>
                  <th>CLASSIFICAÇÃO</th>
                  <th>NATUREZA</th>
                  <th>AFETOU PAC.</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((n) => (
                  <tr key={n.id} onClick={() => setEditId(n.id)} className={n.id === editId ? 'selecionada' : ''}>
                    <td>{n.codigo || '—'}</td>
                    <td>{fmtData(n.dataOcorrencia)}</td>
                    <td>{n.setorNotificado}</td>
                    <td>{n.localOcorrencia}</td>
                    <td>{n.tipoClassificacao}</td>
                    <td>{n.natureza}</td>
                    <td>{n.afetouPaciente}</td>
                    <td>{n.status}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Remover onClick={() => confirm('Excluir notificação?') && updH((h) => void (h.notificacoes = h.notificacoes.filter((x) => x.id !== n.id)))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

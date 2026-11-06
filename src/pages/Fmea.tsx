import { Link } from 'react-router-dom';
import { Btn, Card, Campo, ListaLateral, PageHeader, Remover, Txt, useSelecao, Vazio } from '../components/ui';
import { nprFinal, nprInicial } from '../lib/calc';
import { GOD, novaLinhaFmea, novoFmea } from '../seed';
import { useSetor } from '../store';
import type { Fmea as TFmea, LinhaFmea } from '../types';

type CampoNota = 'g' | 'o' | 'd' | 'g2' | 'o2' | 'd2';

function Nota({ value, onChange, tipo, rotulo }: { value: number | null; onChange: (v: number | null) => void; tipo: 'g' | 'o' | 'd'; rotulo: string }) {
  const tabela = tipo === 'g' ? GOD.gravidade : tipo === 'o' ? GOD.ocorrencia : GOD.deteccao;
  const desc = value ? tabela.find((t) => t.indice === value)?.criterio : undefined;
  return (
    <select className="inp nota" value={value ?? ''} title={desc} aria-label={rotulo} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">—</option>
      {tabela.map((t) => (
        <option key={t.indice} value={t.indice} title={t.criterio}>
          {t.indice}
        </option>
      ))}
    </select>
  );
}

/** Destaca a(s) linha(s) de maior NPR da análise — prioridade de ação. */
const classeNpr = (n: number, max: number) => (n > 0 && n === max ? 'npr-alto' : '');

export default function Fmea() {
  const { setor, updS } = useSetor();
  const { item: f, idx, selId, setSelId } = useSelecao(setor.fmeas);
  const set = (fn: (x: TFmea) => void) => updS((d) => fn(d.fmeas[idx]));
  const setL = (i: number, fn: (l: LinhaFmea) => void) => set((x) => fn(x.linhas[i]));
  const maxNpr = f ? Math.max(0, ...f.linhas.map(nprInicial)) : 0;

  return (
    <>
      <PageHeader
        titulo="Gerenciamento de Risco — FMEA"
        descricao={
          <>
            Análise de modos de falha e efeitos. NPR = Gravidade × Ocorrência × Detecção (1–10 cada). Critérios na <Link to="/god">tabela G.O.D</Link>.
          </>
        }
      />
      <div className="com-lista">
        <ListaLateral
          itens={setor.fmeas}
          selecionado={selId}
          onSelecionar={setSelId}
          rotulo={(x) => x.processo}
          onNovo={() => {
            const n = novoFmea();
            updS((d) => void d.fmeas.push(n));
            setSelId(n.id);
          }}
          textoNovo="+ Nova FMEA"
        />
        <div className="conteudo-lista">
          {!f ? (
            <Vazio>Nenhuma FMEA cadastrada.</Vazio>
          ) : (
            <>
              <Card titulo="GERENCIAMENTO DE RISCO - FMEA" acoes={<Btn variante="perigo" onClick={() => confirm(`Excluir a FMEA "${f.processo}"?`) && updS((d) => void d.fmeas.splice(idx, 1))}>Excluir</Btn>}>
                <div className="grade-5">
                  <Campo rotulo="Nome do processo">
                    <Txt value={f.processo} onChange={(v) => set((x) => void (x.processo = v))} />
                  </Campo>
                  <Campo rotulo="Equipe FMEA">
                    <Txt value={f.equipe} onChange={(v) => set((x) => void (x.equipe = v))} />
                  </Campo>
                  <Campo rotulo="Data">
                    <Txt type="date" value={f.data} onChange={(v) => set((x) => void (x.data = v))} />
                  </Campo>
                  <Campo rotulo="Revisão">
                    <Txt value={f.revisao} onChange={(v) => set((x) => void (x.revisao = v))} />
                  </Campo>
                  <Campo rotulo="Responsável">
                    <Txt value={f.responsavel} onChange={(v) => set((x) => void (x.responsavel = v))} />
                  </Campo>
                </div>
              </Card>
              <Card titulo="Análise" acoes={<Btn onClick={() => set((x) => void x.linhas.push(novaLinhaFmea()))}>+ Linha</Btn>}>
                <div className="tabela-scroll">
                  <table className="tabela compacta fmea">
                    <thead>
                      <tr>
                        <th title="Qual é a etapa do processo?">Etapa do Processo</th>
                        <th title="O que pode dar errado?">Modo de Falha</th>
                        <th title="Quais seriam as consequências e impactos dessa falha?">Efeito de Falha</th>
                        <th className="th-nota">G</th>
                        <th title="Por que a falha aconteceria?">Causas</th>
                        <th className="th-nota">O</th>
                        <th title="Quais controles existem que impedem ou detectam a falha?">Controles Atuais</th>
                        <th className="th-nota">D</th>
                        <th className="th-npr">NPR</th>
                        <th title="Ações para reduzir a ocorrência da causa ou melhorar a detecção">Ações Recomendadas</th>
                        <th>Responsável / Prazo</th>
                        <th>Ações Tomadas</th>
                        <th className="th-nota">G</th>
                        <th className="th-nota">O</th>
                        <th className="th-nota">D</th>
                        <th className="th-npr">NPR</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.linhas.map((l, i) => {
                        const n1 = nprInicial(l);
                        const n2 = nprFinal(l);
                        const txt = (campo: keyof LinhaFmea, rotulo: string) => (
                          <td>
                            <Txt multiline rows={2} value={l[campo] as string} onChange={(v) => setL(i, (x) => void ((x as unknown as Record<string, string>)[campo] = v))} ariaLabel={rotulo} />
                          </td>
                        );
                        const nota = (campo: CampoNota, tipo: 'g' | 'o' | 'd', rotulo: string) => (
                          <td>
                            <Nota value={l[campo]} tipo={tipo} rotulo={rotulo} onChange={(v) => setL(i, (x) => void (x[campo] = v))} />
                          </td>
                        );
                        return (
                          <tr key={l.id}>
                            {txt('etapa', 'Etapa')}
                            {txt('modoFalha', 'Modo de falha')}
                            {txt('efeito', 'Efeito')}
                            {nota('g', 'g', 'Gravidade')}
                            {txt('causas', 'Causas')}
                            {nota('o', 'o', 'Ocorrência')}
                            {txt('controles', 'Controles atuais')}
                            {nota('d', 'd', 'Detecção')}
                            <td className={`num npr ${classeNpr(n1, maxNpr)}`}>{n1 || ''}</td>
                            {txt('acoesRecomendadas', 'Ações recomendadas')}
                            {txt('responsavelPrazo', 'Responsável/Prazo')}
                            {txt('acoesTomadas', 'Ações tomadas')}
                            {nota('g2', 'g', 'Gravidade após ações')}
                            {nota('o2', 'o', 'Ocorrência após ações')}
                            {nota('d2', 'd', 'Detecção após ações')}
                            <td className="num npr">
                              {n2 || ''}
                              {n1 > 0 && n2 > 0 && <small className={n2 < n1 ? 'reducao' : 'aumento'}>{n2 < n1 ? `−${Math.round((1 - n2 / n1) * 100)}%` : n2 > n1 ? '↑' : '='}</small>}
                            </td>
                            <td>
                              <Remover onClick={() => set((x) => void x.linhas.splice(i, 1))} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="dica">Passe o mouse sobre a nota para ver o critério. As linhas com maior NPR devem ser priorizadas nas ações recomendadas.</p>
              </Card>
              {f.linhas.some((l) => nprInicial(l) > 0) && (
                <Card titulo="Priorização por NPR">
                  <ol className="ranking">
                    {[...f.linhas]
                      .filter((l) => nprInicial(l) > 0)
                      .sort((a, b) => nprInicial(b) - nprInicial(a))
                      .slice(0, 10)
                      .map((l) => (
                        <li key={l.id}>
                          <b>{nprInicial(l)}</b> — {l.etapa || '(etapa)'} · {l.modoFalha || '(modo de falha)'}
                          {nprFinal(l) > 0 && <small> → após ações: {nprFinal(l)}</small>}
                        </li>
                      ))}
                  </ol>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

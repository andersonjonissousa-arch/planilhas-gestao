import { useState } from 'react';
import { Btn, Card, Campo, PageHeader, Remover, Txt } from '../components/ui';
import { PERSPECTIVAS, uid } from '../seed';
import { useHospital } from '../store';
import { ANOS } from '../types';

const COR_PERSPECTIVA: Record<string, string> = {
  'Resultado para Sociedade': 'persp-azul',
  Governança: 'persp-laranja',
  'Desenvolvimento Institucional e Processos': 'persp-verde',
  'Sustentabilidade Econômico-Financeira': 'persp-amarelo',
  'Aprendizado, Crescimento e Inovação': 'persp-vermelho',
};

export default function Estrategia() {
  const { hospital, updH } = useHospital();
  const e = hospital.estrategia;
  const [aba, setAba] = useState<'mapa' | 'painel'>('mapa');

  const perspectivas = [...new Set([...PERSPECTIVAS, ...e.painel.map((l) => l.perspectiva)])].filter(Boolean);
  const objetivosPor = (p: string) => [...new Set(e.painel.filter((l) => l.perspectiva === p).map((l) => l.objetivo))].filter(Boolean);

  return (
    <>
      <PageHeader numero="3" titulo="Estratégia 2024-2027" descricao="Direcionadores da estratégia (missão, visão, valores e propósito), mapa estratégico e painel estratégico." />

      <Card titulo="Direcionadores da estratégia">
        <div className="grade-2">
          <Campo rotulo="MISSÃO">
            <Txt multiline value={e.missao} onChange={(v) => updH((d) => void (d.estrategia.missao = v))} />
          </Campo>
          <Campo rotulo="VISÃO">
            <Txt multiline value={e.visao} onChange={(v) => updH((d) => void (d.estrategia.visao = v))} />
          </Campo>
          <Campo rotulo="VALORES">
            <Txt multiline value={e.valores} onChange={(v) => updH((d) => void (d.estrategia.valores = v))} />
          </Campo>
          <Campo rotulo="PROPÓSITO INSTITUCIONAL">
            <Txt multiline value={e.proposito} onChange={(v) => updH((d) => void (d.estrategia.proposito = v))} />
          </Campo>
        </div>
      </Card>

      <div className="tabs" role="tablist">
        <button className={aba === 'mapa' ? 'tab ativo' : 'tab'} onClick={() => setAba('mapa')}>
          Mapa estratégico
        </button>
        <button className={aba === 'painel' ? 'tab ativo' : 'tab'} onClick={() => setAba('painel')}>
          Painel estratégico
        </button>
      </div>

      {aba === 'mapa' ? (
        <Card titulo="MAPA ESTRATÉGICO (2024-2027)">
          <div className="mapa">
            <div className="mapa-topo">
              <div>
                <b>MISSÃO</b>
                <p>{e.missao}</p>
              </div>
              <div>
                <b>VISÃO</b>
                <p>{e.visao}</p>
              </div>
              <div>
                <b>VALORES</b>
                <p>{e.valores}</p>
              </div>
            </div>
            {perspectivas.map((p) => (
              <div key={p} className={`mapa-persp ${COR_PERSPECTIVA[p] ?? 'persp-cinza'}`}>
                <h3>{p}</h3>
                <div className="mapa-objs">
                  {objetivosPor(p).map((o) => (
                    <div key={o} className="mapa-obj">
                      {o}
                    </div>
                  ))}
                  {!objetivosPor(p).length && <div className="mapa-obj vazio-obj">Sem objetivos cadastrados</div>}
                </div>
              </div>
            ))}
          </div>
          <p className="dica">O mapa é montado automaticamente a partir das perspectivas e objetivos do painel estratégico.</p>
        </Card>
      ) : (
        <Card
          titulo="PAINEL ESTRATÉGICO"
          acoes={
            <Btn
              onClick={() =>
                updH((d) =>
                  void d.estrategia.painel.push({ id: uid(), perspectiva: PERSPECTIVAS[0], objetivo: '', indicador: '', metas: {}, responsavel: '' }),
                )
              }
            >
              + Linha
            </Btn>
          }
        >
          <datalist id="perspectivas">
            {perspectivas.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <div className="tabela-scroll">
            <table className="tabela">
              <thead>
                <tr>
                  <th style={{ minWidth: 150 }}>PERSPECTIVA</th>
                  <th style={{ minWidth: 220 }}>OBJETIVO ESTRATÉGICO</th>
                  <th style={{ minWidth: 200 }}>INDICADOR ESTRATÉGICO</th>
                  {ANOS.map((a) => (
                    <th key={a} style={{ minWidth: 100 }}>
                      META {a}
                    </th>
                  ))}
                  <th style={{ minWidth: 170 }}>RESPONSÁVEL-DIRETORIA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {e.painel.map((l, i) => {
                  const set = (fn: (x: typeof l) => void) => updH((d) => fn(d.estrategia.painel[i]));
                  return (
                    <tr key={l.id} className={COR_PERSPECTIVA[l.perspectiva] ? 'linha-' + COR_PERSPECTIVA[l.perspectiva] : ''}>
                      <td>
                        <input
                          className="inp"
                          list="perspectivas"
                          defaultValue={l.perspectiva}
                          aria-label="Perspectiva"
                          onBlur={(ev) => ev.target.value !== l.perspectiva && set((x) => void (x.perspectiva = ev.target.value))}
                        />
                      </td>
                      <td>
                        <Txt multiline rows={2} value={l.objetivo} onChange={(v) => set((x) => void (x.objetivo = v))} ariaLabel="Objetivo" />
                      </td>
                      <td>
                        <Txt multiline rows={2} value={l.indicador} onChange={(v) => set((x) => void (x.indicador = v))} ariaLabel="Indicador" />
                      </td>
                      {ANOS.map((a) => (
                        <td key={a}>
                          <Txt value={l.metas[a] ?? ''} onChange={(v) => set((x) => void (x.metas[a] = v))} ariaLabel={`Meta ${a}`} />
                        </td>
                      ))}
                      <td>
                        <Txt multiline rows={2} value={l.responsavel} onChange={(v) => set((x) => void (x.responsavel = v))} ariaLabel="Responsável" />
                      </td>
                      <td>
                        <Remover onClick={() => confirm('Remover linha do painel?') && updH((d) => void d.estrategia.painel.splice(i, 1))} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

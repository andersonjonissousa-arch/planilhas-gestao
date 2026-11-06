import { novaFca } from '../seed';
import type { FcaRow, PlanoFca } from '../types';
import { Card, Remover, StatusSelect, Txt } from './ui';

type CampoFca = 'fato' | 'causa' | 'acao' | 'prazo' | 'responsavel' | 'status';

/**
 * Plano de ação com análise FCA (Fato – Causa – Ação) por período de um ano,
 * seguido da ANÁLISE ANUAL — estrutura repetida em várias abas da planilha.
 */
export function FcaTable({
  plano,
  setPlano,
  ano,
  periodos = 12,
  rotuloPeriodo,
  resultado,
  titulo,
}: {
  plano: PlanoFca;
  setPlano: (fn: (p: PlanoFca) => void) => void;
  ano: number;
  periodos?: number;
  rotuloPeriodo: (p: number) => string;
  resultado?: (p: number) => string;
  titulo?: string;
}) {
  const alterar = (linha: FcaRow | null, periodo: number, campo: CampoFca, valor: string) =>
    setPlano((p) => {
      let alvo = linha ? p.linhas.find((l) => l.id === linha.id) : undefined;
      if (!alvo) {
        alvo = novaFca(ano, periodo);
        p.linhas.push(alvo);
      }
      (alvo as unknown as Record<string, string>)[campo] = valor;
    });

  const adicionar = (periodo: number) => setPlano((p) => void p.linhas.push(novaFca(ano, periodo)));
  const remover = (id: string) => setPlano((p) => void (p.linhas = p.linhas.filter((l) => l.id !== id)));

  return (
    <Card titulo={titulo ?? `PLANO DE AÇÃO ${ano}`}>
      <div className="tabela-scroll">
        <table className="tabela fca">
          <thead>
            <tr>
              <th style={{ width: 80 }}>PERÍODO</th>
              {resultado && <th style={{ width: 90 }}>RESULTADO</th>}
              <th>FATO (O que aconteceu?)</th>
              <th>CAUSA (O que levou o fato a acontecer?)</th>
              <th>AÇÕES (O que faremos para melhorar?)</th>
              <th style={{ width: 130 }}>PRAZO</th>
              <th style={{ width: 150 }}>RESPONSÁVEL</th>
              <th style={{ width: 140 }}>STATUS</th>
              <th style={{ width: 56 }}></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: periodos }, (_, i) => i + 1).map((periodo) => {
              const linhas = plano.linhas.filter((l) => l.ano === ano && l.periodo === periodo);
              const exibir: (FcaRow | null)[] = linhas.length ? linhas : [null];
              return exibir.map((l, idx) => (
                <tr key={l?.id ?? `v-${periodo}`} className={idx > 0 ? 'sub' : ''}>
                  {idx === 0 && (
                    <td rowSpan={exibir.length} className="periodo">
                      {rotuloPeriodo(periodo)}
                    </td>
                  )}
                  {resultado && idx === 0 && (
                    <td rowSpan={exibir.length} className="num">
                      {resultado(periodo)}
                    </td>
                  )}
                  <td>
                    <Txt multiline rows={2} value={l?.fato ?? ''} onChange={(v) => alterar(l, periodo, 'fato', v)} ariaLabel="Fato" />
                  </td>
                  <td>
                    <Txt multiline rows={2} value={l?.causa ?? ''} onChange={(v) => alterar(l, periodo, 'causa', v)} ariaLabel="Causa" />
                  </td>
                  <td>
                    <Txt multiline rows={2} value={l?.acao ?? ''} onChange={(v) => alterar(l, periodo, 'acao', v)} ariaLabel="Ação" />
                  </td>
                  <td>
                    <Txt type="date" value={l?.prazo ?? ''} onChange={(v) => alterar(l, periodo, 'prazo', v)} ariaLabel="Prazo" />
                  </td>
                  <td>
                    <Txt value={l?.responsavel ?? ''} onChange={(v) => alterar(l, periodo, 'responsavel', v)} ariaLabel="Responsável" />
                  </td>
                  <td>
                    <StatusSelect value={l?.status ?? ''} onChange={(v) => alterar(l, periodo, 'status', v)} />
                  </td>
                  <td className="acoes-linha">
                    {idx === exibir.length - 1 && (
                      <button className="btn-mais" title="Adicionar outra ação neste período" aria-label="Adicionar ação" onClick={() => adicionar(periodo)}>
                        +
                      </button>
                    )}
                    {l && <Remover onClick={() => remover(l.id)} />}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
      <label className="campo campo-largo" style={{ marginTop: 12 }}>
        <span>ANÁLISE ANUAL {ano}</span>
        <Txt
          multiline
          rows={3}
          value={plano.analises[String(ano)] ?? ''}
          onChange={(v) => setPlano((p) => void (p.analises[String(ano)] = v))}
          ariaLabel={`Análise anual ${ano}`}
        />
      </label>
    </Card>
  );
}

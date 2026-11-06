import { useState } from 'react';
import { Card, PageHeader, Vazio } from '../components/ui';
import { ROTULO_TIPO } from '../lib/calc';
import { useSetor } from '../store';
import { FichaTecnica } from './Indicadores';

const hoje = () => new Date().toISOString().slice(0, 10);
const fmt = (d: string) => (d ? new Date(d + 'T00:00').toLocaleDateString('pt-BR') : '—');

export default function FichasTecnicas() {
  const { setor, updS } = useSetor();
  const [aberta, setAberta] = useState<string | null>(null);
  const idx = setor.indicadores.findIndex((i) => i.id === aberta);

  return (
    <>
      <PageHeader titulo="Fichas Técnicas dos Indicadores" descricao="Controle documental das fichas técnicas do setor: elaboração, revisão, versão e próxima revisão." />
      <Card>
        {!setor.indicadores.length ? (
          <Vazio>Nenhum indicador cadastrado.</Vazio>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela compacta clicavel">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>DATA DE ELABORAÇÃO</th>
                  <th>REVISADO EM</th>
                  <th>VERSÃO</th>
                  <th>PRÓXIMA REVISÃO</th>
                  <th>NOME DA FICHA TÉCNICA</th>
                  <th>TIPO</th>
                  <th>POLARIDADE</th>
                </tr>
              </thead>
              <tbody>
                {setor.indicadores.map((i, n) => {
                  const vencida = i.proximaRevisao && i.proximaRevisao < hoje();
                  return (
                    <tr key={i.id} onClick={() => setAberta(aberta === i.id ? null : i.id)} className={aberta === i.id ? 'selecionada' : ''}>
                      <td className="num">{n + 1}</td>
                      <td>{fmt(i.dataElaboracao)}</td>
                      <td>{fmt(i.revisadoEm)}</td>
                      <td>{i.versao}</td>
                      <td className={vencida ? 'vencida' : ''}>
                        {fmt(i.proximaRevisao)}
                        {vencida && ' · revisão vencida'}
                      </td>
                      <td>{i.nome}</td>
                      <td>{ROTULO_TIPO[i.tipoCalculo].split(' (')[0]}</td>
                      <td>{i.polaridade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="dica">Clique em uma linha para abrir e editar a ficha técnica.</p>
      </Card>
      {idx >= 0 && <FichaTecnica ind={setor.indicadores[idx]} set={(fn) => updS((d) => fn(d.indicadores[idx]))} />}
    </>
  );
}

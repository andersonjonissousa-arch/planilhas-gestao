import { useState } from 'react';
import { Btn, Card, Campo, PageHeader, Remover, Sel, Txt } from '../components/ui';
import { plural } from '../lib/calc';
import { novoHospital, novoPlano, novoSetor, uid } from '../seed';
import { useHospitalOpcional, useStore } from '../store';
import type { Setor } from '../types';
import { TIPOS_SETOR } from './Introducao';

/** Novo setor que reaproveita as fichas técnicas dos indicadores de um setor modelo (sem dados). */
function setorAPartirDe(modelo: Setor, nome: string): Setor {
  const s = novoSetor(nome, modelo.tipo);
  s.indicadores = modelo.indicadores.map((i) => ({ ...structuredClone(i), id: uid(), dados: {}, plano: novoPlano() }));
  s.contratuais = modelo.contratuais.map((c) => ({ ...structuredClone(c), id: uid(), dados: {}, plano: novoPlano() }));
  return s;
}

export default function Hospitais() {
  const { data, update, selecionar } = useStore();
  const { hospital } = useHospitalOpcional();
  const [novoNome, setNovoNome] = useState('');
  const [modeloId, setModeloId] = useState('');
  const hIdx = data.hospitais.findIndex((h) => h.id === hospital?.id);

  const adicionarSetor = () => {
    if (!hospital) return;
    const nome = novoNome.trim().toUpperCase() || 'NOVO SETOR';
    const modelo = hospital.setores.find((s) => s.id === modeloId);
    const s = modelo ? setorAPartirDe(modelo, nome) : novoSetor(nome);
    update((d) => void d.hospitais[hIdx].setores.push(s));
    setNovoNome('');
  };

  const faltantes = hospital
    ? [...hospital.mapeamento.finalisticos, ...hospital.mapeamento.apoio].filter((p) => p && !hospital.setores.some((s) => s.nome.trim().toUpperCase() === p.trim().toUpperCase()))
    : [];

  return (
    <>
      <PageHeader titulo="Hospitais e setores" descricao="Cada hospital (ex.: HRVJ, HWGA) tem estratégia, macroprocesso e notificações próprios; cada setor tem a sua planilha de gestão.">
        <Btn
          variante="pri"
          onClick={() => {
            const h = novoHospital();
            update((d) => void d.hospitais.push(h));
            selecionar({ hospitalId: h.id });
          }}
        >
          + Novo hospital
        </Btn>
      </PageHeader>

      <div className="hospitais-cards">
        {data.hospitais.map((h) => (
          <button key={h.id} className={`hosp-card ${h.id === hospital?.id ? 'ativo' : ''}`} onClick={() => selecionar({ hospitalId: h.id })}>
            <b>{h.sigla}</b>
            <span>{h.nome}</span>
            <small>{plural(h.setores.length, 'setor', 'setores')}</small>
          </button>
        ))}
      </div>

      {hospital && hIdx >= 0 && (
        <>
          <Card
            titulo={`Hospital ${hospital.sigla}`}
            acoes={
              <Btn
                variante="perigo"
                disabled={data.hospitais.length < 2}
                title={data.hospitais.length < 2 ? 'É preciso manter ao menos um hospital' : undefined}
                onClick={() => {
                  if (prompt(`Para excluir ${hospital.sigla} e TODOS os seus setores, digite a sigla:`) !== hospital.sigla) return;
                  update((d) => void d.hospitais.splice(hIdx, 1));
                  selecionar({});
                }}
              >
                Excluir hospital
              </Btn>
            }
          >
            <div className="grade-3">
              <Campo rotulo="SIGLA">
                <Txt value={hospital.sigla} onChange={(v) => update((d) => void (d.hospitais[hIdx].sigla = v.toUpperCase()))} />
              </Campo>
              <Campo rotulo="NOME">
                <Txt value={hospital.nome} onChange={(v) => update((d) => void (d.hospitais[hIdx].nome = v))} />
              </Campo>
              <Campo rotulo="CIDADE / UF">
                <Txt value={hospital.cidade} onChange={(v) => update((d) => void (d.hospitais[hIdx].cidade = v))} />
              </Campo>
            </div>
          </Card>

          <Card titulo={`Setores do ${hospital.sigla} (${hospital.setores.length})`}>
            <div className="novo-setor">
              <Campo rotulo="NOME DO NOVO SETOR">
                <input className="inp" value={novoNome} placeholder="ex.: UTI ADULTO" onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && adicionarSetor()} />
              </Campo>
              <Campo rotulo="MODELO (opcional)">
                <Sel
                  value={modeloId}
                  onChange={setModeloId}
                  opcoes={[{ valor: '', rotulo: 'Setor em branco' }, ...hospital.setores.map((s) => ({ valor: s.id, rotulo: `Copiar fichas de: ${s.nome}` }))]}
                />
              </Campo>
              <Btn variante="pri" onClick={adicionarSetor}>
                Adicionar setor
              </Btn>
            </div>
            {faltantes.length > 0 && (
              <p className="dica">
                {faltantes.length} processo(s) do macroprocesso ainda sem setor.{' '}
                <button
                  className="link"
                  onClick={() =>
                    update((d) => {
                      const h = d.hospitais[hIdx];
                      for (const p of faltantes) h.setores.push(novoSetor(p.toUpperCase(), h.mapeamento.apoio.includes(p) ? 'apoio' : 'assistencial'));
                    })
                  }
                >
                  Criar setores a partir do macroprocesso
                </button>
              </p>
            )}
            <table className="tabela compacta">
              <thead>
                <tr>
                  <th>SETOR</th>
                  <th style={{ width: 260 }}>TIPO</th>
                  <th style={{ width: 120 }}>INDICADORES</th>
                  <th style={{ width: 120 }}></th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {hospital.setores.map((s, si) => (
                  <tr key={s.id}>
                    <td>
                      <Txt value={s.nome} onChange={(v) => update((d) => void (d.hospitais[hIdx].setores[si].nome = v))} ariaLabel="Nome do setor" />
                    </td>
                    <td>
                      <Sel value={s.tipo} opcoes={TIPOS_SETOR} onChange={(v) => update((d) => void (d.hospitais[hIdx].setores[si].tipo = v))} ariaLabel="Tipo" />
                    </td>
                    <td className="num">{s.indicadores.length}</td>
                    <td>
                      <Btn variante="fantasma" onClick={() => selecionar({ hospitalId: hospital.id, setorId: s.id })}>
                        Selecionar
                      </Btn>
                    </td>
                    <td>
                      <Remover
                        rotulo="Excluir setor"
                        onClick={() => confirm(`Excluir o setor ${s.nome} e toda a sua planilha?`) && update((d) => void d.hospitais[hIdx].setores.splice(si, 1))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}

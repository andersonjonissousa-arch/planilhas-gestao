import { Card, Campo, ListaTexto, PageHeader, Sel, Txt } from '../components/ui';
import { useSetor } from '../store';
import type { TipoSetor } from '../types';

export const TIPOS_SETOR: { valor: TipoSetor; rotulo: string }[] = [
  { valor: 'assistencial', rotulo: 'Assistencial (processo finalístico)' },
  { valor: 'apoio', rotulo: 'Apoio' },
  { valor: 'gerencial', rotulo: 'Gerencial' },
];

export default function Introducao() {
  const { hospital, setor, updS } = useSetor();
  const i = setor.introducao;
  return (
    <>
      <PageHeader numero="1" titulo="Introdução" descricao={`Identificação do setor, gestores e lideranças, e breve histórico do serviço — ${hospital.sigla}.`} />
      <Card titulo="Identificação">
        <div className="grade-3">
          <Campo rotulo="NOME DO SETOR">
            <Txt value={setor.nome} onChange={(v) => updS((d) => void (d.nome = v))} />
          </Campo>
          <Campo rotulo="TIPO DE SETOR">
            <Sel value={setor.tipo} opcoes={TIPOS_SETOR} onChange={(v) => updS((d) => void (d.tipo = v))} ariaLabel="Tipo de setor" />
          </Campo>
          <Campo rotulo="COORDENADOR">
            <Txt value={i.coordenador} onChange={(v) => updS((d) => void (d.introducao.coordenador = v))} />
          </Campo>
        </div>
      </Card>
      <Card titulo="Gestores e lideranças — Time de liderança">
        <ListaTexto numerada itens={i.lideranca} placeholder="Nome / função" onChange={(v) => updS((d) => void (d.introducao.lideranca = v))} />
      </Card>
      <Card titulo="Breve histórico do serviço">
        <Txt multiline rows={8} value={i.historico} onChange={(v) => updS((d) => void (d.introducao.historico = v))} ariaLabel="Histórico" />
      </Card>
    </>
  );
}

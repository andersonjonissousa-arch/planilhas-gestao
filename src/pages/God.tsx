import { Card, PageHeader } from '../components/ui';
import { GOD } from '../seed';

export default function God() {
  return (
    <>
      <PageHeader titulo="G.O.D — FMEA" descricao="Critérios de Gravidade, Ocorrência e Detecção para pontuação da FMEA." />
      <div className="grade-3 god">
        <Card titulo="GRAVIDADE do efeito">
          <table className="tabela compacta">
            <thead>
              <tr>
                <th>Efeito</th>
                <th>Critério</th>
                <th>Índice</th>
              </tr>
            </thead>
            <tbody>
              {GOD.gravidade.map((g) => (
                <tr key={g.indice}>
                  <td>{g.efeito}</td>
                  <td>{g.criterio}</td>
                  <td className="num total">{g.indice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card titulo="OCORRÊNCIA da causa">
          <table className="tabela compacta">
            <thead>
              <tr>
                <th>Probabilidade</th>
                <th>Critério</th>
                <th>Taxa</th>
                <th>Índice</th>
              </tr>
            </thead>
            <tbody>
              {GOD.ocorrencia.map((g) => (
                <tr key={g.indice}>
                  <td>{g.probabilidade}</td>
                  <td>{g.criterio}</td>
                  <td>{g.taxa}</td>
                  <td className="num total">{g.indice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card titulo="DETECÇÃO da falha">
          <table className="tabela compacta">
            <thead>
              <tr>
                <th>Efeito</th>
                <th>Critério</th>
                <th>Taxa</th>
                <th>Índice</th>
              </tr>
            </thead>
            <tbody>
              {GOD.deteccao.map((g) => (
                <tr key={g.indice}>
                  <td>{g.efeito}</td>
                  <td>{g.criterio}</td>
                  <td>{g.taxa}</td>
                  <td className="num total">{g.indice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <p className="dica">Referência: {GOD.referencia}</p>
    </>
  );
}

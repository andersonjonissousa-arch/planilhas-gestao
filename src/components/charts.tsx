import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtNum } from '../lib/calc';

export const CORES = ['#1d6fb8', '#e07b39', '#2e9d6a', '#8a5cc2', '#c4425a', '#5b6b7c'];

type Ponto = Record<string, string | number | null>;

const tooltipFmt = (v: unknown) => (typeof v === 'number' ? fmtNum(v) : String(v ?? '—'));

/** Série histórica: uma linha por ano + linha de meta. */
export function GraficoSerie({
  dados,
  series,
  meta,
  altura = 280,
  sufixo = '',
}: {
  dados: Ponto[];
  series: { chave: string; nome: string; destaque?: boolean }[];
  meta?: number | null;
  altura?: number;
  sufixo?: string;
}) {
  return (
    <div className="grafico" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e6ebf1" vertical={false} />
          <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: '#5b6b7c' }} axisLine={{ stroke: '#cdd6e0' }} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#5b6b7c' }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => fmtNum(v, 1) + sufixo} />
          <Tooltip formatter={(v) => tooltipFmt(v) + sufixo} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {meta != null && <ReferenceLine y={meta} stroke="#c4425a" strokeDasharray="6 4" label={{ value: `Meta ${fmtNum(meta)}${sufixo}`, position: 'insideTopRight', fill: '#c4425a', fontSize: 12 }} />}
          {series.map((s, i) => (
            <Line
              key={s.chave}
              type="monotone"
              dataKey={s.chave}
              name={s.nome}
              stroke={CORES[i % CORES.length]}
              strokeWidth={s.destaque ? 3 : 2}
              strokeOpacity={s.destaque ? 1 : 0.55}
              dot={{ r: s.destaque ? 4 : 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoBarras({
  dados,
  series,
  altura = 260,
  empilhado,
  sufixo = '',
  horizontal,
}: {
  dados: Ponto[];
  series: { chave: string; nome: string; cor?: string }[];
  altura?: number;
  empilhado?: boolean;
  sufixo?: string;
  horizontal?: boolean;
}) {
  return (
    <div className="grafico" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 12, right: 24, left: horizontal ? 24 : 0, bottom: 0 }}>
          <CartesianGrid stroke="#e6ebf1" vertical={!!horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12, fill: '#5b6b7c' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="rotulo" width={200} tick={{ fontSize: 11, fill: '#5b6b7c' }} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: '#5b6b7c' }} axisLine={{ stroke: '#cdd6e0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5b6b7c' }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => fmtNum(v, 1) + sufixo} />
            </>
          )}
          <Tooltip formatter={(v) => tooltipFmt(v) + sufixo} cursor={{ fill: 'rgba(29,111,184,0.06)' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Bar
              key={s.chave}
              dataKey={s.chave}
              name={s.nome}
              fill={s.cor ?? CORES[i % CORES.length]}
              stackId={empilhado ? 'a' : undefined}
              radius={empilhado ? 0 : [4, 4, 0, 0]}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { ANOS, STATUS, type Status } from '../types';

export function PageHeader({ numero, titulo, descricao, children }: { numero?: string; titulo: string; descricao?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {numero && <span className="page-num">{numero}</span>}
        <h1>{titulo}</h1>
        {descricao && <p className="page-desc">{descricao}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function Card({ titulo, acoes, children, className = '' }: { titulo?: ReactNode; acoes?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(titulo || acoes) && (
        <div className="card-head">
          {titulo && <h2>{titulo}</h2>}
          {acoes && <div className="card-actions">{acoes}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Campo de texto que confirma a edição ao sair do campo (evita regravar tudo a cada tecla). */
export function Txt({
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
  className = '',
  type = 'text',
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  type?: 'text' | 'date' | 'datetime-local';
  ariaLabel?: string;
}) {
  const [local, setLocal] = useState(value ?? '');
  useEffect(() => setLocal(value ?? ''), [value]);
  const commit = () => {
    if (local !== value) onChange(local);
  };
  if (multiline)
    return (
      <textarea
        className={`inp ${className}`}
        value={local}
        rows={rows}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
      />
    );
  return (
    <input
      className={`inp ${className}`}
      type={type}
      value={local}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      onChange={(e) => {
        setLocal(e.target.value);
        if (type !== 'text') onChange(e.target.value);
      }}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

export function parseNum(s: string): number | null {
  const t = s.trim().replace(/\s/g, '');
  if (!t) return null;
  // aceita 1.234,56 ou 1234.56
  const norm = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

export function Num({
  value,
  onChange,
  placeholder,
  className = '',
  min,
  max,
  ariaLabel,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  ariaLabel?: string;
}) {
  const fmt = (v: number | null | undefined) => (v == null ? '' : String(v).replace('.', ','));
  const [local, setLocal] = useState(fmt(value));
  useEffect(() => setLocal(fmt(value)), [value]);
  const commit = () => {
    let n = parseNum(local);
    if (n != null && min != null) n = Math.max(min, n);
    if (n != null && max != null) n = Math.min(max, n);
    if (n !== (value ?? null)) onChange(n);
    else setLocal(fmt(value));
  };
  return (
    <input
      className={`inp num ${className}`}
      inputMode="decimal"
      value={local}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

export function Sel<T extends string>({
  value,
  onChange,
  opcoes,
  className = '',
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  opcoes: readonly (T | { valor: T; rotulo: string })[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select className={`inp ${className}`} value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value as T)}>
      {opcoes.map((o) => {
        const valor = typeof o === 'string' ? o : o.valor;
        const rotulo = typeof o === 'string' ? o || '—' : o.rotulo;
        return (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        );
      })}
    </select>
  );
}

export const statusClasse = (s: Status | string) =>
  ({
    'NÃO INICIADO': 'st-nao',
    INICIADO: 'st-ini',
    AVANÇADO: 'st-av',
    CONCLUÍDO: 'st-ok',
    CANCELADO: 'st-can',
  })[s] ?? 'st-vazio';

export function StatusSelect({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  return (
    <select className={`inp status ${statusClasse(value)}`} value={value} aria-label="Status" onChange={(e) => onChange(e.target.value as Status)}>
      <option value="">—</option>
      {STATUS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function StatusPill({ status }: { status: Status | string }) {
  return <span className={`pill ${statusClasse(status)}`}>{status || 'SEM STATUS'}</span>;
}

export function AnoTabs({ ano, onChange, anos = ANOS as readonly number[] }: { ano: number; onChange: (a: number) => void; anos?: readonly number[] }) {
  return (
    <div className="tabs" role="tablist" aria-label="Ano">
      {anos.map((a) => (
        <button key={a} role="tab" aria-selected={a === ano} className={a === ano ? 'tab ativo' : 'tab'} onClick={() => onChange(a)}>
          {a}
        </button>
      ))}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variante = 'sec',
  title,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: 'pri' | 'sec' | 'perigo' | 'fantasma';
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`btn btn-${variante}`} onClick={onClick} title={title} disabled={disabled}>
      {children}
    </button>
  );
}

export function Remover({ onClick, rotulo = 'Remover' }: { onClick: () => void; rotulo?: string }) {
  return (
    <button type="button" className="btn-x" title={rotulo} aria-label={rotulo} onClick={onClick}>
      ×
    </button>
  );
}

export function Kpi({ rotulo, valor, detalhe, tom }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; tom?: 'ok' | 'ruim' | 'neutro' }) {
  return (
    <div className={`kpi ${tom ? 'kpi-' + tom : ''}`}>
      <div className="kpi-rotulo">{rotulo}</div>
      <div className="kpi-valor">{valor}</div>
      {detalhe && <div className="kpi-det">{detalhe}</div>}
    </div>
  );
}

export function Campo({ rotulo, children, largo }: { rotulo: string; children: ReactNode; largo?: boolean }) {
  return (
    <label className={`campo ${largo ? 'campo-largo' : ''}`}>
      <span>{rotulo}</span>
      {children}
    </label>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="vazio">{children}</div>;
}

export function ListaLateral<T extends { id: string }>({
  itens,
  selecionado,
  onSelecionar,
  rotulo,
  onNovo,
  textoNovo = '+ Novo',
}: {
  itens: T[];
  selecionado: string | undefined;
  onSelecionar: (id: string) => void;
  rotulo: (t: T) => ReactNode;
  onNovo: () => void;
  textoNovo?: string;
}) {
  return (
    <aside className="lista-lateral">
      <Btn variante="pri" onClick={onNovo}>
        {textoNovo}
      </Btn>
      <ul>
        {itens.map((t) => (
          <li key={t.id}>
            <button className={t.id === selecionado ? 'ativo' : ''} onClick={() => onSelecionar(t.id)}>
              {rotulo(t)}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Lista simples de strings editáveis (ex.: time de liderança, processos). */
export function ListaTexto({ itens, onChange, placeholder, numerada }: { itens: string[]; onChange: (v: string[]) => void; placeholder?: string; numerada?: boolean }) {
  return (
    <div className="lista-texto">
      {itens.map((t, i) => (
        <div key={i} className="lista-texto-linha">
          {numerada && <span className="lista-num">{i + 1}.</span>}
          <Txt value={t} placeholder={placeholder} onChange={(v) => onChange(itens.map((x, j) => (j === i ? v : x)))} />
          <Remover onClick={() => onChange(itens.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Btn variante="fantasma" onClick={() => onChange([...itens, ''])}>
        + Adicionar
      </Btn>
    </div>
  );
}

/** Seleção de item em uma lista; se o item sumir (ex.: troca de setor), volta ao primeiro. */
export function useSelecao<T extends { id: string }>(lista: T[]) {
  const [selId, setSelId] = useState<string | undefined>(lista[0]?.id);
  const idx = Math.max(0, lista.findIndex((x) => x.id === selId));
  const item = lista[idx] as T | undefined;
  return { item, idx, selId: item?.id, setSelId };
}

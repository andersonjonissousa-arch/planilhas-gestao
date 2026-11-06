import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { dadosIniciais, novoHospital, novoSetor, SCHEMA } from './seed';
import type { AppData, Hospital, Setor } from './types';

const STORAGE_KEY = 'planilhas-gestao:v2';
const CONTEXTO_KEY = 'planilhas-gestao:contexto';

type Recipe<T> = (draft: T) => void;

interface Contexto {
  hospitalId?: string;
  setorId?: string;
}

interface StoreValue {
  data: AppData;
  /** Altera os dados com uma função que muta um rascunho (cópia). */
  update: (recipe: Recipe<AppData>) => void;
  substituir: (data: AppData) => void;
  restaurarPadrao: () => void;
  salvoEm: Date | null;
  erroSalvar: string | null;
  contexto: Contexto;
  selecionar: (c: Contexto) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function normalizarSetor(s: Partial<Setor>): Setor {
  const base = novoSetor(s.nome, s.tipo);
  return {
    ...base,
    ...s,
    introducao: { ...base.introducao, ...s.introducao },
    perfil: { ...base.perfil, ...s.perfil },
    gerenciamentoIncidentes: { ...base.gerenciamentoIncidentes, ...s.gerenciamentoIncidentes },
    interacoes: { ...base.interacoes, ...s.interacoes },
    planoAI: { ...base.planoAI, ...s.planoAI },
    planoGestao: { ...base.planoGestao, ...s.planoGestao },
  } as Setor;
}

function normalizarHospital(h: Partial<Hospital>): Hospital {
  const base = novoHospital(h.sigla, h.nome);
  return {
    ...base,
    ...h,
    estrategia: { ...base.estrategia, ...h.estrategia },
    mapeamento: { ...base.mapeamento, ...h.mapeamento },
    notificacoes: h.notificacoes ?? [],
    setores: (h.setores ?? []).map(normalizarSetor),
  } as Hospital;
}

/** Completa dados antigos/importados com campos que surgiram em versões novas. */
export function normalizar(bruto: unknown): AppData {
  if (!bruto || typeof bruto !== 'object' || !Array.isArray((bruto as AppData).hospitais)) return dadosIniciais();
  return { versaoSchema: SCHEMA, hospitais: (bruto as AppData).hospitais.map(normalizarHospital) };
}

function ler<T>(chave: string): T | null {
  try {
    const raw = localStorage.getItem(chave);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    const salvo = ler<AppData>(STORAGE_KEY);
    return salvo ? normalizar(salvo) : dadosIniciais();
  });
  const [contexto, setContexto] = useState<Contexto>(() => ler<Contexto>(CONTEXTO_KEY) ?? {});
  const [salvoEm, setSalvoEm] = useState<Date | null>(null);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSalvoEm(new Date());
        setErroSalvar(null);
      } catch (e) {
        setErroSalvar('Não foi possível salvar no navegador. Exporte um backup (JSON) para não perder dados.');
        console.error(e);
      }
    }, 400);
    return () => window.clearTimeout(timer.current);
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem(CONTEXTO_KEY, JSON.stringify(contexto));
    } catch {
      /* ignora */
    }
  }, [contexto]);

  const update = useCallback((recipe: Recipe<AppData>) => {
    setData((atual) => {
      const draft = structuredClone(atual);
      recipe(draft);
      return draft;
    });
  }, []);

  const substituir = useCallback((d: AppData) => setData(normalizar(d)), []);
  const restaurarPadrao = useCallback(() => setData(dadosIniciais()), []);
  const selecionar = useCallback((c: Contexto) => setContexto(c), []);

  const value = useMemo(
    () => ({ data, update, substituir, restaurarPadrao, salvoEm, erroSalvar, contexto, selecionar }),
    [data, update, substituir, restaurarPadrao, salvoEm, erroSalvar, contexto, selecionar],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fora do StoreProvider');
  return ctx;
}

/** Hospital selecionado (ou o primeiro). */
export function useHospitalOpcional() {
  const { data, update, contexto } = useStore();
  const hospital = data.hospitais.find((h) => h.id === contexto.hospitalId) ?? data.hospitais[0];
  const id = hospital?.id;
  const updH = useCallback(
    (fn: Recipe<Hospital>) =>
      update((d) => {
        const h = d.hospitais.find((x) => x.id === id);
        if (h) fn(h);
      }),
    [update, id],
  );
  return { hospital, updH };
}

export function useHospital() {
  const r = useHospitalOpcional();
  if (!r.hospital) throw new Error('Nenhum hospital cadastrado');
  return r as { hospital: Hospital; updH: (fn: Recipe<Hospital>) => void };
}

/** Setor selecionado dentro do hospital selecionado (ou o primeiro). */
export function useSetorOpcional() {
  const { contexto, update } = useStore();
  const { hospital } = useHospitalOpcional();
  const setor = hospital?.setores.find((s) => s.id === contexto.setorId) ?? hospital?.setores[0];
  const hid = hospital?.id;
  const sid = setor?.id;
  const updS = useCallback(
    (fn: Recipe<Setor>) =>
      update((d) => {
        const s = d.hospitais.find((x) => x.id === hid)?.setores.find((x) => x.id === sid);
        if (s) fn(s);
      }),
    [update, hid, sid],
  );
  return { hospital, setor, updS };
}

export function useSetor() {
  const r = useSetorOpcional();
  if (!r.setor || !r.hospital) throw new Error('Nenhum setor cadastrado');
  return r as { hospital: Hospital; setor: Setor; updS: (fn: Recipe<Setor>) => void };
}

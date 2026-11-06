import { useState, type ComponentType } from 'react';
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Vazio } from './components/ui';
import Contratuais from './pages/Contratuais';
import Dados from './pages/Dados';
import Estrategia from './pages/Estrategia';
import FichasTecnicas from './pages/FichasTecnicas';
import Fmea from './pages/Fmea';
import GerenciamentoIncidentes from './pages/GerenciamentoIncidentes';
import God from './pages/God';
import Hospitais from './pages/Hospitais';
import Indicadores from './pages/Indicadores';
import Interacoes from './pages/Interacoes';
import Introducao from './pages/Introducao';
import Mapeamento from './pages/Mapeamento';
import Modelagem from './pages/Modelagem';
import Notificacoes from './pages/Notificacoes';
import Painel from './pages/Painel';
import Perfil from './pages/Perfil';
import PlanoAI from './pages/PlanoAI';
import PlanoGestao from './pages/PlanoGestao';
import { StoreProvider, useSetorOpcional, useStore } from './store';

/** escopo: 'hospital' = aba institucional; 'setor' = aba da planilha do setor */
interface Rota {
  path: string;
  rotulo: string;
  num?: string;
  escopo: 'hospital' | 'setor' | 'sistema';
  Comp: ComponentType;
}

const GRUPOS: { titulo: string; rotas: Rota[] }[] = [
  { titulo: 'Visão geral', rotas: [{ path: '/', rotulo: 'Painel do hospital', escopo: 'hospital', Comp: Painel }] },
  {
    titulo: 'Planejamento',
    rotas: [
      { path: '/introducao', num: '1', rotulo: 'Introdução', escopo: 'setor', Comp: Introducao },
      { path: '/perfil', num: '2', rotulo: 'Perfil', escopo: 'setor', Comp: Perfil },
      { path: '/estrategia', num: '3', rotulo: 'Estratégia 2024-2027', escopo: 'hospital', Comp: Estrategia },
    ],
  },
  {
    titulo: 'Processos',
    rotas: [
      { path: '/mapeamento', num: '4', rotulo: 'Mapeamento de Processos', escopo: 'hospital', Comp: Mapeamento },
      { path: '/modelagem', num: '6', rotulo: 'Modelagem', escopo: 'setor', Comp: Modelagem },
      { path: '/interacoes', num: '10', rotulo: 'Gerenciamento das Interações', escopo: 'setor', Comp: Interacoes },
    ],
  },
  {
    titulo: 'Segurança do paciente',
    rotas: [
      { path: '/notificacoes', num: '8', rotulo: 'Notificações de Incidentes', escopo: 'hospital', Comp: Notificacoes },
      { path: '/incidentes', num: '9', rotulo: 'Gerenciamento de Incidentes', escopo: 'setor', Comp: GerenciamentoIncidentes },
      { path: '/fmea', rotulo: 'FMEA', escopo: 'setor', Comp: Fmea },
      { path: '/god', rotulo: 'G.O.D - FMEA', escopo: 'sistema', Comp: God },
    ],
  },
  {
    titulo: 'Indicadores',
    rotas: [
      { path: '/indicadores', rotulo: 'Indicadores de desempenho', escopo: 'setor', Comp: Indicadores },
      { path: '/fichas', rotulo: 'Fichas técnicas', escopo: 'setor', Comp: FichasTecnicas },
      { path: '/contratuais', rotulo: 'Indicadores contratuais', escopo: 'setor', Comp: Contratuais },
    ],
  },
  {
    titulo: 'Planos de ação',
    rotas: [
      { path: '/plano-ai', num: '11', rotulo: 'Plano de Ação - AI', escopo: 'setor', Comp: PlanoAI },
      { path: '/plano-gestao', num: '12', rotulo: 'Plano de Ações - Gestão', escopo: 'setor', Comp: PlanoGestao },
    ],
  },
  {
    titulo: 'Sistema',
    rotas: [
      { path: '/hospitais', rotulo: 'Hospitais e setores', escopo: 'sistema', Comp: Hospitais },
      { path: '/dados', rotulo: 'Dados e exportação', escopo: 'sistema', Comp: Dados },
    ],
  },
];

const ROTAS = GRUPOS.flatMap((g) => g.rotas);

function Seletor() {
  const { data, selecionar } = useStore();
  const { hospital, setor } = useSetorOpcional();
  return (
    <div className="seletor">
      <label>
        <span>Hospital</span>
        <select className="inp" value={hospital?.id ?? ''} onChange={(e) => selecionar({ hospitalId: e.target.value })} aria-label="Hospital">
          {data.hospitais.map((h) => (
            <option key={h.id} value={h.id}>
              {h.sigla} — {h.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Setor</span>
        <select className="inp" value={setor?.id ?? ''} onChange={(e) => selecionar({ hospitalId: hospital?.id, setorId: e.target.value })} aria-label="Setor" disabled={!hospital?.setores.length}>
          {!hospital?.setores.length && <option value="">— nenhum setor —</option>}
          {hospital?.setores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Escopo({ rota }: { rota: Rota }) {
  const { hospital, setor } = useSetorOpcional();
  if (rota.escopo === 'sistema') return null;
  return (
    <div className={`escopo escopo-${rota.escopo}`}>
      {rota.escopo === 'hospital' ? (
        <>
          Aba institucional — <b>{hospital?.sigla}</b> (compartilhada por todos os setores)
        </>
      ) : (
        <>
          Planilha do setor <b>{setor?.nome}</b> · {hospital?.sigla}
        </>
      )}
    </div>
  );
}

function Pagina({ rota }: { rota: Rota }) {
  const { hospital, setor } = useSetorOpcional();
  if (rota.escopo !== 'sistema' && !hospital) return <Navigate to="/hospitais" replace />;
  if (rota.escopo === 'setor' && !setor)
    return (
      <Vazio>
        O hospital {hospital?.sigla} ainda não tem setores. <NavLink to="/hospitais">Cadastre um setor</NavLink>.
      </Vazio>
    );
  const { Comp } = rota;
  return (
    <>
      <Escopo rota={rota} />
      {/* key força remontagem ao trocar de setor/hospital, limpando estados locais */}
      <Comp key={`${hospital?.id}-${rota.escopo === 'setor' ? setor?.id : ''}`} />
    </>
  );
}

function Layout() {
  const { erroSalvar } = useStore();
  const [menuAberto, setMenuAberto] = useState(false);
  const loc = useLocation();
  return (
    <div className={`app ${menuAberto ? 'menu-aberto' : ''}`}>
      <header className="topo">
        <button className="menu-btn" aria-label="Abrir menu" onClick={() => setMenuAberto((v) => !v)}>
          ☰
        </button>
        <div className="marca">
          <b>Planilhas de Gestão</b>
          <span>2024-2027</span>
        </div>
        <Seletor />
      </header>
      <nav className="lateral" onClick={() => setMenuAberto(false)}>
        {GRUPOS.map((g) => (
          <div key={g.titulo} className="grupo">
            <div className="grupo-titulo">{g.titulo}</div>
            {g.rotas.map((r) => (
              <NavLink key={r.path} to={r.path} end className={({ isActive }) => (isActive ? 'ativo' : '')}>
                {r.num && <span className="nav-num">{r.num}</span>}
                <span>{r.rotulo}</span>
                {r.escopo === 'hospital' && <span className="nav-tag" title="Institucional (hospital)">H</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <main className="principal" key={loc.pathname}>
        {erroSalvar && <div className="aviso aviso-erro">{erroSalvar}</div>}
        <Routes>
          {ROTAS.map((r) => (
            <Route key={r.path} path={r.path} element={<Pagina rota={r} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Layout />
      </HashRouter>
    </StoreProvider>
  );
}

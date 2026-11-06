import { useRef, useState } from 'react';
import { Btn, Card, PageHeader } from '../components/ui';
import { useSetorOpcional, useStore } from '../store';
import type { AppData } from '../types';

function baixar(nome: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dados() {
  const { data, substituir, restaurarPadrao, salvoEm, erroSalvar } = useStore();
  const { hospital, setor } = useSetorOpcional();
  const arquivo = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const tamanho = new Blob([JSON.stringify(data)]).size;

  return (
    <>
      <PageHeader titulo="Dados, backup e exportação" />
      {erroSalvar && <div className="aviso aviso-erro">{erroSalvar}</div>}
      {msg && <div className="aviso">{msg}</div>}

      <Card titulo="Exportar para Excel">
        <p>Gera uma planilha .xlsx do setor selecionado com as abas da planilha de gestão (Introdução, Perfil, Estratégia, Mapeamento, Modelagem, Incidentes, Interações, Indicadores, Contratuais, Planos de Ação e FMEA).</p>
        <Btn variante="pri" disabled={!hospital || !setor} onClick={() => hospital && setor && import('../lib/excel').then((m) => m.exportarSetorXlsx(hospital, setor))}>
          Exportar {setor ? `${hospital?.sigla} — ${setor.nome}` : ''} (.xlsx)
        </Btn>
      </Card>

      <Card titulo="Backup completo (todos os hospitais e setores)">
        <p>
          Os dados ficam salvos neste navegador ({(tamanho / 1024).toFixed(0)} KB{salvoEm ? `, último salvamento às ${salvoEm.toLocaleTimeString('pt-BR')}` : ''}). Faça backups periódicos e use o arquivo para
          transferir os dados para outro computador.
        </p>
        <div className="botoes">
          <Btn onClick={() => baixar(`planilhas-gestao-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 1))}>Baixar backup (.json)</Btn>
          <input
            ref={arquivo}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                const json = JSON.parse(await f.text()) as AppData;
                if (!Array.isArray(json.hospitais)) throw new Error('Arquivo não é um backup do sistema.');
                if (!confirm(`Substituir TODOS os dados atuais pelos do backup (${json.hospitais.length} hospital(is))?`)) return;
                substituir(json);
                setMsg('Backup restaurado.');
              } catch (err) {
                setMsg('Falha ao importar: ' + (err as Error).message);
              }
            }}
          />
          <Btn onClick={() => arquivo.current?.click()}>Restaurar backup…</Btn>
          <Btn
            variante="perigo"
            onClick={() => {
              if (prompt('Isto apaga todos os dados e volta ao modelo inicial (HRVJ). Digite APAGAR para confirmar:') === 'APAGAR') {
                restaurarPadrao();
                setMsg('Dados restaurados para o modelo inicial.');
              }
            }}
          >
            Restaurar modelo inicial
          </Btn>
        </div>
      </Card>
    </>
  );
}

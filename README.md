# Planilhas de Gestão 2024-2027

Sistema web para as **planilhas de gestão hospitalar**, construído a partir da estrutura de abas da
planilha *HRVJ – PLANILHA GESTÃO 2024-2027*. Atende **vários hospitais** (ex.: HRVJ, HWGA) e, dentro
de cada hospital, **vários setores** — cada setor com a sua própria planilha de gestão.

## Como os dados se organizam

| Nível | Abas | Observação |
|---|---|---|
| **Hospital** (institucional) | 3. Estratégia 2024-2027 · 4. Mapeamento de Processos (macroprocesso + matriz de priorização) · 8. Notificações de Incidentes · Painel do hospital | Compartilhado por todos os setores do hospital. Marcado com **H** no menu. |
| **Setor** | 1. Introdução · 2. Perfil · 6. Modelagem (SIPOC + fluxograma) · 9. Gerenciamento de Incidentes · 10. Gerenciamento das Interações · Indicadores de desempenho · Fichas técnicas · Indicadores contratuais · 11. Plano de Ação – AI · 12. Plano de Ações – Gestão · FMEA | Cada setor tem os seus próprios dados. |
| **Referência** | G.O.D – FMEA (Anvisa, 2017) | Fixo. |

O hospital e o setor ativos são escolhidos no topo da tela. Em **Hospitais e setores** você cadastra
novos hospitais (HWGA etc.) e setores. Também dá para criar um setor copiando as fichas técnicas
dos indicadores de outro setor, ou criar setores a partir dos processos do macroprocesso.

As **interfaces entre setores** usam os dados de todos eles: a notificação de incidente é registrada
no hospital, com o *setor notificado*, e aparece no *Gerenciamento de Incidentes* desse setor. Fornecedor e
cliente das interações sugerem os setores já cadastrados.

## Regras de cálculo (equivalentes às fórmulas da planilha)

- **Indicadores**: resultado do período = numerador ÷ denominador × fator (percentual ×100, densidade
  ×1000, razão ×1, ou valor absoluto). O resultado anual é Σnumerador ÷ Σdenominador. A mediana é a dos
  períodos do ano. A comparação com a meta segue a polaridade: ▲ maior é melhor, ▼ menor é melhor,
  ►◄ sem direção. A periodicidade pode ser mensal ou trimestral.
- **Indicadores contratuais**: % realizado mensal = resultado ÷ meta (▲). Na regra de limite (▼), o
  realizado é 100% até a meta e `2 − resultado/meta` acima dela, como em `=IF(B<=10,1,1-(B/10)+1)`.
  O % trimestral é a média dos meses.
- **Matriz de priorização**: soma de 4 critérios (1–5). As faixas são 4–8 baixa, 9–13 média, 14–18 alta e ≥19 muito alta.
- **Interações**: % de conformidade = C ÷ (C + N/C), por mês e no ano.
- **Planos de ação**: % de conclusão = concluídas ÷ ações com status. Canceladas não contam.
- **FMEA**: NPR = Gravidade × Ocorrência × Detecção, antes e depois das ações.

As regras ficam em `src/lib/calc.ts` e têm testes em `src/lib/calc.test.ts`.

## Dados

- Os dados ficam salvos **no navegador** (localStorage).
- Em **Dados e exportação** você pode:
  - exportar a planilha **.xlsx** do setor, com as mesmas abas da planilha original;
  - baixar e restaurar um **backup .json** completo, com todos os hospitais e setores.
- Em **Notificações de Incidentes** você importa uma planilha `.xlsx`/`.csv` com o cabeçalho da aba
  original (CÓDIGO, DATA DA OCORRÊNCIA/HORA, SETOR NOTIFICADO…). Códigos repetidos são ignorados.

> Para uso simultâneo por várias pessoas e hospitais, o próximo passo é ligar um backend
> (ex.: Supabase/PostgreSQL), com login e permissão por hospital e setor. O modelo de dados já está separado
> por hospital → setor para isso.

## Desenvolvimento

```bash
npm install
npm run dev        # servidor local
npm test           # testes das regras de cálculo
npm run build      # gera a pasta dist/ (site estático)
```

Stack: React 19 + TypeScript + Vite, Recharts (gráficos) e SheetJS (Excel). O build é estático e
funciona em qualquer hospedagem (GitHub Pages, servidor da intranet, pasta local).

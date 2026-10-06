# Relatório de testes — V3


## Passed
- `node tests/analytics.test.js`
  - summary semanal
  - minutos
  - comparecimento
  - prática
  - evidência
  - fechamento
  - latência
  - humor x prática
  - funil
  - distribuição por área
  - competências
  - heatmap legado
  - mapa anual de hábito (365 dias)
  - sequência atual e maior sequência
  - dias ativos e minutos anuais
  - tendência semanal
  - geração de insights
- `python tests/static.test.py`
  - IDs HTML duplicados
  - referências diretas do JavaScript para IDs inexistentes
  - assets principais referenciados
- `node -c app.js`
- `node -c analytics.js`

## Limitação do ambiente de teste
Foi tentado um smoke test visual com Chromium headless. O Chromium disponível no container não inicializou corretamente por dependências de ambiente Linux/DBus/zygote e ficou pendurado. Por isso não foi marcado como teste visual aprovado.

O modo `demo.html?demo=1` foi incluído justamente para abrir o painel com dados fictícios em um navegador normal sem precisar conectar ao Supabase.

## Jornada de estudos — validação adicional
- sintaxe de `roadmap.js`;
- exatamente 12 semanas;
- três trilhas em todas as semanas: DBA/DP-300, AWS/Data Lake e Inglês;
- cálculo de progresso por competência;
- seleção automática da primeira semana abaixo de 80%;
- referências HTML/JavaScript da nova aba Jornada;
- smoke test do mapa anual junto da nova versão.

Validação executada no runtime do conector após a publicação dos arquivos.


## V4 — Home objetiva + skill trees
- `curriculum.js`: 3 trilhas × 12 módulos;
- todos os módulos possuem conteúdos, missão e evidência;
- progressão por competência;
- Home com próxima missão, 3 trilhas, mapa anual e jornada compacta;
- páginas separadas para DBA/DP-300, AWS/Data Lake e Inglês;
- teste estático HTML ↔ JavaScript sem IDs ausentes;
- sintaxe de `app.js`, `analytics.js`, `curriculum.js` e `roadmap.js` validada.


## FORGE V5

Validações executadas após a reconstrução:
- sintaxe de `app-v5.js` e `curriculum.js`;
- 98 IDs da interface sem duplicidade;
- referências diretas JavaScript ↔ HTML sem IDs ausentes (exceto 2 IDs criados dinamicamente pela Mission Room);
- assets V5 presentes;
- 3 mundos × 12 missões completos;
- todos os módulos com conteúdo, Lab/Missão, Evidência, Break & Fix e Portfólio;
- `supabase_v5_migration.sql` com `module_progress`, `assessments`, índices, RLS e políticas por usuário;
- paleta temática separada para DBA, AWS e English;
- teste automatizado `tests/v5.test.js`.


## GitHub Actions — FORGE V5
- Workflow: `.github/workflows/tests.yml`
- Node 22
- `npm test` executa analytics, roadmap, curriculum e V5 integration.
- Execução após correção do currículo: **success**.


## FORGE V5.3 — cofre local
- Supabase Auth retirado temporariamente da UI principal.
- Proteção local: PBKDF2 (210k iterações, SHA-256) + AES-GCM 256.
- Store local implementa sessões, evidências, competências, parking lot, progresso e avaliações.
- Botão de saída passou a bloquear o cofre.
- Cache-busting atualizado para a V5.3.

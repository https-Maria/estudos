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
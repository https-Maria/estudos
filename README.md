# FEZ OU NÃO FEZ — painel de acompanhamento v2

Painel pessoal de estudos para **GitHub Pages + Supabase**. A proposta é medir execução real sem transformar organização em uma segunda atividade de procrastinação.

## O que o painel acompanha

### Hoje
- bater ponto / encerrar sessão;
- área: DBA/DP-300, AWS/Data Lake ou Inglês;
- ação concreta da sessão;
- humor antes de começar: 😄 / 😐 / 💀;
- horário que você pretendia começar (opcional);
- latência entre horário planejado e início real;
- prática realizada;
- evidência do que passou a existir;
- fechamento em 3 linhas: aprendi, dúvida, próximo.

### Painel executivo
- sessões nos últimos 7 dias;
- meta de comparecimento semanal;
- tempo real estudado;
- comparação com os 7 dias anteriores;
- taxa de prática;
- taxa de evidência;
- taxa de fechamento;
- latência média de início;
- funil: sessão → prática → evidência → fechamento;
- 8 semanas de ritmo;
- distribuição de tempo por frente;
- mapa anual de hábito estilo GitHub (365 dias), com intensidade por execução, tooltip diário, sequência atual, maior sequência, dias ativos e tempo acumulado;
- prova de sessões que começaram em “💀 não” e ainda assim viraram execução;
- resumo de evolução das competências.

### Insights automáticos
O sistema usa regras simples e transparentes para apontar padrões, por exemplo:
- “você não precisa estar com vontade”;
- latência média para começar;
- ponto sem prática;
- prática sem evidência;
- ausência de descanso;
- concentração excessiva em uma frente;
- tamanho de sessão que mais vira prática;
- melhor janela de horário observada;
- competências que já chegaram a autonomia.

Os insights esperam amostra mínima quando necessário e evitam tratar pouca informação como verdade.

## Estrutura

```text
estudo-ponto/
├── index.html
├── styles.css
├── app.js
├── analytics.js
├── config.js
├── config.example.js
├── supabase.sql
├── supabase_v2_migration.sql
├── demo.html
└── tests/
    └── analytics.test.js
```

## Instalação nova no Supabase

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**.
3. Cole e execute `supabase.sql`.
4. Em Authentication, mantenha Email/Password habilitado.
5. Crie a conta pela própria página do app.

O script habilita **Row Level Security (RLS)**. Cada usuário autenticado só pode consultar e alterar as próprias linhas.

## Se você já rodou a versão anterior

Execute apenas:

`supabase_v2_migration.sql`

Ele adiciona os campos de horário planejado e latência e os índices novos sem destruir os dados existentes.

## Configurar o front

Copie `config.example.js` para `config.js` e preencha:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA_CHAVE_PUBLICA"
};
```

Use somente **anon key / publishable key**. Nunca coloque `service_role` em GitHub Pages.

## Modo demonstração

Para abrir com dados fictícios sem Supabase:

```text
demo.html?demo=1
```

O modo demo existe para desenvolvimento e validação visual.

## Rodar localmente

```bash
python -m http.server 8000
```

Abra:

```text
http://localhost:8000/?demo=1
```

ou, com Supabase configurado:

```text
http://localhost:8000/
```

## Testes

Os cálculos do dashboard foram isolados em `analytics.js`, para que possam ser testados sem interface ou Supabase.

```bash
node tests/analytics.test.js
```

Os testes cobrem resumo semanal, minutos, comparecimento, prática, evidência, fechamento, latência, humor, funil, áreas, competências, mapa anual de hábito/streaks, heatmap legado, tendência semanal e geração de insights.

## GitHub Pages

Suba os arquivos na raiz do repositório e configure:

**Settings → Pages → Build and deployment → Deploy from a branch → main / root**

## Regra do produto

O dashboard não vale como estudo.

Uma sessão só ganha valor quando você:
1. bate o ponto;
2. executa alguma coisa;
3. deixa uma evidência;
4. fecha em três linhas.

## Mapa anual de hábito (V3)

O painel mostra aproximadamente 1 ano de atividade em quadradinhos, no estilo GitHub Contributions. Cada quadrado representa um dia:

- vazio: nenhuma sessão concluída;
- nível 1: até 15 min;
- nível 2: 16–30 min;
- nível 3: 31–60 min;
- nível 4: mais de 60 min.

Ao passar o mouse, o painel mostra sessões, minutos, práticas e evidências daquele dia. Também calcula:

- dias ativos no período;
- sequência atual;
- maior sequência;
- tempo total acumulado no ano.

O app busca 370 dias de sessões/evidências do Supabase para que o mapa anual seja completo. Nenhuma migração de banco é necessária para a V3.

## Jornada de 12 semanas

A aba **Jornada** transforma o cronograma em um mapa visual de formação. Ela mostra três pistas paralelas:

- **DBA / DP-300** — fundamentos, índices, planos, performance, transações, concorrência, DMVs, backup/restore, segurança, automação, HA/DR e Azure SQL;
- **AWS / Data Lake** — S3, Parquet, Glue Catalog, Athena, Glue ETL, PySpark, Bronze/Silver/Gold, Step Functions e Lake Formation;
- **Inglês técnico** — there is/are, tempos verbais, modais, perguntas, preposições, writing e speaking.

Cada semana tem:
- um objetivo;
- uma missão concreta por trilha;
- uma evidência esperada;
- progresso calculado a partir dos níveis das competências;
- um botão para levar a missão atual direto para a tela **Hoje**.

A semana atual é a primeira cujo progresso ainda está abaixo de 80%, então o mapa avança conforme competência real, não por calendário.


## Como o conteúdo é definido

O currículo vive em `curriculum.js` e é separado da interface.

Cada módulo contém:
- conteúdos;
- competência associada;
- missão prática;
- evidência esperada;
- fontes/origem da trilha.

As três fontes principais são:
1. blueprint oficial da DP-300 + competências reais de DBA;
2. stack real de AWS/Data Lake usado no trabalho;
3. gaps reais de inglês técnico.

A Home mostra apenas o próximo passo, as três trilhas, o mapa de hábito e a jornada de 12 semanas. Ao abrir uma trilha, a skill tree mostra todos os conteúdos daquele módulo.

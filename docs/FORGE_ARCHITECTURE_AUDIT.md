# FORGE — Auditoria de arquitetura antes do War Room

Data da auditoria: 2026-10-08

> Regra desta etapa: compreender e documentar antes de alterar o comportamento do aplicativo.

## 1. Resumo

O FORGE atual já possui uma base forte para evoluir de rastreador gamificado para sistema de formação profissional.

Não é necessário reconstruir o aplicativo.

A estratégia recomendada é **adicionar Recall e War Room como módulos novos**, reutilizando:
- autenticação Supabase;
- trilhas e currículo;
- progresso por módulo;
- sessões de estudo;
- evidências;
- avaliações;
- histórico;
- relatórios;
- portfólio;
- identidade visual atual.

O primeiro incremento do War Room deve ser pequeno: **um único incidente determinístico completo**, integrado a uma competência existente.

---

## 2. Arquitetura atual

```text
GitHub Pages
   │
   ├── index.html
   ├── styles-v5.css
   ├── app-v5.js
   ├── curriculum.js
   ├── analytics.js
   └── config.js
          │
          ▼
     Supabase JS v2
          │
          ├── Auth
          └── PostgreSQL + RLS
                 │
                 ├── study_sessions
                 ├── evidence
                 ├── competencies
                 ├── parking_lot
                 ├── module_progress
                 └── assessments
```

### Frontend

O aplicativo é uma SPA sem framework e sem bundler.

- `index.html`: estrutura das views, modais e navegação.
- `styles-v5.css`: identidade visual e componentes.
- `app-v5.js`: orquestração da UI, estado, acesso ao Supabase e regras da aplicação.
- `curriculum.js`: fonte de verdade das três trilhas e 36 módulos.
- `analytics.js`: cálculos puros de execução, hábitos, funil e insights.
- `roadmap.js`: estrutura anterior da jornada; ainda existe e é testada, mas não é carregada pela UI V5.
- `app.js` e `styles.css`: versão anterior preservada no repositório, mas não carregada pelo `index.html` atual.

### Deploy e qualidade

- GitHub Pages hospeda o frontend.
- GitHub Actions roda `npm test` em cada push.
- Os testes atuais cobrem analytics, roadmap, currículo e integração estática da V5.
- Existe modo demo sem Supabase.

---

## 3. Autenticação e persistência

### Auth

O FORGE usa Supabase Auth com email/senha.

O frontend possui:
- login;
- cadastro;
- sessão persistida;
- logout;
- recuperação de senha;
- atualização de senha em evento `PASSWORD_RECOVERY`.

### Banco atual

As tabelas públicas são:

1. `study_sessions`
2. `evidence`
3. `competencies`
4. `parking_lot`
5. `module_progress`
6. `assessments`

Todas estão com RLS habilitado.

As policies existentes restringem SELECT/INSERT/UPDATE/DELETE ao próprio `auth.uid()`.

O role `authenticated` possui os grants necessários nas seis tabelas.

### Observação de arquitetura

Os arquivos SQL existem no GitHub, mas o projeto Supabase atualmente não apresenta histórico formal de migrations na API de migrations. Isso indica que o schema foi aplicado principalmente pelo SQL Editor.

Para o War Room, novas mudanças de schema devem passar a ser aplicadas como migrations rastreadas.

---

## 4. Módulos atuais que já atendem parte da visão nova

### Skill Tree

Já existe.

`curriculum.js` possui:
- DBA / DP-300;
- AWS / Data Lake;
- Technical English;
- 12 módulos por trilha;
- tópicos;
- missão;
- evidência;
- Break & Fix;
- artefato de portfólio.

O progresso da V5 já diferencia:
- Lab;
- Evidência;
- Break & Fix;
- Portfólio;
- Boss Battle.

### Labs

A base conceitual já existe no currículo e nos documentos:
- `docs/sql-dba-lab/README.md`
- `docs/bitrix-data-lake/README.md`

O FORGE registra a execução, mas não executa o laboratório real dentro do navegador.

Isso deve continuar assim.

### Progress

Já existe:
- bater ponto;
- sessão ativa;
- tempo;
- humor/vontade;
- prática;
- evidência;
- fechamento;
- registro retroativo;
- heatmap anual;
- streak;
- relatórios;
- insights.

### Mission Board

Já existe parcialmente:
- missão atual;
- recomendação adaptativa;
- ações concretas;
- Mission Room;
- retomada da sessão ativa.

A missão ativa tem prioridade sobre a recomendação automática.

### Boss Battle

Já existe um bridge simples com ChatGPT:
- FORGE gera contexto;
- avaliação ocorre fora do site;
- resultado volta via JSON;
- `assessments` persiste score, nível, pontos fortes e gaps;
- `module_progress` recebe score validado.

Isso pode ser reutilizado como mecanismo de validação final do Recall e do War Room.

### Portfólio

Já existe associação entre módulos e caminhos de documentação Git.

O FORGE não precisa criar uma quarta trilha de portfólio.

---

## 5. O que ainda não existe

### Recall

Ainda não há:
- banco de questões;
- tentativas por questão;
- explicação de erro;
- revisão espaçada;
- retenção ao longo do tempo;
- reavaliação por competência.

### War Room

Ainda não há:
- catálogo de incidentes;
- execução de incidentes;
- máquina de estados;
- personagens e diálogos;
- console simulado;
- comandos permitidos;
- evidências desbloqueáveis;
- relógio/SLA;
- consequências;
- histórico de decisões;
- scoring por dimensão;
- pós-incidente.

### Modelo de domínio

Hoje o progresso ainda é muito binário em alguns pontos.

Existe diferença entre atividade e Boss Battle, mas ainda não há uma representação explícita de:

```text
Compreendi
Executei
Dominei
```

O War Room e o Recall são os módulos ideais para preencher essa lacuna sem descartar o progresso atual.

---

## 6. Dívidas técnicas que não devem virar bloqueio

### app-v5.js concentra responsabilidades

Atualmente o mesmo arquivo faz:
- estado;
- Supabase;
- autenticação;
- regras;
- renderização;
- eventos;
- progresso;
- avaliações;
- relatórios.

Não é necessário refatorar tudo antes do War Room.

Para evitar aumentar o monólito, **o War Room deve nascer em arquivos separados**.

### Arquivos legados

`app.js`, `styles.css` e `roadmap.js` coexistem com a V5.

Não remover agora.

Primeiro marcar claramente como legado e confirmar dependências dos testes.

### Migrações

A partir do War Room, migrations devem ser versionadas e também registradas no Supabase.

---

## 7. Integração proposta do War Room

### Arquivos novos

```text
warroom/
├── engine.js
├── scoring.js
├── incidents.js
└── incidents/
    └── dba-blocking-01.js
```

Responsabilidades:

- `engine.js`: máquina de estados determinística.
- `scoring.js`: regras de pontuação.
- `incidents.js`: registro/catálogo.
- `incidents/dba-blocking-01.js`: primeiro cenário completo.

A UI atual só recebe uma nova view e chama o motor.

### Conceito de estado

```js
{
  incidentId,
  runId,
  state,
  elapsedMinutes,
  evidenceUnlocked,
  actionsTaken,
  communicationChoices,
  resolved,
  result
}
```

Cada ação deverá:
1. verificar pré-requisitos;
2. consumir tempo;
3. alterar estado quando aplicável;
4. liberar evidências;
5. registrar consequência;
6. adicionar evento ao histórico.

Nenhuma resposta correta será improvisada por IA.

---

## 8. Persistência proposta

Criar duas tabelas inicialmente.

### war_runs

Uma linha por tentativa.

Campos principais:
- `id`
- `user_id`
- `incident_id`
- `track_id`
- `module_id`
- `status`
- `current_state`
- `started_at`
- `finished_at`
- `elapsed_minutes`
- `sla_minutes`
- `score`
- `technical_score`
- `communication_score`
- `architecture_score`
- `business_score`
- `result`
- `debrief`

### war_events

Log imutável da investigação.

Campos principais:
- `id`
- `run_id`
- `user_id`
- `sequence`
- `event_type`
- `action_id`
- `payload`
- `time_cost`
- `created_at`

RLS seguirá o padrão já existente: cada usuário vê e altera apenas seus próprios runs.

O histórico de eventos não deve ser sobrescrito; ele é a evidência da linha de raciocínio.

---

## 9. Integração com o progresso existente

O War Room não cria um segundo sistema de progresso.

Ao concluir um incidente:

```text
war_run
   │
   ├── atualiza Break & Fix do module_progress quando os critérios forem atendidos
   │
   ├── gera/atualiza assessment
   │
   └── alimenta gaps e recomendações
```

Assim:
- `module_progress` continua sendo a visão resumida;
- `assessments` continua sendo a validação;
- `war_runs` guarda a tentativa;
- `war_events` explica como a tentativa aconteceu.

---

## 10. Primeiro incidente recomendado

### DBA-WR-001 — Sistema lento por transação bloqueadora

Vinculação:
- trilha: DBA;
- módulo: `dba-04`;
- competência: Locks / Blocking.

Por que começar aqui:

1. já existe no currículo;
2. permite causa raiz escondida;
3. produz investigação realista;
4. suporta console simulado com DMVs;
5. permite decisões corretas e perigosas;
6. permite SLA;
7. testa comunicação com personagem;
8. gera pontuação Técnica, Comunicação, Arquitetura e Negócio;
9. depois pode ser reproduzido no DBA_LAB real.

### Cenário inicial

Sintoma visível:

> “O sistema de pedidos está muito lento e algumas vendas ficam carregando até dar timeout.”

A usuária não recebe a causa.

Ela deverá investigar.

Possíveis ações:
- conversar com suporte;
- consultar sessões ativas;
- consultar requests;
- examinar waits;
- procurar blocking chain;
- verificar transações abertas;
- matar uma sessão;
- reiniciar serviço;
- aguardar;
- comunicar impacto;
- escalar.

Algumas ações serão tecnicamente possíveis, mas ruins.

Exemplo:
- reiniciar SQL Server pode aliviar o sintoma;
- porém gera impacto alto;
- não demonstra diagnóstico;
- reduz score técnico e de negócio.

A resolução correta depende de evidências suficientes, não de escolher uma alternativa “certa” cedo demais.

---

## 11. Fluxo da primeira versão

```text
Fila de chamados
      ↓
Abrir incidente
      ↓
Contexto + SLA
      ↓
Conversas / Console
      ↓
Investigar
      ↓
Evidências desbloqueadas
      ↓
Decisão
      ↓
Consequência
      ↓
Resolução
      ↓
Debrief
      ↓
Skill Tree / gaps / histórico
```

A experiência não deve parecer um quiz.

---

## 12. Ordem incremental recomendada

### Incremento A — fundação

- criar schema de `war_runs` e `war_events`;
- criar arquivos isolados do motor;
- criar testes unitários da máquina de estados;
- adicionar uma view vazia “War Room”.

### Incremento B — primeiro incidente

Implementar somente `DBA-WR-001`:
- personagens;
- diálogos;
- comandos;
- outputs;
- evidências;
- decisões;
- SLA;
- scoring;
- debrief.

### Incremento C — integração

- ligar o resultado ao `module_progress`;
- registrar assessment;
- exibir tentativa no histórico;
- gerar recomendação de revisão.

### Incremento D — Recall

Depois do primeiro incidente validado, implementar o motor de questões/revisão.

Não criar catálogo grande antes de validar a experiência do primeiro chamado.

---

## 13. Decisão de segurança

Para a fase narrativa, o motor pode rodar no frontend porque é um sistema pessoal e determinístico.

Porém o repositório é público.

Portanto:

- “causa raiz oculta” no frontend significa **oculta pela interface**, não criptograficamente secreta;
- alguém que leia o código poderá descobrir o cenário;
- se for necessário impedir spoilers ou manipulação do score, a definição secreta e a avaliação deverão migrar para uma Edge Function/backend.

Para o futuro laboratório SQL real:
- navegador nunca recebe credenciais administrativas;
- comandos passam por backend;
- allowlist de operações;
- ambiente isolado;
- timeout;
- limites de recursos;
- auditoria;
- reset reproduzível do laboratório.

---

## 14. Conclusão da auditoria

O FORGE atual não precisa ser substituído.

A evolução mais segura é:

```text
FORGE V5 atual
   +
Recall
   +
War Room determinístico
   +
integração com module_progress / assessments
```

A próxima mudança de código deve ser exclusivamente a **fundação do War Room + primeiro incidente**, sem redesign geral e sem criar dezenas de cenários.

(() => {
  const tracks = [
    {
      id:"dba",
      area:"DBA / DP-300",
      label:"DBA + DP-300",
      short:"SQL Server",
      color:"purple",
      description:"Um laboratório SQL Server permanente: construir, popular, operar, quebrar, diagnosticar, corrigir e documentar até chegar a cenários avançados da DP-300.",
      sources:["DBA_LAB","Break & Fix","DP-300 oficial","Portfólio técnico"],
      modules:[
        {
          id:"dba-01",title:"Construir o DBA_LAB",skills:["Fundamentos SQL Server"],
          topics:["instância/database/schema","MDF/NDF/LDF","filegroups","recovery model","PK/FK/CHECK/DEFAULT","modelagem transacional","geração de massa","milhões de linhas"],
          mission:"Construir o banco DBA_LAB com Comercial, Estoque, Financeiro e Auditoria e gerar massa suficiente para performance real.",
          evidence:"Banco criado + contagem de linhas + diagrama simples.",
          breakfix:"Testar crescimento de arquivos, constraints inválidas e carga grande; observar log e autogrowth.",
          portfolio:"docs/sql-dba-lab/01-build-lab.md — arquitetura, DDL, volume criado e decisões."
        },
        {
          id:"dba-02",title:"Transações de verdade",skills:["Transações"],
          topics:["ACID","BEGIN/COMMIT/ROLLBACK","TRY/CATCH","XACT_STATE","transação de pedido","estoque","financeiro","auditoria","isolamento"],
          mission:"Implementar uma venda completa em uma transação: pedido → itens → estoque → financeiro → auditoria.",
          evidence:"Procedure/script transacional funcionando com COMMIT e ROLLBACK.",
          breakfix:"Provocar falha no meio da venda e provar que o estado inconsistente não ficou gravado.",
          portfolio:"docs/sql-dba-lab/02-transactions.md — fluxo, rollback testado e explicação ACID."
        },
        {
          id:"dba-03",title:"Índices + Execution Plan",skills:["Índices","Execution Plan"],
          topics:["heap","clustered","nonclustered","composite","INCLUDE","filtered","statistics","Seek/Scan","Key Lookup","joins","cardinality"],
          mission:"Escolher queries lentas do DBA_LAB, medir IO/tempo, criar índices e comparar planos.",
          evidence:"Antes/depois com STATISTICS IO/TIME e plano real.",
          breakfix:"Criar índice ruim/redundante de propósito e identificar por que ele não ajuda ou piora escrita.",
          portfolio:"docs/sql-dba-lab/03-indexes-plans.md — caso real com plano antes/depois."
        },
        {
          id:"dba-04",title:"Locks, blocking e isolation",skills:["Locks / Blocking"],
          topics:["S/X/U locks","intent locks","READ COMMITTED","SNAPSHOT","SERIALIZABLE","blocking chain","long transaction","dirty/non-repeatable/phantom"],
          mission:"Abrir múltiplas sessões no SSMS e reproduzir blocking controladamente.",
          evidence:"Blocking capturado + DMV usada + sessão bloqueadora identificada.",
          breakfix:"Deixar transação aberta, gerar fila e depois corrigir sem reiniciar a instância.",
          portfolio:"docs/sql-dba-lab/04-blocking.md — sintomas, investigação, causa e correção."
        },
        {
          id:"dba-05",title:"Deadlocks",skills:["Deadlocks"],
          topics:["deadlock cycle","ordem de acesso","deadlock graph","Extended Events","victim selection","retry","redução de escopo"],
          mission:"Provocar um deadlock previsível entre duas transações e capturar o gráfico.",
          evidence:"Deadlock reproduzido e causa explicada.",
          breakfix:"Corrigir o deadlock alterando ordem de acesso/índice/transação e provar que ele deixou de ocorrer.",
          portfolio:"docs/sql-dba-lab/05-deadlock-postmortem.md — postmortem técnico."
        },
        {
          id:"dba-06",title:"Performance investigativa",skills:["Performance","DMVs / Waits"],
          topics:["Query Store","dm_exec_requests","dm_exec_sessions","dm_exec_query_stats","wait stats","IO","CPU","memory","parameter sniffing","statistics","baseline"],
          mission:"Receber o incidente 'o sistema está lento' sem saber a causa e investigar por evidências.",
          evidence:"Checklist de diagnóstico + hipótese comprovada.",
          breakfix:"Alternar causas: blocking, query ruim, statistics, lookup, scan, parameter sniffing e waits.",
          portfolio:"docs/sql-dba-lab/06-performance-incident.md — incident report com métricas."
        },
        {
          id:"dba-07",title:"Backup, restore e desastre",skills:["Backup / Restore"],
          topics:["FULL","DIFF","LOG","SIMPLE/FULL","restore chain","point-in-time","RPO/RTO","tail-log","VERIFYONLY","recovery"],
          mission:"Montar política de backup e restaurar o laboratório após apagar dados propositalmente.",
          evidence:"Restore completo e point-in-time testados.",
          breakfix:"Apagar dados, restaurar para antes do erro e validar perda máxima conforme RPO.",
          portfolio:"docs/sql-dba-lab/07-backup-restore.md — runbook de recuperação."
        },
        {
          id:"dba-08",title:"Segurança operacional",skills:["Segurança"],
          topics:["login/user","roles","GRANT/DENY/REVOKE","least privilege","TDE","Always Encrypted","RLS","masking","audit","Entra ID"],
          mission:"Criar perfis Admin, App e Leitura e restringir acesso ao mínimo necessário.",
          evidence:"Matriz de acesso + testes de permissão.",
          breakfix:"Criar uma permissão excessiva de propósito, detectar o risco e corrigir.",
          portfolio:"docs/sql-dba-lab/08-security.md — matriz e decisões de segurança."
        },
        {
          id:"dba-09",title:"Automação e manutenção",skills:["Automação"],
          topics:["SQL Server Agent","jobs","schedules","alerts","operators","stats","index maintenance","DBCC","histórico","observabilidade"],
          mission:"Automatizar backup, atualização de estatísticas e verificações do laboratório.",
          evidence:"Jobs com schedule e histórico de execução.",
          breakfix:"Fazer um job falhar de propósito, identificar erro e recuperar a rotina.",
          portfolio:"docs/sql-dba-lab/09-automation.md — catálogo de jobs e troubleshooting."
        },
        {
          id:"dba-10",title:"Break & Fix avançado",skills:["Performance","DMVs / Waits","Backup / Restore"],
          topics:["log cheio","autogrowth","disk pressure","tempdb","long running transaction","orphaned users","failed job","bad plan","data consistency"],
          mission:"Rodar um dia de incidentes: você recebe sintomas e precisa encontrar a causa sem dica.",
          evidence:"5 incidentes resolvidos com tempo e diagnóstico registrados.",
          breakfix:"O módulo inteiro é break/fix; todos os problemas acontecem somente no DBA_LAB.",
          portfolio:"docs/sql-dba-lab/10-break-fix-day.md — diário de incidentes e lições."
        },
        {
          id:"dba-11",title:"HA / DR e arquitetura",skills:["HA / DR"],
          topics:["Always On AG","FCI","log shipping","sync/async","quorum","failover","geo-replication","failover groups","RPO/RTO","DR test"],
          mission:"Desenhar soluções de HA/DR para três empresas com requisitos diferentes.",
          evidence:"Matriz de decisão por RPO, RTO, custo e disponibilidade.",
          breakfix:"Simular decisão errada de arquitetura e explicar qual requisito seria violado.",
          portfolio:"docs/sql-dba-lab/11-ha-dr.md — architecture decision record."
        },
        {
          id:"dba-12",title:"Azure SQL + DP-300 + incidente final",skills:["Azure SQL","Performance","Segurança","Automação","HA / DR"],
          topics:["Azure SQL Database","Managed Instance","SQL VM","IaaS/PaaS","migration","monitoring","security","HA","DP-300 scenarios"],
          mission:"Resolver um cenário final que mistura migração, performance, segurança, automação e recuperação; depois fazer simulado DP-300.",
          evidence:"Relatório final + score do simulado + gaps restantes.",
          breakfix:"Incidente final sem roteiro, usando o laboratório e decisões Azure.",
          portfolio:"docs/sql-dba-lab/12-final-case.md — case completo para portfólio."
        }
      ]
    },
    {
      id:"aws",
      area:"AWS / Data Lake",
      label:"AWS + Data Lake",
      short:"Bitrix Lake",
      color:"orange",
      description:"Um único projeto prático do trabalho: consumir Bitrix no NiFi e levar os dados até S3, Glue, Athena e camadas Bronze/Silver/Gold com governança e orquestração.",
      sources:["Bitrix real","NiFi hands-on","Console AWS","Documentação técnica Git"],
      modules:[
        {
          id:"aws-01",title:"Bitrix → NiFi: primeira ingestão",skills:["S3"],
          topics:["FlowFile","InvokeHTTP","relationships","HTTP status","JSON","headers","auth","Run Once","queues","provenance"],
          mission:"Fazer o NiFi consumir um endpoint simples do Bitrix e enxergar o payload real.",
          evidence:"Fluxo verde + payload mascarado + status HTTP documentado.",
          breakfix:"Forçar 4xx/5xx, URL errada e credencial inválida para entender Failure/No Retry/Retry.",
          portfolio:"docs/bitrix-data-lake/01-nifi-bitrix-ingestion.md — fluxo, processors e troubleshooting."
        },
        {
          id:"aws-02",title:"API Bitrix robusta",skills:["S3"],
          topics:["REST","pagination","rate limit","webhook/token","parameters","incremental load","updated_at","retry","idempotência"],
          mission:"Consumir uma entidade real do Bitrix com paginação e estratégia incremental.",
          evidence:"Fluxo que percorre mais de uma página sem duplicar registros.",
          breakfix:"Simular paginação quebrada, timeout e retry.",
          portfolio:"docs/bitrix-data-lake/02-bitrix-pagination.md — contrato da API e estratégia incremental."
        },
        {
          id:"aws-03",title:"NiFi → S3 Bronze",skills:["S3","Bronze / Silver / Gold"],
          topics:["bucket","key/prefix","PutS3Object","naming","raw payload","partition path","date ingestion","encryption","metadata"],
          mission:"Gravar o payload bruto do Bitrix no S3 Bronze com estrutura de prefixos consistente.",
          evidence:"Objeto no S3 + caminho documentado + payload preservado.",
          breakfix:"Testar permissão negada, bucket/prefix errado e duplicação de arquivos.",
          portfolio:"docs/bitrix-data-lake/03-s3-bronze.md — convenção de nomes e layout Bronze."
        },
        {
          id:"aws-04",title:"JSON/CSV → Parquet",skills:["Parquet"],
          topics:["columnar format","schema","compression","types","partitioning","predicate pushdown","small files","conversion"],
          mission:"Converter uma amostra Bronze para Parquet e comparar tamanho/estrutura.",
          evidence:"Parquet aberto no Pandas + schema e comparação com JSON/CSV.",
          breakfix:"Introduzir tipo inconsistente/null e corrigir schema.",
          portfolio:"docs/bitrix-data-lake/04-parquet.md — benchmark simples e decisões de schema."
        },
        {
          id:"aws-05",title:"Glue Data Catalog + Crawler",skills:["Glue Data Catalog"],
          topics:["database","table","crawler","schema inference","partition","SerDe","S3 location","metadata"],
          mission:"Catalogar os dados Bronze/Silver e rastrear uma tabela do Glue até o S3.",
          evidence:"Tabela visível no Catalog + schema conferido.",
          breakfix:"Crawler inferindo tipo errado ou tabela apontando para prefixo incorreto.",
          portfolio:"docs/bitrix-data-lake/05-glue-catalog.md — catálogo, crawler e troubleshooting."
        },
        {
          id:"aws-06",title:"Athena sobre o Lake",skills:["Athena"],
          topics:["SELECT","WHERE","GROUP BY","JOIN","partition pruning","CTAS","bytes scanned","result location","cost awareness"],
          mission:"Consultar dados do Bitrix no Athena e produzir primeiras perguntas analíticas.",
          evidence:"5 queries úteis + comparação de bytes lidos.",
          breakfix:"Criar consulta cara/sem filtro e depois reduzir scan usando partição/formato.",
          portfolio:"docs/bitrix-data-lake/06-athena.md — queries e otimização."
        },
        {
          id:"aws-07",title:"Glue ETL: Bronze → Silver",skills:["Glue ETL","PySpark","Bronze / Silver / Gold"],
          topics:["Glue Job","DataFrame","select/filter/withColumn","casting","dedupe","null handling","business keys","write parquet"],
          mission:"Limpar e tipar uma entidade do Bitrix e gravar uma Silver confiável.",
          evidence:"Antes/depois Bronze vs Silver + regras de transformação.",
          breakfix:"Schema drift, duplicidade e campo inesperado.",
          portfolio:"docs/bitrix-data-lake/07-bronze-to-silver.md — regras, PySpark e qualidade."
        },
        {
          id:"aws-08",title:"Qualidade, incremental e idempotência",skills:["Glue ETL","PySpark"],
          topics:["watermark","dedupe","upsert strategy","late data","reprocessing","data quality","row counts","rejects","observability"],
          mission:"Rodar o mesmo lote duas vezes sem duplicar resultado e validar contagens.",
          evidence:"Teste de idempotência + checks de qualidade.",
          breakfix:"Duplicar lote, alterar schema e reprocessar período.",
          portfolio:"docs/bitrix-data-lake/08-quality-idempotency.md — testes e critérios de aceite."
        },
        {
          id:"aws-09",title:"Silver → Gold / modelo analítico",skills:["Bronze / Silver / Gold","Athena"],
          topics:["fact/dimension","grain","business rules","aggregates","star schema","CRM metrics","Gold tables","BI consumption"],
          mission:"Criar uma Gold útil para leads/oportunidades/atividades do Bitrix.",
          evidence:"Tabela Gold + definição de grain e métricas.",
          breakfix:"Detectar dupla contagem e grain incorreto.",
          portfolio:"docs/bitrix-data-lake/09-gold-model.md — modelo dimensional e métricas."
        },
        {
          id:"aws-10",title:"Orquestração com Step Functions",skills:["Step Functions"],
          topics:["state machine","Task","Choice","Retry","Catch","Parallel","Glue integration","Athena integration","failure path"],
          mission:"Orquestrar Bronze → Silver → validação → Gold.",
          evidence:"State machine desenhada ou executada com caminho de erro.",
          breakfix:"Fazer uma etapa falhar e confirmar Retry/Catch.",
          portfolio:"docs/bitrix-data-lake/10-orchestration.md — state machine e fluxo de erro."
        },
        {
          id:"aws-11",title:"Governança com Lake Formation",skills:["Lake Formation"],
          topics:["IAM x Lake Formation","database/table/column permissions","LF-Tags","least privilege","data access","audit thinking"],
          mission:"Desenhar/aplicar acesso de exemplo para engenharia, BI e leitura restrita.",
          evidence:"Matriz de permissão por camada/tabela.",
          breakfix:"Usuário sem acesso ou acesso excessivo; identificar onde corrigir.",
          portfolio:"docs/bitrix-data-lake/11-governance.md — matriz e modelo de acesso."
        },
        {
          id:"aws-12",title:"Pipeline completo Bitrix → BI",skills:["S3","Parquet","Glue Data Catalog","Athena","Glue ETL","PySpark","Bronze / Silver / Gold","Step Functions","Lake Formation"],
          topics:["end-to-end","monitoring","cost","data contract","runbook","architecture","handoff","portfolio"],
          mission:"Apresentar o pipeline inteiro: Bitrix → NiFi → S3 Bronze → Glue/PySpark → Silver/Gold → Athena/BI.",
          evidence:"Execução ponta a ponta + diagrama + README final.",
          breakfix:"Executar um incidente surpresa em qualquer etapa e registrar resolução.",
          portfolio:"docs/bitrix-data-lake/12-final-architecture.md — case completo, sem dados/segredos da empresa."
        }
      ]
    },
    {
      id:"english",
      area:"Inglês",
      label:"Inglês técnico",
      short:"Tech English",
      color:"green",
      description:"Inglês acoplado aos projetos: ler documentação, escrever README/runbook, relatar incidentes e explicar tecnicamente o que você construiu.",
      sources:["Seu gap real","Docs AWS/Microsoft","GitHub técnico","Speaking aplicado"],
      modules:[
        {
          id:"eng-01",title:"There is / There are na arquitetura",skills:["There is / There are"],
          topics:["there is/are","there was/were","negative","questions","architecture vocabulary"],
          mission:"Descrever seu DBA_LAB e Data Lake em 10 frases: o que existe em cada ambiente.",
          evidence:"10 frases corrigidas e reutilizadas em documentação.",
          breakfix:"Corrigir frases onde 'there' foi usado como 'lá' em vez de existência.",
          portfolio:"docs/english-tech/01-there-is-architecture.md — exemplos PT/EN."
        },
        {
          id:"eng-02",title:"Simple Present para documentação",skills:["Simple Present"],
          topics:["routine","system behavior","do/does","third person","technical verbs"],
          mission:"Escrever como o pipeline funciona normalmente: 'NiFi consumes...', 'Glue transforms...'.",
          evidence:"Parágrafo técnico no Simple Present.",
          breakfix:"Revisar erros de 3ª pessoa e auxiliar do/does.",
          portfolio:"Adicionar seção 'How it works' em inglês ao projeto Bitrix Lake."
        },
        {
          id:"eng-03",title:"Present Continuous para status",skills:["Present Continuous"],
          topics:["am/is/are + ing","current work","temporary state","status update"],
          mission:"Escrever um status real: o que você está configurando/investigando agora.",
          evidence:"5 updates técnicos curtos.",
          breakfix:"Distinguir rotina (simple present) de ação atual (continuous).",
          portfolio:"docs/english-tech/03-status-updates.md."
        },
        {
          id:"eng-04",title:"Simple Past para incidentes",skills:["Simple Past"],
          topics:["regular/irregular","did","finished events","incident timeline","root cause verbs"],
          mission:"Escrever a linha do tempo de um break/fix SQL ou NiFi no passado.",
          evidence:"Incident timeline de 8–10 frases.",
          breakfix:"Corrigir mistura de did + verbo no passado.",
          portfolio:"Adicionar 'Incident timeline' em inglês a um postmortem real do lab."
        },
        {
          id:"eng-05",title:"Present Perfect para experiência",skills:["Present Perfect"],
          topics:["have/has + participle","for/since","already/yet","ever/never","past vs present perfect"],
          mission:"Explicar experiência e evolução: o que você já construiu/aprendeu até agora.",
          evidence:"8 frases profissionais + comparação com simple past.",
          breakfix:"Escolher corretamente entre 'I worked' e 'I have worked'.",
          portfolio:"docs/english-tech/05-experience-progress.md."
        },
        {
          id:"eng-06",title:"Future para planejamento técnico",skills:["Future"],
          topics:["will","going to","scheduled work","prediction","next steps"],
          mission:"Escrever próximos passos de um módulo AWS/DBA como plano técnico.",
          evidence:"Next steps em inglês no README.",
          breakfix:"Separar decisão espontânea, plano e previsão.",
          portfolio:"Adicionar seção 'Next steps' em inglês ao projeto."
        },
        {
          id:"eng-07",title:"Modals para troubleshooting",skills:["Modals"],
          topics:["can","could","should","must","might","have to","risk language"],
          mission:"Dar recomendações para 10 problemas técnicos reais do lab.",
          evidence:"Troubleshooting checklist em inglês.",
          breakfix:"Revisar força/certeza: might vs should vs must.",
          portfolio:"docs/english-tech/07-troubleshooting-modals.md."
        },
        {
          id:"eng-08",title:"Questions para investigação",skills:["Questions"],
          topics:["do/did","be","have","wh- questions","diagnostic questions","interview"],
          mission:"Montar perguntas que um DBA/Data Engineer faria durante um incidente.",
          evidence:"15 perguntas e respostas técnicas.",
          breakfix:"Corrigir ordem auxiliar + sujeito + verbo.",
          portfolio:"docs/english-tech/08-diagnostic-questions.md."
        },
        {
          id:"eng-09",title:"Prepositions e linguagem de docs",skills:["Prepositions"],
          topics:["in/on/at","for/since","to/from","by/until","on S3","in a database","at runtime"],
          mission:"Corrigir preposições usando frases tiradas dos seus próprios READMEs.",
          evidence:"Lista pessoal de padrões que você costuma errar.",
          breakfix:"Reescrever 15 frases com erro.",
          portfolio:"docs/english-tech/09-prepositions-cheatsheet.md."
        },
        {
          id:"eng-10",title:"Ler documentação sem traduzir tudo",skills:["Writing"],
          topics:["skimming","scanning","context","false cognates","technical nouns","note taking"],
          mission:"Ler um trecho oficial AWS ou Microsoft relacionado ao módulo atual e resumir sem traduzir palavra por palavra.",
          evidence:"Resumo PT + 5 termos EN + 3 frases originais.",
          breakfix:"Identificar onde tradução literal distorce o conceito.",
          portfolio:"docs/english-tech/10-reading-notes.md."
        },
        {
          id:"eng-11",title:"README, runbook e postmortem",skills:["Writing"],
          topics:["README structure","runbook","ADR","postmortem","clear sentences","connectors","technical tone"],
          mission:"Escrever uma página técnica curta em inglês sobre um módulo do seu portfólio.",
          evidence:"Documento revisado antes/depois.",
          breakfix:"Reduzir frases longas, ambíguas e traduzidas literalmente.",
          portfolio:"README/Runbook bilíngue dentro dos projetos SQL/AWS."
        },
        {
          id:"eng-12",title:"Speaking: explicar seu projeto",skills:["Speaking"],
          topics:["fluency","chunking","self-correction","architecture walkthrough","incident explanation","interview answer"],
          mission:"Explicar em voz alta por 3 minutos o DBA_LAB ou o pipeline Bitrix Data Lake.",
          evidence:"Roteiro + autoavaliação + segunda tentativa.",
          breakfix:"Regravar focando nos pontos em que travou.",
          portfolio:"docs/english-tech/12-project-pitch.md — roteiro do pitch técnico."
        }
      ]
    }
  ];

  const byId = Object.fromEntries(tracks.map(t=>[t.id,t]));
  const getTrack = id => byId[id];
  const levelFor = (competencies,area,skill) => Number((competencies||[]).find(c=>c.area===area && c.name===skill)?.level||0);
  const moduleProgress = (module,track,competencies) => {
    const vals=(module.skills||[]).map(s=>levelFor(competencies,track.area,s));
    return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/(vals.length*5)*100) : 0;
  };
  const trackProgress = (track,competencies) => {
    const vals=track.modules.map(m=>moduleProgress(m,track,competencies));
    return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0;
  };
  const currentModuleIndex = (track,competencies) => {
    const i=track.modules.findIndex(m=>moduleProgress(m,track,competencies)<80);
    return i===-1?track.modules.length-1:i;
  };

  window.StudyCurriculum={tracks,getTrack,moduleProgress,trackProgress,currentModuleIndex};
})();
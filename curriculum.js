(() => {
  const tracks = [
    {
      id:"dba",
      area:"DBA / DP-300",
      label:"DBA + DP-300",
      short:"SQL Server",
      color:"purple",
      description:"Virar administradora de banco de verdade e, em paralelo, cobrir o blueprint da DP-300.",
      sources:["DP-300 oficial","DBA real","Laboratório"],
      modules:[
        {id:"dba-01",title:"Fundamentos internos",skills:["Fundamentos SQL Server"],topics:["Instância x database x schema","master, model, msdb, tempdb","MDF/NDF/LDF","pages e extents","filegroups","recovery models","tempdb","system catalogs"],mission:"Abrir o SSMS, consultar sys.databases/sys.master_files e identificar bancos e arquivos.",evidence:"Query salva + explicação curta do papel de master/model/msdb/tempdb."},
        {id:"dba-02",title:"Índices e estatísticas",skills:["Índices"],topics:["heap","clustered","nonclustered","composite","INCLUDE","filtered index","statistics","fragmentação","manutenção"],mission:"Comparar uma query antes/depois de criar índice e medir IO/tempo.",evidence:"Antes/depois com STATISTICS IO/TIME e plano de execução."},
        {id:"dba-03",title:"Execution Plans",skills:["Execution Plan"],topics:["Seek x Scan","Key Lookup","Nested Loops","Hash Match","Merge Join","Sort","Aggregate","estimado x real","cardinality"],mission:"Ler um plano real e apontar o operador mais caro e por quê.",evidence:"Print/anotação do plano com 3 operadores explicados."},
        {id:"dba-04",title:"Transações e isolamento",skills:["Transações"],topics:["ACID","BEGIN/COMMIT/ROLLBACK","TRY/CATCH","XACT_STATE","READ COMMITTED","SNAPSHOT","SERIALIZABLE","dirty/non-repeatable/phantom"],mission:"Criar uma transação de venda/estoque e testar rollback.",evidence:"Script transacional funcionando."},
        {id:"dba-05",title:"Blocking, locks e deadlocks",skills:["Locks / Blocking","Deadlocks"],topics:["S/X/U locks","intent locks","blocking chain","deadlock graph","long transactions","isolation impact"],mission:"Provocar blocking e depois um deadlock em duas sessões.",evidence:"Passo a passo do incidente + causa encontrada."},
        {id:"dba-06",title:"Performance e diagnóstico",skills:["Performance","DMVs / Waits"],topics:["Query Store","dm_exec_requests","dm_exec_sessions","dm_exec_query_stats","wait stats","IO","CPU","memory","Extended Events","baseline"],mission:"Receber 'o sistema está lento' e investigar sem saber a causa.",evidence:"Checklist de diagnóstico preenchido com achado e ação."},
        {id:"dba-07",title:"Backup e restore",skills:["Backup / Restore"],topics:["full","differential","log","SIMPLE/FULL","RPO/RTO","point-in-time","tail-log","verify","restore chain"],mission:"Fazer backup, apagar dado e restaurar; depois simular point-in-time.",evidence:"Restore concluído + sequência de comandos."},
        {id:"dba-08",title:"Segurança",skills:["Segurança"],topics:["login x user","roles","GRANT/DENY/REVOKE","least privilege","TDE","Always Encrypted","RLS","masking","audit","Entra ID","firewall/private access"],mission:"Montar uma matriz de acesso e aplicar pelo menos duas proteções.",evidence:"Matriz + scripts de permissões."},
        {id:"dba-09",title:"Automação",skills:["Automação"],topics:["SQL Server Agent","jobs","schedules","alerts","operators","maintenance","Elastic Jobs","PowerShell/CLI/Bicep visão geral"],mission:"Criar um job real de manutenção/backup com schedule.",evidence:"Job executado com histórico de sucesso."},
        {id:"dba-10",title:"HA / DR",skills:["HA / DR"],topics:["Always On AG","FCI","log shipping","geo-replication","failover groups","sync x async","quorum","RPO/RTO","testes de DR"],mission:"Escolher uma estratégia HA/DR para 3 cenários diferentes.",evidence:"Tabela de decisão com RPO/RTO e justificativa."},
        {id:"dba-11",title:"Azure SQL e migração",skills:["Azure SQL"],topics:["Azure SQL Database","Managed Instance","SQL Server em VM","IaaS x PaaS","scale","storage","migration online/offline","post-migration","Azure Arc visão geral"],mission:"Comparar as 3 ofertas e escolher a melhor para cenários propostos.",evidence:"Matriz de decisão Azure SQL."},
        {id:"dba-12",title:"DP-300 e incidentes",skills:["Performance","Segurança","Automação","HA / DR","Azure SQL"],topics:["simulados","cenários","revisão por peso","incidentes","pegadinhas","gaps"],mission:"Fazer um simulado + 2 incidentes práticos no lab.",evidence:"Score do simulado + relatório dos incidentes."}
      ]
    },
    {
      id:"aws",
      area:"AWS / Data Lake",
      label:"AWS + Data Lake",
      short:"Data Lake",
      color:"orange",
      description:"Entender e operar o pipeline que você realmente usa no trabalho, da fonte ao consumo.",
      sources:["Trabalho real","AWS oficial","Hands-on"],
      modules:[
        {id:"aws-01",title:"Fundamentos de Data Lake",skills:["Bronze / Silver / Gold"],topics:["Data Lake x DW","ETL x ELT","ingestion","pipeline","lakehouse","data mart","Bronze/Silver/Gold"],mission:"Desenhar a arquitetura atual da empresa de ponta a ponta.",evidence:"Diagrama simples Fonte → Lake → BI."},
        {id:"aws-02",title:"S3",skills:["S3"],topics:["bucket","object","key","prefix","versioning","storage classes","encryption","IAM visão prática","partition folders"],mission:"Explorar o S3 real e mapear buckets/prefixos relevantes.",evidence:"Mapa de buckets/prefixos sem dados sensíveis."},
        {id:"aws-03",title:"Parquet e particionamento",skills:["Parquet"],topics:["colunar x linha","schema","compressão","partitioning","predicate pushdown","CSV/JSON x Parquet"],mission:"Abrir um Parquet e inspecionar schema, tipos e linhas.",evidence:"Script/Pandas + observações do schema."},
        {id:"aws-04",title:"Glue Data Catalog",skills:["Glue Data Catalog"],topics:["database","table","crawler","schema","partition","metadata","SerDe visão geral"],mission:"Localizar uma tabela real no Catalog e rastrear até o S3.",evidence:"Caminho Catalog → tabela → localização S3."},
        {id:"aws-05",title:"Athena",skills:["Athena"],topics:["serverless SQL","SELECT/WHERE/GROUP/JOIN","partition pruning","CTAS","custos por scan","result location"],mission:"Consultar dados reais no Athena e reduzir o volume lido.",evidence:"Consulta salva + bytes/tempo observados."},
        {id:"aws-06",title:"Glue ETL",skills:["Glue ETL"],topics:["Glue Job","DynamicFrame x DataFrame","transformação","job parameters","bookmarks","logs","Bronze→Silver"],mission:"Entender/rodar um job simples de transformação.",evidence:"Job + entrada/saída identificadas."},
        {id:"aws-07",title:"PySpark",skills:["PySpark"],topics:["DataFrame","select","filter","withColumn","groupBy","join","lazy evaluation","partition","actions"],mission:"Transformar um conjunto de dados com pelo menos 5 operações.",evidence:"Script/notebook PySpark."},
        {id:"aws-08",title:"Ingestão NiFi / API / MySQL",skills:["S3"],topics:["API Bitrix","webhook","pagination","MySQL/JDBC","NiFi processors","flowfile","retry","idempotência","raw ingestion"],mission:"Fazer um fluxo pequeno da fonte até Bronze.",evidence:"Flow funcional ou desenho técnico com payload real mascarado."},
        {id:"aws-09",title:"Bronze / Silver / Gold de verdade",skills:["Bronze / Silver / Gold"],topics:["raw","typing","dedupe","quality","business rules","dimensional output","partition strategy"],mission:"Classificar e transformar uma entidade do CRM nas 3 camadas.",evidence:"Exemplo Bronze/Silver/Gold documentado."},
        {id:"aws-10",title:"Step Functions",skills:["Step Functions"],topics:["state machine","Task","Choice","Retry","Catch","Parallel","service integrations","orchestration"],mission:"Desenhar uma state machine para seu pipeline.",evidence:"Fluxo com erro/retry/catch."},
        {id:"aws-11",title:"Lake Formation",skills:["Lake Formation"],topics:["governança","IAM x LF permissions","database/table/column access","LF-Tags","cross-account visão geral"],mission:"Explicar quem acessa o quê e onde a governança entra.",evidence:"Matriz de acesso do lake."},
        {id:"aws-12",title:"Projeto completo",skills:["S3","Parquet","Glue Data Catalog","Athena","Glue ETL","PySpark","Bronze / Silver / Gold","Step Functions","Lake Formation"],topics:["arquitetura","observabilidade","custos","documentação","data quality","handoff"],mission:"Fechar um mini pipeline completo CRM/ERP → Lake → Athena/BI.",evidence:"Projeto documentado de ponta a ponta."}
      ]
    },
    {
      id:"english",
      area:"Inglês",
      label:"Inglês técnico",
      short:"English",
      color:"green",
      description:"Parar de depender da tradução mental e automatizar a gramática que ainda trava sua produção.",
      sources:["Seu gap real","Inglês técnico","Produção ativa"],
      modules:[
        {id:"eng-01",title:"There is / There are",skills:["There is / There are"],topics:["singular/plural","there was/were","questions","negatives","there x there is"],mission:"Escrever 10 frases sobre banco/infra usando there is/are.",evidence:"10 frases corrigidas."},
        {id:"eng-02",title:"Simple Present",skills:["Simple Present"],topics:["rotina","do/does","3rd person","frequency adverbs"],mission:"Descrever sua rotina CLT e técnica em inglês.",evidence:"Texto curto sem tradutor."},
        {id:"eng-03",title:"Present Continuous",skills:["Present Continuous"],topics:["am/is/are + ing","agora","temporário","present x continuous"],mission:"Narrar o que está fazendo numa sessão de trabalho.",evidence:"6 frases corretas."},
        {id:"eng-04",title:"Simple Past",skills:["Simple Past"],topics:["regular/irregular","did","time markers","finished events"],mission:"Contar o que fez ontem no trabalho.",evidence:"Mini diário técnico."},
        {id:"eng-05",title:"Present Perfect",skills:["Present Perfect"],topics:["have/has + participle","for/since","ever/never","already/yet","past x present perfect"],mission:"Falar de experiência profissional e coisas já concluídas.",evidence:"8 frases + comparação com simple past."},
        {id:"eng-06",title:"Future",skills:["Future"],topics:["will","going to","present continuous for future","predictions x plans"],mission:"Explicar seus próximos passos do projeto em inglês.",evidence:"Plano técnico curto."},
        {id:"eng-07",title:"Modals",skills:["Modals"],topics:["can","could","should","must","might","have to"],mission:"Dar recomendações e possibilidades técnicas.",evidence:"10 frases de troubleshooting."},
        {id:"eng-08",title:"Questions",skills:["Questions"],topics:["do/did","be","have","wh- questions","indirect questions"],mission:"Montar e responder perguntas de entrevista/técnicas.",evidence:"10 Q&A."},
        {id:"eng-09",title:"Prepositions",skills:["Prepositions"],topics:["in/on/at","for/since","to/from","by/until","common tech collocations"],mission:"Corrigir erros recorrentes de preposição em contexto técnico.",evidence:"Exercício de 15 frases."},
        {id:"eng-10",title:"Technical reading",skills:["Writing"],topics:["docs","skimming","scanning","guess from context","false cognates","note taking"],mission:"Ler um trecho de documentação AWS/Microsoft sem traduzir palavra por palavra.",evidence:"Resumo em português e 5 termos novos."},
        {id:"eng-11",title:"Writing",skills:["Writing"],topics:["clareza","ordem da frase","conectores","technical summaries","tickets","documentation"],mission:"Escrever um resumo técnico de 150–200 palavras.",evidence:"Texto revisado antes/depois."},
        {id:"eng-12",title:"Speaking",skills:["Speaking"],topics:["fluency","chunking","self-correction","technical explanation","interview"],mission:"Explicar em voz alta seu Data Lake ou um incidente SQL por 2–3 minutos.",evidence:"Roteiro + autoavaliação."}
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
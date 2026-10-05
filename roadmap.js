(() => {
  const weeks = [
    {
      week: 1, phase: "BASE", title: "Entender o território",
      why: "Você para de decorar nomes e passa a enxergar onde banco, arquivos e frases vivem.",
      tracks: {
        "DBA / DP-300": { skills:["Fundamentos SQL Server"], task:"Abrir o SSMS, consultar sys.databases e identificar master, model, msdb e tempdb." },
        "AWS / Data Lake": { skills:["S3"], task:"Explorar o S3 do ambiente e localizar origem, prefixos e camadas existentes." },
        "Inglês": { skills:["There is / There are"], task:"Escrever 5 frases técnicas usando there is / there are." }
      },
      evidence: "Uma query salva + um mapa simples do S3 + 5 frases corrigidas."
    },
    {
      week: 2, phase: "BASE", title: "Estrutura e acesso",
      why: "Agora você começa a entender como os dados são organizados e encontrados.",
      tracks: {
        "DBA / DP-300": { skills:["Índices"], task:"Criar clustered e nonclustered index e comparar antes/depois." },
        "AWS / Data Lake": { skills:["Parquet"], task:"Abrir um .parquet no Python/Pandas e inspecionar schema e linhas." },
        "Inglês": { skills:["Simple Present"], task:"Descrever sua rotina de trabalho em 6 frases no Simple Present." }
      },
      evidence: "Plano de execução comparado + Parquet aberto + mini texto de rotina."
    },
    {
      week: 3, phase: "BASE", title: "Como o sistema enxerga os dados",
      why: "Você passa a enxergar o caminho que a engine e o catálogo usam para chegar até a informação.",
      tracks: {
        "DBA / DP-300": { skills:["Execution Plan"], task:"Ler um plano e identificar Seek, Scan, Lookup e um operador de JOIN." },
        "AWS / Data Lake": { skills:["Glue Data Catalog"], task:"Localizar database, table, schema e crawler no Glue Catalog." },
        "Inglês": { skills:["Present Continuous"], task:"Explicar em inglês o que você está fazendo agora no trabalho." }
      },
      evidence: "Print/anotação de um plano + tabela catalogada + 5 frases no continuous."
    },
    {
      week: 4, phase: "BASE", title: "Consulta e performance",
      why: "Aqui os estudos começam a parecer trabalho real: consulta, custo e melhoria.",
      tracks: {
        "DBA / DP-300": { skills:["Performance"], task:"Medir IO/tempo de uma query e fazer uma melhoria observável." },
        "AWS / Data Lake": { skills:["Athena"], task:"Rodar SELECT, WHERE, GROUP BY e JOIN no Athena." },
        "Inglês": { skills:["Simple Past"], task:"Contar em inglês o que você fez ontem usando 6 frases." }
      },
      evidence: "Antes/depois de performance + consulta Athena salva + relato curto no passado."
    },
    {
      week: 5, phase: "OPERAÇÃO", title: "Transações e transformação",
      why: "Você começa a tratar dados como algo que muda, falha, volta e precisa manter consistência.",
      tracks: {
        "DBA / DP-300": { skills:["Transações"], task:"Criar uma transação real com BEGIN TRAN, COMMIT, ROLLBACK e TRY/CATCH." },
        "AWS / Data Lake": { skills:["Glue ETL"], task:"Entender um Glue Job e desenhar Bronze → transformação → Silver." },
        "Inglês": { skills:["Present Perfect"], task:"Escrever 6 frases sobre experiências profissionais usando have/has." }
      },
      evidence: "Transação executada + fluxo ETL desenhado + frases em Present Perfect."
    },
    {
      week: 6, phase: "OPERAÇÃO", title: "Concorrência e processamento",
      why: "Você aprende o que acontece quando várias coisas disputam recurso ao mesmo tempo.",
      tracks: {
        "DBA / DP-300": { skills:["Locks / Blocking","Deadlocks"], task:"Provocar blocking e deadlock em duas sessões e investigar o motivo." },
        "AWS / Data Lake": { skills:["PySpark"], task:"Usar select, filter, withColumn, groupBy e join em um DataFrame." },
        "Inglês": { skills:["Future"], task:"Explicar em inglês o que você vai estudar e entregar na próxima semana." }
      },
      evidence: "Blocking/deadlock reproduzido + notebook/script Spark + plano futuro em inglês."
    },
    {
      week: 7, phase: "OPERAÇÃO", title: "Diagnóstico e arquitetura em camadas",
      why: "Você sai do 'está lento' para investigar e do 'tem arquivo' para entender a qualidade da camada.",
      tracks: {
        "DBA / DP-300": { skills:["DMVs / Waits"], task:"Investigar requests, sessions, waits e IO no laboratório." },
        "AWS / Data Lake": { skills:["Bronze / Silver / Gold"], task:"Classificar dados reais do projeto em Bronze, Silver e Gold e justificar." },
        "Inglês": { skills:["Modals"], task:"Criar frases técnicas com can, could, should, must e might." }
      },
      evidence: "Checklist de diagnóstico + mapa Bronze/Silver/Gold + 8 frases com modais."
    },
    {
      week: 8, phase: "OPERAÇÃO", title: "Recuperação e orquestração",
      why: "Operar bem também é saber recuperar e coordenar processos.",
      tracks: {
        "DBA / DP-300": { skills:["Backup / Restore"], task:"Fazer full backup, apagar dado e restaurar; depois estudar point-in-time." },
        "AWS / Data Lake": { skills:["Step Functions"], task:"Desenhar uma state machine com Task, Choice, Retry e Catch." },
        "Inglês": { skills:["Questions"], task:"Montar perguntas técnicas com Do/Did/Have/Are e respondê-las." }
      },
      evidence: "Restore concluído + state machine desenhada + bateria de perguntas/respostas."
    },
    {
      week: 9, phase: "CLOUD & CERTIFICAÇÃO", title: "Segurança e governança",
      why: "Você conecta administração de banco e governança de lake: quem acessa o quê e como protegemos.",
      tracks: {
        "DBA / DP-300": { skills:["Segurança"], task:"Comparar TDE, Always Encrypted, roles, GRANT/DENY e RLS." },
        "AWS / Data Lake": { skills:["Lake Formation"], task:"Entender permissões por database, tabela e coluna no Lake Formation." },
        "Inglês": { skills:["Prepositions"], task:"Treinar in/on/at e for/since usando contexto de trabalho." }
      },
      evidence: "Matriz de segurança + mapa de permissões + exercício de preposições."
    },
    {
      week: 10, phase: "CLOUD & CERTIFICAÇÃO", title: "Automação e pipeline real",
      why: "Aqui você para de executar tarefas repetitivas manualmente e pensa como operadora de plataforma.",
      tracks: {
        "DBA / DP-300": { skills:["Automação"], task:"Criar jobs/schedules para backup, stats ou manutenção no laboratório." },
        "AWS / Data Lake": { skills:["S3","Athena","Glue ETL"], task:"Conectar fonte → S3 → Glue → Athena num mini pipeline documentado." },
        "Inglês": { skills:["Writing"], task:"Escrever um resumo técnico curto do pipeline em inglês." }
      },
      evidence: "Job executando + mini pipeline funcionando + documentação curta em inglês."
    },
    {
      week: 11, phase: "CLOUD & CERTIFICAÇÃO", title: "Resiliência e explicação",
      why: "Você começa a tomar decisões por RPO/RTO e explicar arquitetura como profissional.",
      tracks: {
        "DBA / DP-300": { skills:["HA / DR"], task:"Comparar Always On, FCI, log shipping e backup/restore por RPO/RTO." },
        "AWS / Data Lake": { skills:["S3","Glue Data Catalog","Athena","Step Functions"], task:"Explicar de ponta a ponta a arquitetura do Data Lake do trabalho." },
        "Inglês": { skills:["Speaking"], task:"Gravar/ensaiar uma explicação de 2 minutos sobre seu trabalho e estudos." }
      },
      evidence: "Tabela HA/DR + diagrama de arquitetura + explicação oral."
    },
    {
      week: 12, phase: "CLOUD & CERTIFICAÇÃO", title: "Consolidar, simular, provar",
      why: "A última semana não é aprender mais coisa: é provar que você consegue conectar tudo.",
      tracks: {
        "DBA / DP-300": { skills:["Azure SQL"], task:"Comparar Azure SQL Database, Managed Instance e SQL Server em VM e fazer simulado DP-300." },
        "AWS / Data Lake": { skills:["S3","Parquet","Glue Data Catalog","Athena","Glue ETL","PySpark","Bronze / Silver / Gold","Step Functions","Lake Formation"], task:"Apresentar o fluxo completo Fonte → Bronze → Silver → Gold → Athena/BI." },
        "Inglês": { skills:["Writing","Speaking"], task:"Explicar seu projeto técnico em inglês por escrito e em voz." }
      },
      evidence: "Simulado + arquitetura final + mini apresentação técnica em inglês."
    }
  ];

  function levelFor(competencies, area, skill){
    const item=(competencies||[]).find(c=>c.area===area && c.name===skill);
    return item ? Number(item.level||0) : 0;
  }

  function weekProgress(week, competencies){
    const entries=[];
    Object.entries(week.tracks).forEach(([area,track])=>{
      (track.skills||[]).forEach(skill=>entries.push(levelFor(competencies,area,skill)));
    });
    if(!entries.length) return 0;
    return Math.round(entries.reduce((a,b)=>a+b,0)/(entries.length*5)*100);
  }

  function state(competencies){
    const progress=weeks.map(w=>weekProgress(w,competencies));
    let currentIndex=progress.findIndex(p=>p<80);
    let complete=false;
    if(currentIndex===-1){currentIndex=weeks.length-1;complete=true;}
    const overall=Math.round((competencies||[]).reduce((a,c)=>a+Number(c.level||0),0)/Math.max(1,(competencies||[]).length*5)*100);
    return {weeks,progress,currentWeek:weeks[currentIndex],currentIndex,overall,complete};
  }

  window.StudyRoadmap={weeks,weekProgress,state};
})();

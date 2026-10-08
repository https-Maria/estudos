(function(root,factory){
  const incident=factory();
  if(typeof module==='object'&&module.exports)module.exports=incident;
  root.ForgeWarRoomIncidentDBABlocking01=incident;
  if(root.ForgeWarRoomIncidents&&!root.ForgeWarRoomIncidents.getIncident(incident.id)){
    root.ForgeWarRoomIncidents.registerIncident(incident);
  }
})(typeof self!=='undefined'?self:this,function(){
  const has=(run,id)=>run.actionsTaken.some(x=>x.actionId===id);
  const count=(run,id)=>run.actionsTaken.filter(x=>x.actionId===id).length;

  return {
    id:'DBA-WR-001',
    title:'Pedidos em timeout',
    subtitle:'Sistema lento por transação bloqueadora',
    priority:'P1',
    difficulty:'Base operacional',
    trackId:'dba',
    moduleId:'dba-04',
    competency:'Locks / Blocking',
    initialState:'investigation',
    slaMinutes:35,
    tags:['SQL Server','blocking','locks','SLA','comunicação'],
    brief:{
      company:'NorteSul Distribuição',
      system:'Orion ERP',
      environment:'Produção · SQL Server',
      openedBy:'Camila · Suporte N2',
      impact:'Finalização de pedidos lenta e timeouts intermitentes.',
      message:'Desde 14:10 o Orion ERP começou a travar ao finalizar pedidos. O suporte relata usuários aguardando mais de 40 segundos e alguns timeouts. Não há manutenção programada.'
    },
    characters:[
      {id:'camila',name:'Camila',role:'Suporte N2'},
      {id:'renato',name:'Renato',role:'Coordenador de Operações'},
      {id:'paula',name:'Paula',role:'Desenvolvedora do Orion ERP'}
    ],
    evidence:{
      impact:{
        type:'context',
        title:'Impacto confirmado',
        body:'Camila confirma 27 usuários afetados, principalmente no fechamento de pedidos. O problema começou por volta de 14:10 e está piorando.'
      },
      cpu_normal:{
        type:'metric',
        title:'CPU e memória sem saturação',
        body:'CPU 28–36%, memória estável e sem pressão relevante. O servidor não aparenta gargalo geral de recurso.'
      },
      requests:{
        type:'console',
        title:'Requests bloqueados',
        body:'SPIDs 64, 72 e 81 aguardam locks. O bloqueador principal apontado pela cadeia é a sessão 57.'
      },
      waits:{
        type:'console',
        title:'Waits de lock',
        body:'As sessões afetadas acumulam LCK_M_X / LCK_M_U. O padrão é compatível com blocking, não com CPU alta.'
      },
      open_transaction:{
        type:'console',
        title:'Transação aberta antiga',
        body:'DBCC OPENTRAN aponta a sessão 57 como transação ativa mais antiga, iniciada antes do começo dos timeouts.'
      },
      session57:{
        type:'console',
        title:'Contexto da sessão 57',
        body:'Sessão 57 está sleeping, via SSMS, com open_transaction_count = 1. A última operação alterou preço de item e não finalizou a transação.'
      },
      business_context:{
        type:'conversation',
        title:'Janela operacional crítica',
        body:'Renato informa que o fechamento do turno ocorre em 25 minutos. Uma indisponibilidade total agora afetaria expedição e faturamento.'
      }
    },
    actions:[
      {
        id:'talk_support',
        kind:'conversation',
        speaker:'Camila · Suporte N2',
        label:'Confirmar impacto com o suporte',
        prompt:'Perguntar quem está afetado, desde quando e qual operação trava.',
        output:'“Está pegando mais no fechamento do pedido. Tenho 27 usuários reclamando. Começou perto de 14:10 e os timeouts aumentaram nos últimos minutos.”',
        timeCost:3,
        once:true,
        communication:true,
        unlocksEvidence:['impact'],
        setFlags:{impact_mapped:true}
      },
      {
        id:'talk_operations',
        kind:'conversation',
        speaker:'Renato · Operações',
        label:'Alinhar impacto e janela de negócio',
        prompt:'Confirmar criticidade operacional antes de qualquer ação invasiva.',
        output:'“Fechamos o turno em uns 25 minutos. Se o sistema cair inteiro agora, trava expedição e faturamento. Se precisar intervir, me avisa antes.”',
        timeCost:3,
        once:true,
        communication:true,
        unlocksEvidence:['business_context'],
        setFlags:{business_context_known:true}
      },
      {
        id:'notify_investigation',
        kind:'conversation',
        speaker:'Atualização ao chamado',
        label:'Comunicar que a investigação está em andamento',
        prompt:'Registrar impacto, escopo e informar que ainda não há causa confirmada.',
        output:'Atualização enviada: “Incidente P1 em investigação. Impacto concentrado na finalização de pedidos. Sem evidência de indisponibilidade total até o momento. Próxima atualização em até 10 min.”',
        timeCost:2,
        once:true,
        communication:true,
        setFlags:{stakeholder_informed:true}
      },
      {
        id:'check_cpu',
        kind:'command',
        label:'Verificar pressão geral do servidor',
        command:'SELECT cpu_percent, memory_percent FROM sys.dm_os_performance_counters /* resumo */',
        aliases:['cpu','memoria','memória','performance counters','dm_os_performance_counters'],
        output:'CPU: 31%\nMemória: estável\nPLE: normal para o baseline\nFila de runnable tasks: baixa\n\nNenhum indício de saturação geral.',
        timeCost:3,
        once:true,
        unlocksEvidence:['cpu_normal']
      },
      {
        id:'check_requests',
        kind:'command',
        label:'Consultar requests ativos',
        command:'SELECT session_id, blocking_session_id, wait_type, wait_time FROM sys.dm_exec_requests WHERE blocking_session_id <> 0;',
        aliases:['dm_exec_requests','requests','blocking_session_id','requests ativos'],
        output:'session_id | blocking_session_id | wait_type | wait_time_ms\n64         | 57                  | LCK_M_X   | 18420\n72         | 57                  | LCK_M_U   | 15103\n81         | 64                  | LCK_M_X   | 11987\n\nA cadeia converge para a sessão 57.',
        timeCost:4,
        once:true,
        unlocksEvidence:['requests'],
        setFlags:{blocking_seen:true}
      },
      {
        id:'check_waits',
        kind:'command',
        label:'Inspecionar waiting tasks',
        command:'SELECT session_id, wait_type, blocking_session_id FROM sys.dm_os_waiting_tasks WHERE blocking_session_id IS NOT NULL;',
        aliases:['dm_os_waiting_tasks','waiting tasks','waits','lck_m_x'],
        output:'session_id | wait_type | blocking_session_id\n64         | LCK_M_X  | 57\n72         | LCK_M_U  | 57\n81         | LCK_M_X  | 64\n\nPredomínio de waits de lock. Não há padrão de RESOURCE_SEMAPHORE ou SOS_SCHEDULER_YIELD.',
        timeCost:3,
        once:true,
        unlocksEvidence:['waits']
      },
      {
        id:'check_open_tran',
        kind:'command',
        label:'Procurar transação aberta',
        command:'DBCC OPENTRAN;',
        aliases:['dbcc opentran','opentran','open tran','transação aberta','transacao aberta'],
        output:'Oldest active transaction:\nSPID: 57\nName: user_transaction\nStart time: 13:58:42\n\nA transação antecede o início do incidente.',
        timeCost:4,
        once:true,
        requires:{evidence:['requests']},
        unlocksEvidence:['open_transaction']
      },
      {
        id:'inspect_session57',
        kind:'command',
        label:'Inspecionar a sessão bloqueadora',
        command:'SELECT s.session_id, s.status, s.host_name, s.program_name, s.open_transaction_count FROM sys.dm_exec_sessions s WHERE s.session_id = 57;',
        aliases:['session 57','sessão 57','sessao 57','dm_exec_sessions','spid 57'],
        output:'session_id: 57\nstatus: sleeping\nhost_name: NOTE-OPS-07\nprogram_name: Microsoft SQL Server Management Studio\nopen_transaction_count: 1\nlogin_name: ops_batch\n\nÚltima instrução conhecida: UPDATE Sales.OrderItem SET UnitPrice = ...',
        timeCost:3,
        once:true,
        requires:{evidence:['open_transaction']},
        unlocksEvidence:['session57'],
        setFlags:{root_cause_confirmed:true}
      },
      {
        id:'check_errorlog',
        kind:'command',
        label:'Consultar ERRORLOG',
        command:'EXEC sys.xp_readerrorlog 0, 1;',
        aliases:['errorlog','xp_readerrorlog','log de erro'],
        output:'Nenhum erro de I/O, corrupção, failover ou pressão crítica registrado no período.\n\nA consulta não explica os timeouts.',
        timeCost:4,
        once:true
      },
      {
        id:'wait_five',
        kind:'decision',
        label:'Aguardar mais 5 minutos',
        description:'Não intervir ainda e observar se o problema se resolve sozinho.',
        output:'Cinco minutos se passam. A fila cresce e novos pedidos entram em espera.',
        timeCost:5
      },
      {
        id:'kill_random',
        kind:'decision',
        label:'Encerrar uma sessão bloqueada (SPID 72)',
        description:'Matar uma vítima da cadeia sem remover o bloqueador raiz.',
        output:'A sessão 72 é encerrada. O usuário perde a operação, mas novas sessões continuam bloqueando atrás da 57.',
        timeCost:3,
        once:true,
        requires:{evidence:['requests']},
        setFlags:{killed_victim:true}
      },
      {
        id:'restart_sql',
        kind:'decision',
        danger:true,
        label:'Reiniciar o serviço SQL Server',
        description:'Derrubar todas as conexões para limpar o sintoma imediatamente.',
        output:'O serviço é reiniciado. Todas as conexões são derrubadas. O blocking desaparece, mas expedição e faturamento ficam indisponíveis durante a recuperação.',
        timeCost:12,
        once:true,
        setFlags:{restarted_sql:true}
      },
      {
        id:'kill_blocker',
        kind:'decision',
        label:'Encerrar a sessão 57 após confirmar a transação',
        description:'Interromper o bloqueador identificado, acompanhar rollback e validar a fila.',
        output:'KILL 57 executado. O rollback é acompanhado até concluir. As sessões 64/72/81 deixam a espera e os tempos de resposta retornam ao baseline.',
        timeCost:4,
        once:true,
        requires:{evidence:['requests','open_transaction','session57']},
        setFlags:{correct_resolution:true}
      }
    ],

    evaluate(run,action){
      if(action.id==='restart_sql'){
        return {
          resolved:true,
          state:'resolved_with_outage',
          result:{
            outcome:'mitigated_with_avoidable_outage',
            rootCause:'Transação aberta na sessão 57 mantinha locks e bloqueava a finalização de pedidos.',
            resolution:'Reinício do SQL Server limpou o blocking, mas causou indisponibilidade desnecessária.',
            validation:'Conexões retornaram e os timeouts cessaram após a recuperação do serviço.'
          }
        };
      }
      if(action.id==='kill_blocker'){
        return {
          resolved:true,
          state:'resolved',
          result:{
            outcome:'resolved_by_diagnosis',
            rootCause:'Uma transação manual aberta via SSMS na sessão 57 ficou sleeping com open_transaction_count = 1 e reteve locks sobre dados usados pelo fechamento de pedidos.',
            resolution:'Sessão 57 encerrada após confirmação da causa; rollback acompanhado antes da validação.',
            validation:'Blocking chain zerada e fechamento de pedidos retornou ao tempo normal.'
          }
        };
      }
      return null;
    },

    score(run,Scoring){
      let technical=50,communication=45,architecture=55,business=50;
      if(has(run,'check_requests'))technical+=12;
      if(has(run,'check_waits'))technical+=8;
      if(has(run,'check_open_tran'))technical+=12;
      if(has(run,'inspect_session57'))technical+=15;
      if(has(run,'check_cpu'))technical+=4;
      if(has(run,'talk_support')){communication+=12;business+=5;}
      if(has(run,'talk_operations')){communication+=12;business+=12;}
      if(has(run,'notify_investigation')){communication+=18;business+=7;}
      if(has(run,'kill_blocker')){technical+=10;architecture+=8;business+=12;}
      if(has(run,'kill_random')){technical-=18;business-=18;communication-=5;}
      if(has(run,'restart_sql')){technical-=38;architecture-=35;business-=45;communication-=12;}
      if(count(run,'wait_five'))business-=Math.min(20,count(run,'wait_five')*5);
      if(has(run,'check_errorlog')&&!has(run,'check_requests'))technical-=3;

      const penalty=Scoring.slaPenalty(run.elapsedMinutes,this.slaMinutes);
      business-=penalty;
      const weighted=Scoring.weightedScore({technical,communication,architecture,business});
      return {...weighted,slaPenalty:penalty};
    },

    debrief(run,score){
      const good=[];
      const gaps=[];
      if(has(run,'check_requests'))good.push('Identificou a cadeia de blocking em vez de tratar apenas o sintoma.');
      if(has(run,'check_open_tran')&&has(run,'inspect_session57'))good.push('Confirmou a transação aberta e o contexto da sessão bloqueadora.');
      if(has(run,'notify_investigation'))good.push('Manteve stakeholders informados durante a investigação.');
      if(has(run,'talk_operations'))good.push('Considerou a janela operacional antes de intervir.');
      if(has(run,'kill_blocker'))good.push('Removeu o bloqueador somente depois de reunir evidências suficientes.');

      if(!has(run,'check_waits'))gaps.push('Correlacionar blocking com wait types tornaria o diagnóstico mais robusto.');
      if(!has(run,'notify_investigation'))gaps.push('Faltou atualização formal do incidente enquanto o impacto estava ativo.');
      if(!has(run,'talk_operations'))gaps.push('Faltou validar a criticidade de negócio antes de uma intervenção.');
      if(has(run,'kill_random'))gaps.push('Encerrar uma sessão vítima não remove a causa raiz e ainda perde trabalho do usuário.');
      if(has(run,'restart_sql'))gaps.push('Reiniciar a instância sem necessidade causou indisponibilidade evitável.');
      if(run.elapsedMinutes>this.slaMinutes)gaps.push('A resolução ultrapassou o SLA do cenário.');

      return {
        summary:run.result?.outcome==='resolved_by_diagnosis'
          ? 'Incidente resolvido por diagnóstico orientado a evidências.'
          : 'Sintoma removido, porém com impacto operacional evitável.',
        rootCause:run.result?.rootCause||'Não determinada.',
        strengths:good,
        gaps,
        nextStudy:gaps.length?'Revisar blocking chain, transações abertas e comunicação de incidente.':'Avançar para um cenário de blocking com múltiplos níveis e decisão de rollback.',
        score
      };
    }
  };
});
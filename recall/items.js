(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ForgeRecallItems=api;
})(typeof self!=='undefined'?self:this,function(){
  const items=[
    {
      id:'recall-dba04-01',order:10,trackId:'dba',moduleId:'dba-04',type:'short',
      title:'Blocking chain',
      prompt:'Uma aplicação está lenta. O que você precisa identificar numa blocking chain antes de pensar em matar uma sessão?',
      rubric:[
        'Quem é o bloqueador raiz, não apenas a sessão vítima.',
        'Quais sessões estão esperando e qual wait/lock aparece.',
        'Contexto da transação/sessão bloqueadora antes de intervir.'
      ],
      hint:'Pense em raiz → vítimas → contexto.'
    },
    {
      id:'recall-dba04-02',order:11,trackId:'dba',moduleId:'dba-04',type:'mcq',
      title:'Wait de lock',
      prompt:'Qual wait type é um sinal direto de espera por lock exclusivo no SQL Server?',
      options:[
        {id:'a',text:'SOS_SCHEDULER_YIELD'},
        {id:'b',text:'LCK_M_X'},
        {id:'c',text:'PAGEIOLATCH_SH'},
        {id:'d',text:'RESOURCE_SEMAPHORE'}
      ],
      correctOption:'b',
      explanation:'LCK_M_X indica espera para adquirir um lock exclusivo. Os outros waits apontam para CPU scheduling, I/O ou memory grant.'
    },
    {
      id:'recall-dba04-03',order:12,trackId:'dba',moduleId:'dba-04',type:'short',
      title:'Transação aberta',
      prompt:'Por que uma sessão sleeping ainda pode causar blocking?',
      rubric:[
        'Sleeping descreve ausência de execução ativa naquele instante, não ausência de transação.',
        'Se houver transação aberta, locks podem continuar retidos.',
        'open_transaction_count / DBCC OPENTRAN ajudam a confirmar.'
      ],
      hint:'Sleeping não significa necessariamente “sem locks”.'
    },
    {
      id:'recall-aws01-01',order:20,trackId:'aws',moduleId:'aws-01',type:'mcq',
      title:'FlowFile',
      prompt:'No NiFi, o que melhor descreve um FlowFile?',
      options:[
        {id:'a',text:'Somente o conteúdo JSON retornado pela API.'},
        {id:'b',text:'Conteúdo + atributos/metadados que fluem entre processors.'},
        {id:'c',text:'Uma tabela temporária do NiFi.'},
        {id:'d',text:'O log de execução do processor.'}
      ],
      correctOption:'b',
      explanation:'FlowFile combina conteúdo e atributos; processors manipulam um ou ambos ao longo do fluxo.'
    },
    {
      id:'recall-aws01-02',order:21,trackId:'aws',moduleId:'aws-01',type:'short',
      title:'HTTP status',
      prompt:'Ao consumir Bitrix via InvokeHTTP, por que o status HTTP deve entrar no diagnóstico antes de olhar só o payload?',
      rubric:[
        'O status diferencia sucesso, erro do cliente, autenticação/rate limit e erro do servidor.',
        'Ajuda a decidir relationship/retry/tratamento.',
        'Payload sozinho pode ser vazio, parcial ou conter mensagem pouco confiável sem o contexto do status.'
      ],
      hint:'2xx, 4xx e 5xx mudam a ação operacional.'
    },
    {
      id:'recall-aws01-03',order:22,trackId:'aws',moduleId:'aws-01',type:'mcq',
      title:'Relationships',
      prompt:'Por que conectar relationships corretamente no NiFi importa?',
      options:[
        {id:'a',text:'Porque muda a região AWS do fluxo.'},
        {id:'b',text:'Porque define para onde cada resultado do processor segue ou é tratado.'},
        {id:'c',text:'Porque converte JSON em Parquet automaticamente.'},
        {id:'d',text:'Porque substitui autenticação da API.'}
      ],
      correctOption:'b',
      explanation:'Relationships representam saídas possíveis do processor; precisam ser conectadas ou auto-terminated conscientemente.'
    },
    {
      id:'recall-eng01-01',order:30,trackId:'english',moduleId:'eng-01',type:'mcq',
      title:'There is / There are',
      prompt:'Qual frase descreve corretamente dois buckets?',
      options:[
        {id:'a',text:'There is two buckets in the architecture.'},
        {id:'b',text:'There are two buckets in the architecture.'},
        {id:'c',text:'There be two buckets in the architecture.'},
        {id:'d',text:'There has two buckets in the architecture.'}
      ],
      correctOption:'b',
      explanation:'Use “there are” com substantivo plural: two buckets.'
    },
    {
      id:'recall-eng02-01',order:31,trackId:'english',moduleId:'eng-02',type:'short',
      title:'Simple Present técnico',
      prompt:'Escreva em inglês uma frase curta documentando que o pipeline lê dados do Bitrix e envia os arquivos para o S3.',
      rubric:[
        'Usa Simple Present para comportamento habitual/documentação.',
        'Exemplo aceitável: “The pipeline reads data from Bitrix and sends the files to S3.”',
        'Verbos na 3ª pessoa singular recebem -s porque o sujeito é “the pipeline”.'
      ],
      hint:'The pipeline ... data ... and ... the files ...'
    },
    {
      id:'recall-eng08-01',order:32,trackId:'english',moduleId:'eng-08',type:'mcq',
      title:'Pergunta de diagnóstico',
      prompt:'Qual pergunta é mais natural para investigar quando o erro começou?',
      options:[
        {id:'a',text:'When did the error start?'},
        {id:'b',text:'When the error did start?'},
        {id:'c',text:'When does the error started?'},
        {id:'d',text:'When started the error did?'}
      ],
      correctOption:'a',
      explanation:'No Simple Past interrogativo: question word + did + subject + base verb.'
    }
  ];

  const get=id=>items.find(x=>x.id===id)||null;
  const byTrack=id=>items.filter(x=>x.trackId===id);
  const byModule=(trackId,moduleId)=>items.filter(x=>x.trackId===trackId&&x.moduleId===moduleId);
  return {items,get,byTrack,byModule};
});
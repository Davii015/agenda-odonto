function processarAutomacoes() {
  return comBloqueio_(() => {
    garantirEstrutura_();
    const pacientes = ordenarPacientes_(obterPacientes_());
    const agora = new Date();
    const resumo = {
      confirmacoesSemanais: processarConfirmacoesSemanais_(pacientes, agora),
      lembretes24h: processarLembretes24h_(pacientes, agora),
      lembretes1h: processarLembretes1h_(pacientes, agora)
    };
    console.log(JSON.stringify(resumo));
    return respostaSucesso_('Automações processadas.', resumo);
  });
}

function processarConfirmacoesSemanais_(pacientes, agora, ignorarDiaSemana) {
  const config = getConfig_();
  if (indiceDiaSemana_(agora) !== 1 && ignorarDiaSemana !== true) return 0;

  const limite = new Date(agora.getTime() + config.DIAS_CONFIRMACAO * 24 * 60 * 60 * 1000);
  let enviados = 0;

  pacientes.forEach(paciente => {
    if (paciente.status === 'Cancelado' || paciente.confirmacaoSemanalEnviada === 'SIM') return;
    const consulta = criarDataConsulta_(paciente.dataConsulta, paciente.horario);
    if (consulta <= agora || consulta > limite) return;

    const mensagem = montarMensagemConfirmacao_(paciente, consulta, config);
    enviarMensagemWhatsApp(paciente.telefone, mensagem, 'CONFIRMACAO_SEMANAL', paciente);
    const campos = {
      confirmacaoSemanalEnviada: 'SIM',
      dataConfirmacaoSemanal: agoraFormatado_()
    };
    if (paciente.status === 'Agendado') campos.status = 'Aguardando confirmação';
    atualizarCamposAutomacao_(paciente.id, campos);
    enviados += 1;
  });
  return enviados;
}

/**
 * Auxiliar explícito de desenvolvimento. Permite validar a confirmação semanal
 * em qualquer dia, mas somente enquanto MODO_TESTE estiver ativo.
 */
function testarConfirmacaoSemanal() {
  if (!getConfig_().MODO_TESTE) throw new Error('O teste semanal só pode ser executado em MODO_TESTE.');
  return comBloqueio_(() => {
    const quantidade = processarConfirmacoesSemanais_(ordenarPacientes_(obterPacientes_()), new Date(), true);
    return respostaSucesso_(`${quantidade} confirmação(ões) semanal(is) simulada(s).`, { confirmacoesSemanais: quantidade });
  });
}

function processarLembretes24h_(pacientes, agora) {
  const config = getConfig_();
  return processarJanelaDeLembrete_(pacientes, agora, {
    flag: 'lembrete24hEnviado',
    campoData: 'dataLembrete24h',
    minutosAlvo: config.MINUTOS_LEMBRETE_24H,
    tolerancia: config.TOLERANCIA_LEMBRETE_24H,
    tipo: 'LEMBRETE_24H',
    montarMensagem: montarMensagemLembrete24h_
  });
}

function processarLembretes1h_(pacientes, agora) {
  const config = getConfig_();
  return processarJanelaDeLembrete_(pacientes, agora, {
    flag: 'lembrete1hEnviado',
    campoData: 'dataLembrete1h',
    minutosAlvo: config.MINUTOS_LEMBRETE_1H,
    tolerancia: config.TOLERANCIA_LEMBRETE_1H,
    tipo: 'LEMBRETE_1H',
    montarMensagem: montarMensagemLembrete1h_
  });
}

function processarJanelaDeLembrete_(pacientes, agora, regra) {
  let enviados = 0;
  pacientes.forEach(paciente => {
    if (paciente.status === 'Cancelado' || paciente[regra.flag] === 'SIM') return;
    const consulta = criarDataConsulta_(paciente.dataConsulta, paciente.horario);
    const minutosAteConsulta = (consulta.getTime() - agora.getTime()) / 60000;
    const minimo = regra.minutosAlvo - regra.tolerancia;
    const maximo = regra.minutosAlvo + regra.tolerancia;
    if (minutosAteConsulta < minimo || minutosAteConsulta > maximo) return;

    const mensagem = regra.montarMensagem(paciente);
    enviarMensagemWhatsApp(paciente.telefone, mensagem, regra.tipo, paciente);
    atualizarCamposAutomacao_(paciente.id, {
      [regra.flag]: 'SIM',
      [regra.campoData]: agoraFormatado_()
    });
    enviados += 1;
  });
  return enviados;
}

function montarMensagemConfirmacao_(paciente, consulta, config) {
  return `Olá, ${primeiroNome_(paciente.nome)}! Tudo bem? Sou a Dra. ${config.NOME_DENTISTA}, da clínica odontológica da ${config.NOME_FACULDADE}.\n\n` +
    `Estou entrando em contato para confirmar seu atendimento agendado para ${nomeDiaSemana_(consulta)}, dia ${formatarDataBrasileira_(paciente.dataConsulta)}, às ${paciente.horario}.\n\n` +
    'Você poderia confirmar sua presença, por favor?';
}

function montarMensagemLembrete24h_(paciente) {
  return `Olá, ${primeiroNome_(paciente.nome)}! 🦷\n\n` +
    `Passando para lembrar que seu atendimento está marcado para amanhã, às ${paciente.horario}.\n\nAté amanhã!`;
}

function montarMensagemLembrete1h_(paciente) {
  return `Olá, ${primeiroNome_(paciente.nome)}! 😊\n\n` +
    `Passando para lembrar que seu atendimento está marcado para daqui a aproximadamente 1 hora, às ${paciente.horario}.\n\nAté logo!`;
}

function criarGatilhos() {
  const existentes = ScriptApp.getProjectTriggers();
  const gatilhosDaFuncao = existentes.filter(gatilho => gatilho.getHandlerFunction() === 'processarAutomacoes');
  gatilhosDaFuncao.slice(1).forEach(gatilho => ScriptApp.deleteTrigger(gatilho));

  if (gatilhosDaFuncao.length === 0) {
    ScriptApp.newTrigger('processarAutomacoes').timeBased().everyMinutes(5).create();
    return respostaSucesso_('Gatilho criado para executar a cada 5 minutos.');
  }
  return respostaSucesso_('O gatilho de automação já estava configurado.');
}

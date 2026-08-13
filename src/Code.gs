function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Agenda Odonto')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function include(nomeArquivo) {
  return HtmlService.createHtmlOutputFromFile(nomeArquivo).getContent();
}

function setup() {
  const planilha = garantirEstrutura_(true);
  const verificacao = verificarConfiguracoes_();
  const gatilho = criarGatilhos();
  return respostaSucesso_('Agenda Odonto configurada com sucesso.', {
    planilhaId: planilha.getId(),
    planilhaUrl: planilha.getUrl(),
    configuracoes: verificacao,
    gatilho: gatilho.mensagem
  });
}

function verificarConfiguracoes_() {
  const config = getConfig_();
  if (config.TIMEZONE !== 'America/Sao_Paulo') throw new Error('O timezone deve ser America/Sao_Paulo.');
  if (!config.MODO_TESTE) throw new Error('Esta versão deve permanecer em MODO_TESTE.');
  return getConfiguracoesPublicas_();
}

function obterDadosAplicacao() {
  garantirEstrutura_();
  const pacientes = ordenarPacientes_(obterPacientes_()).map(limparCamposInternos_);
  return {
    pacientes,
    logs: obterLogs_(250),
    configuracoes: getConfiguracoesPublicas_(),
    statusDisponiveis: STATUS_PACIENTES.slice(),
    servidorAgora: agoraFormatado_()
  };
}

function listarPacientes() {
  return ordenarPacientes_(obterPacientes_()).map(limparCamposInternos_);
}

function listarLogs(limite) {
  return obterLogs_(limite);
}

function importarPacientes(texto) {
  const linhas = String(texto || '').split(/\r?\n/);
  const validos = [];
  const erros = [];

  linhas.forEach((linhaOriginal, indice) => {
    const numeroLinha = indice + 1;
    const linha = linhaOriginal.trim();
    if (!linha) return;
    const campos = linha.split(';').map(item => item.trim());
    if (campos.length !== 4) {
      erros.push({ linha: numeroLinha, conteudo: linhaOriginal, erro: 'Use 4 campos separados por ponto e vírgula.' });
      return;
    }
    try {
      const paciente = {
        nome: textoSeguro_(campos[0], 150),
        telefone: normalizarTelefone_(campos[1]),
        dataConsulta: normalizarData_(campos[2]),
        horario: normalizarHorario_(campos[3])
      };
      if (!paciente.nome || paciente.nome.length < 2) throw new Error('Nome inválido.');
      criarDataConsulta_(paciente.dataConsulta, paciente.horario);
      validos.push({ numeroLinha, paciente });
    } catch (erro) {
      erros.push({ linha: numeroLinha, conteudo: linhaOriginal, erro: erro.message });
    }
  });

  if (validos.length === 0) {
    return respostaSucesso_('Nenhum paciente foi importado.', { importados: 0, erros });
  }

  comBloqueio_(() => {
    const agora = agoraFormatado_();
    const registros = validos.map(item => pacienteParaLinha_({
      id: gerarId_('PAC'),
      ...item.paciente,
      status: 'Agendado',
      confirmacaoSemanalEnviada: 'NÃO',
      lembrete24hEnviado: 'NÃO',
      lembrete1hEnviado: 'NÃO',
      dataCadastro: agora,
      ultimaAtualizacao: agora
    }));
    const aba = garantirEstrutura_().getSheetByName(ABAS.PACIENTES);
    aba.getRange(aba.getLastRow() + 1, 1, registros.length, CABECALHOS_PACIENTES.length).setValues(registros);
  });

  return respostaSucesso_(`${validos.length} paciente(s) importado(s).`, { importados: validos.length, erros });
}

function gerarPacientesFicticios() {
  return comBloqueio_(() => {
    const agora = new Date();
    const cenarios = [
      { nome: 'Teste Daqui a 30 Minutos', minutos: 30, status: 'Agendado' },
      { nome: 'Teste Daqui a 1 Hora', minutos: 60, status: 'Confirmado' },
      { nome: 'Teste Daqui a 24 Horas', minutos: 1440, status: 'Confirmado' },
      { nome: 'Teste Daqui a 3 Dias', minutos: 4320, status: 'Agendado' },
      { nome: 'Teste Cancelado', minutos: 4380, status: 'Cancelado' }
    ];
    const momentoCadastro = agoraFormatado_();
    const registros = cenarios.map((cenario, indice) => {
      const consulta = new Date(agora.getTime() + cenario.minutos * 60000);
      return pacienteParaLinha_({
        id: gerarId_('PAC-TESTE'),
        nome: cenario.nome,
        telefone: `55629999000${indice}`,
        dataConsulta: formatarDataIso_(consulta),
        horario: formatarHorario_(consulta),
        status: cenario.status,
        confirmacaoSemanalEnviada: 'NÃO',
        lembrete24hEnviado: 'NÃO',
        lembrete1hEnviado: 'NÃO',
        dataCadastro: momentoCadastro,
        ultimaAtualizacao: momentoCadastro
      });
    });
    const aba = garantirEstrutura_().getSheetByName(ABAS.PACIENTES);
    aba.getRange(aba.getLastRow() + 1, 1, registros.length, CABECALHOS_PACIENTES.length).setValues(registros);
    return respostaSucesso_('5 pacientes fictícios criados. Execute processarAutomacoes() para testar os lembretes.', { criados: 5 });
  });
}

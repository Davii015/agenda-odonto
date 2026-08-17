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
  return executarEndpoint_('configurar a Agenda Odonto', () => {
    const planilha = garantirEstrutura_(true);
    const verificacao = verificarConfiguracoes_();
    const gatilho = criarGatilhos_();
    return respostaSucesso_('Agenda Odonto configurada com sucesso.', {
      planilhaId: planilha.getId(),
      planilhaUrl: planilha.getUrl(),
      configuracoes: verificacao,
      gatilho: gatilho.mensagem
    });
  });
}

function verificarConfiguracoes_() {
  const config = getConfig_();
  if (config.TIMEZONE !== 'America/Sao_Paulo') throw new Error('O timezone deve ser America/Sao_Paulo.');
  if (!config.MODO_TESTE) throw new Error('Esta versão deve permanecer em MODO_TESTE.');
  return getConfiguracoesPublicas_();
}

function obterDadosAplicacao() {
  return executarEndpoint_('carregar a agenda', () => {
    garantirEstrutura_();
    return respostaSucesso_('Dados carregados.', {
      pacientes: ordenarPacientes_(obterPacientes_()).map(limparCamposInternos_),
      logs: obterLogs_(250),
      configuracoes: getConfiguracoesPublicas_(),
      statusDisponiveis: STATUS_PACIENTES.slice(),
      servidorAgora: agoraFormatado_()
    });
  });
}

function listarPacientes() {
  return executarEndpoint_('listar os pacientes', () =>
    respostaSucesso_('Pacientes carregados.', ordenarPacientes_(obterPacientes_()).map(limparCamposInternos_)));
}

function listarLogs(limite) {
  return executarEndpoint_('listar os logs', () => respostaSucesso_('Logs carregados.', obterLogs_(limite)));
}

function importarPacientes(texto) {
  return executarEndpoint_('importar os pacientes', () => {
    const linhas = String(texto || '').split(/\r?\n/);
    const candidatos = [];
    const erros = [];

    linhas.forEach((linhaOriginal, indice) => {
      const numeroLinha = indice + 1;
      const linha = linhaOriginal.trim();
      if (!linha) return;
      const campos = linha.split(';').map(item => item.trim());
      if (campos.length !== 4) {
        erros.push({ linha: numeroLinha, erro: 'Use 4 campos separados por ponto e vírgula.' });
        return;
      }
      try {
        const paciente = {
          nome: validarNome_(campos[0]),
          telefone: normalizarTelefone_(campos[1]),
          dataConsulta: normalizarData_(campos[2]),
          horario: normalizarHorario_(campos[3])
        };
        criarDataConsulta_(paciente.dataConsulta, paciente.horario);
        candidatos.push({ numeroLinha, paciente });
      } catch (erro) {
        erros.push({ linha: numeroLinha, erro: erro.message });
      }
    });

    const importados = comBloqueio_(() => {
      const existentes = obterPacientes_();
      const aceitos = [];
      candidatos.forEach(item => {
        const universo = existentes.concat(aceitos.map(aceito => aceito.paciente));
        if (universo.some(paciente => ehDuplicadoExato_(paciente, item.paciente))) {
          erros.push({ linha: item.numeroLinha, erro: 'Possível duplicidade: mesmo WhatsApp, data e horário.' });
          return;
        }
        aceitos.push(item);
      });

      if (aceitos.length === 0) return 0;
      const agora = agoraFormatado_();
      const registros = aceitos.map(item => pacienteParaLinha_({
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
      return registros.length;
    });

    const mensagem = importados ? `${importados} paciente(s) importado(s).` : 'Nenhum paciente foi importado.';
    return respostaSucesso_(mensagem, { importados, erros });
  });
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

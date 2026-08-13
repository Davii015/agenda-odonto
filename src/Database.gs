const ABAS = Object.freeze({ PACIENTES: 'Pacientes', LOGS: 'Logs' });

const CABECALHOS_PACIENTES = Object.freeze([
  'ID', 'Nome', 'Telefone', 'Data da consulta', 'Horário', 'Status',
  'Confirmação semanal enviada', 'Data/hora da confirmação semanal',
  'Lembrete 24h enviado', 'Data/hora do lembrete 24h',
  'Lembrete 1h enviado', 'Data/hora do lembrete 1h',
  'Data de cadastro', 'Última atualização'
]);

const CABECALHOS_LOGS = Object.freeze([
  'ID', 'Data/hora', 'Paciente ID', 'Paciente', 'Telefone',
  'Tipo da mensagem', 'Conteúdo', 'Status', 'Detalhes'
]);

function getPlanilha_() {
  const propriedades = PropertiesService.getScriptProperties();
  const idSalvo = propriedades.getProperty('SPREADSHEET_ID');
  if (idSalvo) return SpreadsheetApp.openById(idSalvo);

  const ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (!ativa) {
    throw new Error('Planilha não vinculada. Vincule o projeto a uma Google Sheets ou defina SPREADSHEET_ID nas propriedades do script.');
  }
  propriedades.setProperty('SPREADSHEET_ID', ativa.getId());
  return ativa;
}

function garantirEstrutura_(aplicarFormatacao) {
  const planilha = getPlanilha_();
  const pacientes = garantirAba_(planilha, ABAS.PACIENTES, CABECALHOS_PACIENTES);
  const logs = garantirAba_(planilha, ABAS.LOGS, CABECALHOS_LOGS);
  if (aplicarFormatacao === true) {
    formatarAbaPacientes_(pacientes);
    formatarAbaLogs_(logs);
  }
  return planilha;
}

function garantirAba_(planilha, nome, cabecalhos) {
  let aba = planilha.getSheetByName(nome);
  if (!aba) aba = planilha.insertSheet(nome);

  const precisaCabecalho = aba.getLastRow() === 0 || aba.getRange(1, 1, 1, cabecalhos.length).getValues()[0].every(valor => !valor);
  if (precisaCabecalho) {
    aba.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  } else {
    const atuais = aba.getRange(1, 1, 1, cabecalhos.length).getDisplayValues()[0];
    if (atuais.join('|') !== cabecalhos.join('|')) {
      throw new Error(`A aba ${nome} possui cabeçalhos diferentes do esperado. Faça uma cópia antes de corrigir a estrutura.`);
    }
  }
  aba.setFrozenRows(1);
  aba.getRange(1, 1, 1, cabecalhos.length)
    .setBackground('#1479c9')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setVerticalAlignment('middle');
  return aba;
}

function formatarAbaPacientes_(aba) {
  aba.getRange('A:A').setNumberFormat('@');
  aba.getRange('C:E').setNumberFormat('@');
  aba.getRange('G:N').setNumberFormat('@');
  aba.setColumnWidth(1, 270);
  aba.setColumnWidth(2, 220);
  aba.setColumnWidth(3, 140);
  aba.setColumnWidth(4, 125);
  aba.setColumnWidth(5, 90);
  aba.setColumnWidth(6, 190);
  for (let coluna = 7; coluna <= 14; coluna += 1) aba.setColumnWidth(coluna, 190);

  const regraStatus = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_PACIENTES, true)
    .setAllowInvalid(false)
    .build();
  aba.getRange(2, 6, Math.max(aba.getMaxRows() - 1, 1), 1).setDataValidation(regraStatus);
}

function formatarAbaLogs_(aba) {
  aba.getRange('A:I').setNumberFormat('@');
  aba.setColumnWidth(1, 270);
  aba.setColumnWidth(2, 165);
  aba.setColumnWidth(3, 270);
  aba.setColumnWidth(4, 220);
  aba.setColumnWidth(5, 140);
  aba.setColumnWidth(6, 210);
  aba.setColumnWidth(7, 520);
  aba.setColumnWidth(8, 120);
  aba.setColumnWidth(9, 280);
  aba.getRange('G:G').setWrap(true);
}

function linhaParaPaciente_(linha, numeroLinha) {
  return {
    id: String(linha[0] || ''),
    nome: String(linha[1] || ''),
    telefone: String(linha[2] || ''),
    dataConsulta: String(linha[3] || ''),
    horario: String(linha[4] || ''),
    status: String(linha[5] || ''),
    confirmacaoSemanalEnviada: String(linha[6] || ''),
    dataConfirmacaoSemanal: String(linha[7] || ''),
    lembrete24hEnviado: String(linha[8] || ''),
    dataLembrete24h: String(linha[9] || ''),
    lembrete1hEnviado: String(linha[10] || ''),
    dataLembrete1h: String(linha[11] || ''),
    dataCadastro: String(linha[12] || ''),
    ultimaAtualizacao: String(linha[13] || ''),
    _linha: numeroLinha
  };
}

function pacienteParaLinha_(paciente) {
  return [
    paciente.id, paciente.nome, paciente.telefone, paciente.dataConsulta, paciente.horario, paciente.status,
    paciente.confirmacaoSemanalEnviada || 'NÃO', paciente.dataConfirmacaoSemanal || '',
    paciente.lembrete24hEnviado || 'NÃO', paciente.dataLembrete24h || '',
    paciente.lembrete1hEnviado || 'NÃO', paciente.dataLembrete1h || '',
    paciente.dataCadastro, paciente.ultimaAtualizacao
  ];
}

function obterPacientes_() {
  const aba = garantirEstrutura_().getSheetByName(ABAS.PACIENTES);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return [];
  return aba.getRange(2, 1, ultimaLinha - 1, CABECALHOS_PACIENTES.length)
    .getDisplayValues()
    .map((linha, indice) => linhaParaPaciente_(linha, indice + 2))
    .filter(paciente => paciente.id);
}

function ordenarPacientes_(pacientes) {
  return pacientes.sort((a, b) => `${a.dataConsulta} ${a.horario}`.localeCompare(`${b.dataConsulta} ${b.horario}`, 'pt-BR'));
}

function criarPaciente(dados) {
  return comBloqueio_(() => {
    validarObjeto_(dados, 'Dados do paciente inválidos.');
    const agora = agoraFormatado_();
    const paciente = {
      id: gerarId_('PAC'),
      nome: textoSeguro_(dados.nome, 150),
      telefone: normalizarTelefone_(dados.telefone),
      dataConsulta: normalizarData_(dados.dataConsulta),
      horario: normalizarHorario_(dados.horario),
      status: 'Agendado',
      confirmacaoSemanalEnviada: 'NÃO',
      lembrete24hEnviado: 'NÃO',
      lembrete1hEnviado: 'NÃO',
      dataCadastro: agora,
      ultimaAtualizacao: agora
    };
    if (!paciente.nome || paciente.nome.length < 2) throw new Error('Informe o nome completo do paciente.');
    criarDataConsulta_(paciente.dataConsulta, paciente.horario);

    const aba = garantirEstrutura_().getSheetByName(ABAS.PACIENTES);
    aba.appendRow(pacienteParaLinha_(paciente));
    return respostaSucesso_('Agendamento cadastrado com sucesso.', limparCamposInternos_(paciente));
  });
}

function atualizarPaciente(id, dados) {
  return comBloqueio_(() => {
    const pacienteId = textoSeguro_(id, 100);
    validarObjeto_(dados, 'Dados do paciente inválidos.');
    const aba = garantirEstrutura_().getSheetByName(ABAS.PACIENTES);
    const pacientes = obterPacientes_();
    const atual = pacientes.find(paciente => paciente.id === pacienteId);
    if (!atual) throw new Error('Agendamento não encontrado.');

    const atualizado = {
      ...atual,
      nome: textoSeguro_(dados.nome, 150),
      telefone: normalizarTelefone_(dados.telefone),
      dataConsulta: normalizarData_(dados.dataConsulta),
      horario: normalizarHorario_(dados.horario),
      status: validarStatus_(dados.status),
      ultimaAtualizacao: agoraFormatado_()
    };
    if (!atualizado.nome || atualizado.nome.length < 2) throw new Error('Informe o nome completo do paciente.');
    criarDataConsulta_(atualizado.dataConsulta, atualizado.horario);

    // Alterar data ou horário permite que as automações sejam executadas para o novo agendamento.
    if (atual.dataConsulta !== atualizado.dataConsulta || atual.horario !== atualizado.horario) {
      atualizado.confirmacaoSemanalEnviada = 'NÃO';
      atualizado.dataConfirmacaoSemanal = '';
      atualizado.lembrete24hEnviado = 'NÃO';
      atualizado.dataLembrete24h = '';
      atualizado.lembrete1hEnviado = 'NÃO';
      atualizado.dataLembrete1h = '';
    }

    aba.getRange(atual._linha, 1, 1, CABECALHOS_PACIENTES.length).setValues([pacienteParaLinha_(atualizado)]);
    return respostaSucesso_('Agendamento atualizado.', limparCamposInternos_(atualizado));
  });
}

function excluirPaciente(id) {
  return comBloqueio_(() => {
    const pacienteId = textoSeguro_(id, 100);
    const aba = garantirEstrutura_().getSheetByName(ABAS.PACIENTES);
    const paciente = obterPacientes_().find(item => item.id === pacienteId);
    if (!paciente) throw new Error('Agendamento não encontrado.');
    aba.deleteRow(paciente._linha);
    return respostaSucesso_('Agendamento excluído.');
  });
}

function atualizarCamposAutomacao_(pacienteId, campos) {
  const aba = garantirEstrutura_().getSheetByName(ABAS.PACIENTES);
  const paciente = obterPacientes_().find(item => item.id === pacienteId);
  if (!paciente) throw new Error(`Paciente ${pacienteId} não encontrado durante a automação.`);
  const atualizado = { ...paciente, ...campos, ultimaAtualizacao: agoraFormatado_() };
  aba.getRange(paciente._linha, 1, 1, CABECALHOS_PACIENTES.length).setValues([pacienteParaLinha_(atualizado)]);
}

function registrarLog_(paciente, tipo, conteudo, status, detalhes) {
  const aba = garantirEstrutura_().getSheetByName(ABAS.LOGS);
  aba.appendRow([
    gerarId_('LOG'), agoraFormatado_(), paciente.id || '', paciente.nome || '', paciente.telefone || '',
    tipo, conteudo, status, detalhes || ''
  ]);
}

function obterLogs_(limite) {
  const aba = garantirEstrutura_().getSheetByName(ABAS.LOGS);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return [];
  const quantidade = Math.min(Math.max(Number(limite) || 200, 1), 1000, ultimaLinha - 1);
  const primeiraLinha = ultimaLinha - quantidade + 1;
  return aba.getRange(primeiraLinha, 1, quantidade, CABECALHOS_LOGS.length)
    .getDisplayValues()
    .reverse()
    .map(linha => ({
      id: linha[0], dataHora: linha[1], pacienteId: linha[2], paciente: linha[3], telefone: linha[4],
      tipo: linha[5], conteudo: linha[6], status: linha[7], detalhes: linha[8]
    }));
}

function limparCamposInternos_(paciente) {
  const copia = { ...paciente };
  delete copia._linha;
  return copia;
}

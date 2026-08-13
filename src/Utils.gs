const STATUS_PACIENTES = Object.freeze([
  'Agendado',
  'Aguardando confirmação',
  'Confirmado',
  'Cancelado',
  'Atendido',
  'Faltou'
]);

function parseBoolean_(valor, padrao) {
  if (valor === null || valor === undefined || valor === '') return padrao;
  return String(valor).toLowerCase() === 'true';
}

function parseNumber_(valor, padrao) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function inteiroEntre_(valor, minimo, maximo, rotulo) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new Error(`${rotulo} deve ser um número inteiro entre ${minimo} e ${maximo}.`);
  }
  return numero;
}

function validarObjeto_(valor, mensagem) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new Error(mensagem);
}

function textoSeguro_(valor, tamanhoMaximo) {
  return String(valor === null || valor === undefined ? '' : valor)
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, tamanhoMaximo);
}

function normalizarTelefone_(telefone) {
  let digitos = String(telefone || '').replace(/\D/g, '');
  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  if (!/^55\d{10,11}$/.test(digitos)) {
    throw new Error('WhatsApp inválido. Informe DDD e número, por exemplo (62) 99999-9999.');
  }
  return digitos;
}

function normalizarData_(valor) {
  const texto = String(valor || '').trim();
  let ano;
  let mes;
  let dia;
  let partes;

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    partes = texto.split('-').map(Number);
    [ano, mes, dia] = partes;
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    partes = texto.split('/').map(Number);
    [dia, mes, ano] = partes;
  } else {
    throw new Error('Data inválida. Use o formato DD/MM/AAAA.');
  }

  const teste = new Date(Date.UTC(ano, mes - 1, dia));
  if (teste.getUTCFullYear() !== ano || teste.getUTCMonth() !== mes - 1 || teste.getUTCDate() !== dia) {
    throw new Error('Data da consulta inválida.');
  }
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function normalizarHorario_(valor) {
  const texto = String(valor || '').trim();
  const correspondencia = texto.match(/^(\d{1,2}):(\d{2})$/);
  if (!correspondencia) throw new Error('Horário inválido. Use o formato HH:MM.');
  const horas = Number(correspondencia[1]);
  const minutos = Number(correspondencia[2]);
  if (horas > 23 || minutos > 59) throw new Error('Horário da consulta inválido.');
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function validarStatus_(status) {
  const valor = String(status || '').trim();
  if (!STATUS_PACIENTES.includes(valor)) throw new Error('Status inválido.');
  return valor;
}

function criarDataConsulta_(data, horario) {
  return Utilities.parseDate(
    `${normalizarData_(data)} ${normalizarHorario_(horario)}:00`,
    getConfig_().TIMEZONE,
    'yyyy-MM-dd HH:mm:ss'
  );
}

function agoraFormatado_() {
  return Utilities.formatDate(new Date(), getConfig_().TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function formatarDataHora_(data) {
  return Utilities.formatDate(data, getConfig_().TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function formatarDataIso_(data) {
  return Utilities.formatDate(data, getConfig_().TIMEZONE, 'yyyy-MM-dd');
}

function formatarHorario_(data) {
  return Utilities.formatDate(data, getConfig_().TIMEZONE, 'HH:mm');
}

function formatarDataBrasileira_(dataIso) {
  const [ano, mes, dia] = normalizarData_(dataIso).split('-');
  return `${dia}/${mes}/${ano}`;
}

function nomeDiaSemana_(data) {
  const nomes = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const indice = indiceDiaSemana_(data);
  return nomes[indice];
}

function indiceDiaSemana_(data) {
  const [ano, mes, dia] = Utilities.formatDate(data, getConfig_().TIMEZONE, 'yyyy-MM-dd').split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

function primeiroNome_(nome) {
  return textoSeguro_(nome, 100).split(' ')[0] || 'paciente';
}

function respostaSucesso_(mensagem, dados) {
  return { sucesso: true, mensagem, dados: dados === undefined ? null : dados };
}

function comBloqueio_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function gerarId_(prefixo) {
  return `${prefixo}-${Utilities.getUuid()}`;
}

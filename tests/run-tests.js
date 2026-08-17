'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
let uuid = 0;

class RangeMock {
  constructor(sheet, row, column, rows, columns) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rows = rows;
    this.columns = columns;
  }
  getValues() { return this.getDisplayValues(); }
  getDisplayValues() {
    return Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.columns }, (_, c) => String(this.sheet.cell(this.row + r, this.column + c) ?? '')));
  }
  setValues(values) {
    assert.strictEqual(values.length, this.rows);
    values.forEach((line, r) => {
      assert.strictEqual(line.length, this.columns);
      line.forEach((value, c) => this.sheet.setCell(this.row + r, this.column + c, value));
    });
    return this;
  }
  setBackground() { return this; }
  setFontColor() { return this; }
  setFontWeight() { return this; }
  setVerticalAlignment() { return this; }
  setNumberFormat() { return this; }
  setDataValidation() { return this; }
  setWrap() { return this; }
}

class SheetMock {
  constructor(name) { this.name = name; this.data = []; }
  cell(row, column) { return (this.data[row - 1] || [])[column - 1] ?? ''; }
  setCell(row, column, value) {
    while (this.data.length < row) this.data.push([]);
    while (this.data[row - 1].length < column) this.data[row - 1].push('');
    this.data[row - 1][column - 1] = value;
  }
  getLastRow() {
    for (let index = this.data.length - 1; index >= 0; index -= 1) {
      if ((this.data[index] || []).some(value => value !== '' && value !== null)) return index + 1;
    }
    return 0;
  }
  getMaxRows() { return Math.max(this.data.length, 1000); }
  getRange(row, column, rows, columns) {
    if (typeof row === 'string') {
      const match = row.match(/^([A-Z]+):([A-Z]+)$/);
      assert(match, `Intervalo A1 não suportado no teste: ${row}`);
      const toColumn = letters => letters.split('').reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0);
      const start = toColumn(match[1]);
      const end = toColumn(match[2]);
      return new RangeMock(this, 1, start, this.getMaxRows(), end - start + 1);
    }
    return new RangeMock(this, row, column, rows, columns);
  }
  appendRow(values) { this.getRange(this.getLastRow() + 1, 1, 1, values.length).setValues([values]); }
  deleteRow(row) { this.data.splice(row - 1, 1); }
  setFrozenRows() {}
  setColumnWidth() {}
}

class SpreadsheetMock {
  constructor() { this.sheets = new Map(); }
  getId() { return 'spreadsheet-test-id'; }
  getUrl() { return 'https://docs.google.com/spreadsheets/d/test'; }
  getSheetByName(name) { return this.sheets.get(name) || null; }
  insertSheet(name) { const sheet = new SheetMock(name); this.sheets.set(name, sheet); return sheet; }
}

const spreadsheet = new SpreadsheetMock();
const properties = new Map();
const triggers = [];
const scriptProperties = {
  getProperty: key => properties.has(key) ? properties.get(key) : null,
  setProperty: (key, value) => properties.set(key, String(value)),
  setProperties: values => Object.entries(values).forEach(([key, value]) => properties.set(key, String(value)))
};

function dateParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return parts;
}

function formatDate(date, timezone, pattern) {
  assert.strictEqual(timezone, 'America/Sao_Paulo');
  const p = dateParts(date);
  return pattern
    .replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day)
    .replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
}

const context = vm.createContext({
  console: { log: console.log, error() {} },
  Date,
  Intl,
  Math,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Set,
  Error,
  PropertiesService: { getScriptProperties: () => scriptProperties },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: {
    getUuid: () => `00000000-0000-4000-8000-${String(++uuid).padStart(12, '0')}`,
    formatDate,
    parseDate: value => new Date(`${value.replace(' ', 'T')}-03:00`)
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => spreadsheet,
    openById: () => spreadsheet,
    newDataValidation: () => ({ requireValueInList() { return this; }, setAllowInvalid() { return this; }, build() { return {}; } })
  },
  ScriptApp: {
    getProjectTriggers: () => triggers.slice(),
    deleteTrigger: trigger => triggers.splice(triggers.indexOf(trigger), 1),
    newTrigger: handler => ({
      timeBased() { return this; }, everyMinutes(minutes) { this.minutes = minutes; return this; },
      create() {
        const id = `trigger-${triggers.length + 1}`;
        const trigger = { getHandlerFunction: () => handler, getUniqueId: () => id, minutes: this.minutes };
        triggers.push(trigger);
        return trigger;
      }
    })
  },
  HtmlService: {
    createTemplateFromFile: () => ({ evaluate: () => ({ setTitle() { return this; }, addMetaTag() { return this; } }) }),
    createHtmlOutputFromFile: () => ({ getContent: () => '' })
  }
});

[
  'Config.gs', 'Utils.gs', 'Database.gs', 'WhatsAppService.gs', 'Automation.gs', 'Code.gs'
].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, 'src', file), 'utf8'), context, { filename: file }));

let passed = 0;
function test(name, callback) {
  callback();
  passed += 1;
  console.log(`✓ ${name}`);
}

test('setup é idempotente e não duplica gatilhos', () => {
  assert.strictEqual(context.setup().sucesso, true);
  assert.strictEqual(context.setup().sucesso, true);
  assert.deepStrictEqual([...spreadsheet.sheets.keys()], ['Pacientes', 'Logs']);
  assert.strictEqual(triggers.length, 1);
  assert.strictEqual(triggers[0].minutes, 5);
});

test('cadastro normaliza telefone, usa UUID e avisa duplicidade', () => {
  const dados = { nome: 'Paciente Teste 01', telefone: '(62) 99999-0001', dataConsulta: '2026-08-20', horario: '14:00' };
  const criado = context.criarPaciente(dados);
  assert.strictEqual(criado.sucesso, true);
  assert.match(criado.dados.id, /^PAC-/);
  assert.strictEqual(criado.dados.telefone, '5562999990001');
  const aviso = context.criarPaciente(dados);
  assert.strictEqual(aviso.dados.requerConfirmacaoDuplicidade, true);
  const confirmado = context.criarPaciente({ ...dados, permitirDuplicado: true });
  assert.strictEqual(confirmado.sucesso, true);
});

test('validação bloqueia telefone, data, horário, status e fórmula em nome', () => {
  assert.strictEqual(context.criarPaciente({ nome: '=IMPORTXML("x")', telefone: '62999990001', dataConsulta: '2026-08-20', horario: '14:00' }).sucesso, false);
  assert.strictEqual(context.criarPaciente({ nome: 'Paciente Teste', telefone: '123', dataConsulta: '2026-08-20', horario: '14:00' }).sucesso, false);
  assert.throws(() => context.normalizarData_('31/02/2026'));
  assert.throws(() => context.normalizarHorario_('24:00'));
  assert.throws(() => context.validarStatus_('Desconhecido'));
});

test('edição preserva ID, atualiza campos e reseta flags ao reagendar', () => {
  const paciente = context.obterPacientes_()[0];
  paciente.confirmacaoSemanalEnviada = 'SIM';
  paciente.lembrete24hEnviado = 'SIM';
  paciente.lembrete1hEnviado = 'SIM';
  context.salvarPacienteNaLinha_(spreadsheet.getSheetByName('Pacientes'), paciente);
  const resposta = context.atualizarPaciente(paciente.id, {
    nome: 'Paciente Teste Editado', telefone: '62999990003', dataConsulta: '2026-08-21', horario: '15:30', status: 'Confirmado'
  });
  assert.strictEqual(resposta.dados.id, paciente.id);
  assert.strictEqual(resposta.dados.status, 'Confirmado');
  assert.strictEqual(resposta.dados.confirmacaoSemanalEnviada, 'NÃO');
  assert.strictEqual(resposta.dados.lembrete24hEnviado, 'NÃO');
  assert.strictEqual(resposta.dados.lembrete1hEnviado, 'NÃO');
});

test('ações rápidas cobrem confirmar, cancelar, atendido e faltou', () => {
  const id = context.obterPacientes_()[0].id;
  ['Confirmado', 'Cancelado', 'Atendido', 'Faltou'].forEach(status => {
    const resposta = context.atualizarStatusPaciente(id, status);
    assert.strictEqual(resposta.sucesso, true);
    assert.strictEqual(resposta.dados.status, status);
  });
});

test('exclusão remove somente o agendamento selecionado', () => {
  const antes = context.obterPacientes_();
  assert.strictEqual(context.excluirPaciente(antes[1].id).sucesso, true);
  assert.strictEqual(context.obterPacientes_().length, antes.length - 1);
});

test('importação continua após erros e evita duplicados óbvios', () => {
  const texto = [
    'Paciente Teste 10;62999990010;22/08/2026;09:00',
    'Linha Inválida;123;22/08/2026;10:00',
    'Paciente Teste 11;62999990011;23/08/2026;10:30',
    'Paciente Teste 10;62999990010;22/08/2026;09:00',
    'Data Inválida;62999990012;31/02/2026;10:00'
  ].join('\n');
  const resposta = context.importarPacientes(texto);
  assert.strictEqual(resposta.dados.importados, 2);
  assert.strictEqual(resposta.dados.erros.length, 3);
});

test('datas permanecem estáveis no timezone de São Paulo, inclusive perto da meia-noite', () => {
  const consulta = context.criarDataConsulta_('2026-08-18', '00:05');
  assert.strictEqual(consulta.toISOString(), '2026-08-18T03:05:00.000Z');
  assert.strictEqual(context.formatarDataIso_(consulta), '2026-08-18');
  assert.strictEqual(context.formatarHorario_(consulta), '00:05');
});

test('automação semanal, 24h e 1h ignora cancelados/atendidos e não repete', () => {
  const now = new Date('2026-08-17T12:00:00.000Z'); // segunda-feira, 09:00 em São Paulo
  const base = (id, nome, dataConsulta, horario, status = 'Agendado') => ({
    id, nome, telefone: `5562999990${id.slice(-3)}`, dataConsulta, horario, status,
    confirmacaoSemanalEnviada: 'NÃO', dataConfirmacaoSemanal: '', lembrete24hEnviado: 'NÃO', dataLembrete24h: '',
    lembrete1hEnviado: 'NÃO', dataLembrete1h: '', dataCadastro: '', ultimaAtualizacao: '', _linha: 2
  });
  const pacientes = [
    base('PAC-101', 'Paciente Semanal', '2026-08-20', '09:00'),
    base('PAC-102', 'Paciente 24h', '2026-08-18', '09:00', 'Confirmado'),
    base('PAC-103', 'Paciente 1h', '2026-08-17', '10:00', 'Confirmado'),
    base('PAC-104', 'Paciente Cancelado', '2026-08-17', '10:00', 'Cancelado'),
    base('PAC-105', 'Paciente Atendido', '2026-08-17', '10:00', 'Atendido')
  ];
  const fila = [];
  assert.strictEqual(context.indiceDiaSemana_(now), 1);
  assert.strictEqual(context.processarConfirmacoesSemanais_(pacientes, now, false, fila), 3);
  assert.strictEqual(context.processarLembretes24h_(pacientes, now, fila), 1);
  assert.strictEqual(context.processarLembretes1h_(pacientes, now, fila), 1);
  assert.strictEqual(fila.filter(item => item.paciente.id === 'PAC-104').length, 0);
  assert.strictEqual(fila.filter(item => item.paciente.id === 'PAC-105').length, 0);
  const quantidadeInicial = fila.length;
  context.processarConfirmacoesSemanais_(pacientes, now, false, fila);
  context.processarLembretes24h_(pacientes, now, fila);
  context.processarLembretes1h_(pacientes, now, fila);
  assert.strictEqual(fila.length, quantidadeInicial);
});

test('chave persistente impede log duplicado mesmo em nova tentativa', () => {
  const paciente = { id: 'PAC-LOG', nome: 'Paciente Log', telefone: '5562999990001', dataConsulta: '2026-08-18', horario: '09:00' };
  const registro = { id: context.criarIdLogMensagem_(paciente, 'LEMBRETE_24H'), paciente, tipo: 'LEMBRETE_24H', mensagem: 'Teste', status: 'SIMULADO', detalhes: '' };
  assert.strictEqual(context.registrarLogsEmLote_([registro]), 1);
  assert.strictEqual(context.registrarLogsEmLote_([registro]), 0);
});

test('código da interface contém todos os filtros de agenda e feedback de loading', () => {
  const scripts = fs.readFileSync(path.join(root, 'src', 'Scripts.html'), 'utf8');
  ['hoje', 'amanha', 'semana', 'proxima-semana', 'confirmados', 'aguardando', 'cancelados'].forEach(filtro => assert(scripts.includes(`'${filtro}'`)));
  assert(scripts.includes('button-spinner'));
  assert(scripts.includes('atualizarStatusPaciente'));
});

console.log(`\n${passed} testes aprovados.`);

/**
 * Agenda Odonto - configurações centrais.
 * Valores editáveis são sobrescritos por Script Properties.
 * Tokens nunca são enviados ao frontend.
 */
const CONFIG = Object.freeze({
  NOME_DENTISTA: 'Nome da dentista',
  NOME_FACULDADE: 'Nome da faculdade',
  MODO_TESTE: true,
  DIAS_CONFIRMACAO: 7,
  MINUTOS_LEMBRETE_24H: 1440,
  MINUTOS_LEMBRETE_1H: 60,
  TOLERANCIA_LEMBRETE_24H: 15,
  TOLERANCIA_LEMBRETE_1H: 5,
  TIMEZONE: 'America/Sao_Paulo',
  PHONE_NUMBER_ID: '',
  ACCESS_TOKEN: '',
  WHATSAPP_BUSINESS_ACCOUNT_ID: '',
  WHATSAPP_TEMPLATE_CONFIRMACAO: '',
  WHATSAPP_TEMPLATE_LEMBRETE_24H: '',
  WHATSAPP_TEMPLATE_LEMBRETE_1H: ''
});

function getConfig_() {
  const propriedades = PropertiesService.getScriptProperties();
  return Object.freeze({
    ...CONFIG,
    NOME_DENTISTA: propriedades.getProperty('NOME_DENTISTA') || CONFIG.NOME_DENTISTA,
    NOME_FACULDADE: propriedades.getProperty('NOME_FACULDADE') || CONFIG.NOME_FACULDADE,
    MODO_TESTE: parseBoolean_(propriedades.getProperty('MODO_TESTE'), CONFIG.MODO_TESTE),
    DIAS_CONFIRMACAO: parseNumber_(propriedades.getProperty('DIAS_CONFIRMACAO'), CONFIG.DIAS_CONFIRMACAO),
    MINUTOS_LEMBRETE_24H: parseNumber_(propriedades.getProperty('MINUTOS_LEMBRETE_24H'), CONFIG.MINUTOS_LEMBRETE_24H),
    MINUTOS_LEMBRETE_1H: parseNumber_(propriedades.getProperty('MINUTOS_LEMBRETE_1H'), CONFIG.MINUTOS_LEMBRETE_1H),
    PHONE_NUMBER_ID: propriedades.getProperty('PHONE_NUMBER_ID') || '',
    ACCESS_TOKEN: propriedades.getProperty('ACCESS_TOKEN') || '',
    WHATSAPP_BUSINESS_ACCOUNT_ID: propriedades.getProperty('WHATSAPP_BUSINESS_ACCOUNT_ID') || '',
    WHATSAPP_TEMPLATE_CONFIRMACAO: propriedades.getProperty('WHATSAPP_TEMPLATE_CONFIRMACAO') || '',
    WHATSAPP_TEMPLATE_LEMBRETE_24H: propriedades.getProperty('WHATSAPP_TEMPLATE_LEMBRETE_24H') || '',
    WHATSAPP_TEMPLATE_LEMBRETE_1H: propriedades.getProperty('WHATSAPP_TEMPLATE_LEMBRETE_1H') || ''
  });
}

function getConfiguracoesPublicas_() {
  const config = getConfig_();
  return {
    nomeDentista: config.NOME_DENTISTA,
    nomeFaculdade: config.NOME_FACULDADE,
    modoTeste: config.MODO_TESTE,
    diasConfirmacao: config.DIAS_CONFIRMACAO,
    minutosLembrete24h: config.MINUTOS_LEMBRETE_24H,
    minutosLembrete1h: config.MINUTOS_LEMBRETE_1H,
    timezone: config.TIMEZONE
  };
}

function salvarConfiguracoes(dados) {
  validarObjeto_(dados, 'Configurações inválidas.');
  const nomeDentista = textoSeguro_(dados.nomeDentista, 100);
  const nomeFaculdade = textoSeguro_(dados.nomeFaculdade, 150);
  const diasConfirmacao = inteiroEntre_(dados.diasConfirmacao, 1, 30, 'Dias para confirmação');
  const minutos24h = inteiroEntre_(dados.minutosLembrete24h, 60, 4320, 'Minutos do lembrete de 24h');
  const minutos1h = inteiroEntre_(dados.minutosLembrete1h, 10, 240, 'Minutos do lembrete de 1h');

  if (!nomeDentista || !nomeFaculdade) {
    throw new Error('Informe o nome da dentista e da faculdade.');
  }

  PropertiesService.getScriptProperties().setProperties({
    NOME_DENTISTA: nomeDentista,
    NOME_FACULDADE: nomeFaculdade,
    MODO_TESTE: 'true',
    DIAS_CONFIRMACAO: String(diasConfirmacao),
    MINUTOS_LEMBRETE_24H: String(minutos24h),
    MINUTOS_LEMBRETE_1H: String(minutos1h)
  }, false);

  return respostaSucesso_('Configurações salvas.', getConfiguracoesPublicas_());
}

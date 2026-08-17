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
  TIMEZONE: 'America/Sao_Paulo'
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
    MINUTOS_LEMBRETE_1H: parseNumber_(propriedades.getProperty('MINUTOS_LEMBRETE_1H'), CONFIG.MINUTOS_LEMBRETE_1H)
  });
}

function getConfiguracoesPublicas_() {
  const config = getConfig_();
  return {
    nomeDentista: config.NOME_DENTISTA,
    nomeFaculdade: config.NOME_FACULDADE,
    modoTeste: config.MODO_TESTE,
    diasConfirmacao: config.DIAS_CONFIRMACAO,
    timezone: config.TIMEZONE
  };
}

function salvarConfiguracoes(dados) {
  return executarEndpoint_('salvar as configurações', () => {
    validarObjeto_(dados, 'Configurações inválidas.');
    const nomeDentista = textoSeguro_(dados.nomeDentista, 100);
    const nomeFaculdade = textoSeguro_(dados.nomeFaculdade, 150);
    const diasConfirmacao = inteiroEntre_(dados.diasConfirmacao, 1, 30, 'Dias para confirmação');

    if (!nomeDentista || !nomeFaculdade) {
      throw erroUsuario_('Informe o nome da dentista e da faculdade.');
    }
    if (/^[=+\-@]/.test(nomeDentista) || /^[=+\-@]/.test(nomeFaculdade)) {
      throw erroUsuario_('Os nomes informados começam com um caractere não permitido.');
    }

    PropertiesService.getScriptProperties().setProperties({
      NOME_DENTISTA: nomeDentista,
      NOME_FACULDADE: nomeFaculdade,
      MODO_TESTE: 'true',
      DIAS_CONFIRMACAO: String(diasConfirmacao)
    }, false);

    return respostaSucesso_('Configurações salvas.', getConfiguracoesPublicas_());
  });
}

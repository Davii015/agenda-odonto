/**
 * Único ponto de passagem para mensagens. A integração externa fica isolada aqui.
 * O quarto parâmetro é opcional e carrega dados do paciente para o log.
 */
function enviarMensagemWhatsApp(telefone, mensagem, tipo, contexto, filaLogs) {
  const config = getConfig_();
  const paciente = contexto || { id: '', nome: '', telefone: normalizarTelefone_(telefone) };

  if (config.MODO_TESTE) {
    const registro = {
      id: criarIdLogMensagem_(paciente, tipo),
      paciente,
      tipo,
      mensagem,
      status: 'SIMULADO',
      detalhes: 'Nenhuma mensagem externa foi enviada.'
    };
    if (Array.isArray(filaLogs)) filaLogs.push(registro);
    else registrarLog_(paciente, tipo, mensagem, registro.status, registro.detalhes);
    return { sucesso: true, status: 'SIMULADO' };
  }

  // Integração futura com a WhatsApp Cloud API deve ser implementada somente aqui.
  // ACCESS_TOKEN e IDs devem ser lidos de PropertiesService, nunca do frontend.
  throw new Error('WhatsApp Cloud API ainda não configurada. Reative o MODO_TESTE para continuar simulando.');
}

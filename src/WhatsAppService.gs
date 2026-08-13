/**
 * Único ponto de passagem para mensagens. A integração externa fica isolada aqui.
 * O quarto parâmetro é opcional e carrega dados do paciente para o log.
 */
function enviarMensagemWhatsApp(telefone, mensagem, tipo, contexto) {
  const config = getConfig_();
  const paciente = contexto || { id: '', nome: '', telefone: normalizarTelefone_(telefone) };

  if (config.MODO_TESTE) {
    registrarLog_(paciente, tipo, mensagem, 'SIMULADO', 'Nenhuma mensagem externa foi enviada.');
    return { sucesso: true, status: 'SIMULADO' };
  }

  // Integração futura com a WhatsApp Cloud API deve ser implementada somente aqui.
  // ACCESS_TOKEN e IDs devem ser lidos de PropertiesService, nunca do frontend.
  throw new Error('WhatsApp Cloud API ainda não configurada. Reative o MODO_TESTE para continuar simulando.');
}

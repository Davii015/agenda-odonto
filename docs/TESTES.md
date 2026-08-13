# Roteiro de testes

Mantenha `MODO_TESTE = true` durante todo este roteiro.

## 1. Configuração inicial

1. Abra o Web App.
2. Entre em **Configurações**.
3. Informe o nome da dentista e da faculdade.
4. Salve.

## 2. Cadastro e agenda

1. Cadastre um paciente com nome, WhatsApp, data e horário.
2. Confira se o telefone foi salvo com o código `55` na planilha.
3. Use a busca e os filtros da Agenda.
4. Edite nome, telefone, data, horário e status.
5. Teste a exclusão e confirme a mensagem de segurança.

## 3. Importação

Cole em **Importar**:

```text
Maria Silva;62999999999;20/08/2026;14:00
Carlos Souza;62988888888;20/08/2026;15:00
Linha Inválida;123;99/99/2026;40:00
```

Resultado esperado: dois registros importados e uma linha informada como erro.

## 4. Pacientes fictícios

Em **Configurações**, clique em **Gerar pacientes de teste**. O sistema criará:

- paciente para aproximadamente 30 minutos;
- paciente para aproximadamente 1 hora;
- paciente para aproximadamente 24 horas;
- paciente para três dias;
- paciente cancelado.

## 5. Lembretes

Clique em **Processar automações** logo após gerar os pacientes.

Resultado esperado nos Logs:

- um `LEMBRETE_1H`;
- um `LEMBRETE_24H`;
- nenhum lembrete para o cancelado;
- status `SIMULADO` em todos os registros.

Execute novamente. As mensagens anteriores não devem ser repetidas.

## 6. Confirmação semanal

Clique em **Simular rodada semanal** para testar a regra mesmo fora de uma segunda-feira.

Os pacientes elegíveis devem gerar `CONFIRMACAO_SEMANAL` e, quando estavam como `Agendado`, passar para `Aguardando confirmação`.

## 7. Painéis

Confira:

- números do Dashboard;
- atendimentos de hoje ordenados por horário;
- resumo semanal;
- contadores de Confirmados, Aguardando e Cancelados;
- mensagens completas na tela Logs e na aba `Logs` da planilha.

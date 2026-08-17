# Roteiro de testes

Use exclusivamente uma planilha de testes, mantenha `MODO_TESTE: true` e utilize apenas pacientes claramente fictícios.

## Testes automatizados locais

```bash
node tests/run-tests.js
```

O script usa uma planilha em memória. Ele não acessa Google Sheets, não envia dados e não cria mensagens externas.

## 1. Configuração inicial

1. Execute `setup()` duas vezes no editor.
2. Confirme que existem somente as abas `Pacientes` e `Logs` esperadas.
3. Em **Gatilhos**, confirme que existe apenas um gatilho de `processarAutomacoes` a cada cinco minutos.
4. Abra o Web App e salve nome da dentista, faculdade e dias para confirmação.

## 2. CRUD e status

1. Cadastre `Paciente Teste 01` com telefone `62999990001`.
2. Confira na planilha o telefone `5562999990001`.
3. Repita exatamente telefone, data e horário; confirme que o sistema avisa antes de permitir.
4. Edite nome, telefone, data, horário e status; confirme que o ID não mudou.
5. Use as ações rápidas **Confirmar**, **Cancelar**, **Atendido** e **Faltou**.
6. Exclua um registro e confirme a pergunta de segurança.

## 3. Agenda e dashboard

Valide Dashboard, atendimentos de hoje ordenados por horário, busca sem recarregar a página e filtros:

- Hoje;
- Amanhã;
- Esta semana;
- Próxima semana;
- Todos;
- Confirmados;
- Aguardando confirmação;
- Cancelados.

## 4. Importação

```text
Paciente Teste 10;62999990010;20/08/2026;14:00
Paciente Teste 11;62999990011;20/08/2026;15:00
Telefone Inválido;123;20/08/2026;16:00
Data Inválida;62999990012;31/02/2026;10:00
Paciente Teste 10;62999990010;20/08/2026;14:00
```

Resultado esperado: duas linhas importadas e três erros, sem interromper o lote.

## 5. Automações

As ferramentas abaixo são funções de desenvolvimento e não aparecem no Web App de produção.

1. No editor do Apps Script, execute `gerarPacientesFicticios()` em uma base vazia de testes.
2. Execute `processarAutomacoes()` para validar lembretes na janela de 24 horas e 1 hora.
3. Execute novamente e confirme que os logs não se repetem.
4. Execute `testarConfirmacaoSemanal()` para testar a rodada semanal fora de segunda-feira.
5. Confirme que cancelados e atendidos não recebem nenhuma mensagem.
6. Confira flags, datas/horas e status `SIMULADO` nas duas abas.

## 6. Datas e timezone

Crie cenários antes e depois da meia-noite, consulta amanhã e consultas nas janelas de 24 horas e 1 hora. Confirme que a data exibida e persistida permanece em `America/Sao_Paulo`.

## 7. Interface

Teste a URL `/dev` antes de atualizar a implantação `/exec`:

- desktop;
- 320 px;
- 375 px;
- 390 px;
- 430 px;
- formulário e modal;
- navegação inferior;
- loading e botão desabilitado durante requisições;
- feedback amigável de sucesso e erro;
- ausência de scroll horizontal e botões cortados.

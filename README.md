# Agenda Odonto

Agenda web responsiva para uso diário de uma dentista, publicada como Google Apps Script Web App e persistida em Google Sheets.

> A versão 1.0 opera obrigatoriamente com `MODO_TESTE: true`. Nenhuma mensagem é enviada ao WhatsApp: confirmações e lembretes são registrados na aba e na tela `Logs` com status `SIMULADO`.

## Recursos

- dashboard com consultas do dia, próximos atendimentos e resumo por status;
- agenda ordenada por data e horário, com busca local e filtros;
- cadastro, edição, exclusão e aviso de possível duplicidade;
- ações rápidas para confirmar, cancelar, marcar como atendido ou faltou;
- painel de confirmações dos próximos dias;
- importação em massa com validação linha a linha;
- confirmação semanal e lembretes de 24 horas e 1 hora;
- proteção persistente contra mensagens duplicadas;
- logs pesquisáveis e filtráveis por tipo;
- configurações não sensíveis da dentista e da faculdade;
- interface mobile-first para celular e desktop.

O sistema armazena somente nome, telefone, data, horário, status e metadados operacionais da agenda. Não contém prontuário, diagnóstico, documentos, endereço, informações médicas ou financeiras.

## Tecnologias

- Google Apps Script V8;
- Google Sheets;
- HtmlService;
- HTML, CSS e JavaScript puro;
- gatilhos temporizados do Apps Script.

Não há framework ou serviço pago.

## Estrutura do projeto

```text
agenda-odonto/
├── src/
│   ├── appsscript.json
│   ├── Code.gs
│   ├── Config.gs
│   ├── Database.gs
│   ├── Automation.gs
│   ├── WhatsAppService.gs
│   ├── Utils.gs
│   ├── Index.html
│   ├── Styles.html
│   └── Scripts.html
├── tests/
│   ├── run-tests.js
│   └── preview-server.js
├── docs/
│   ├── INSTALACAO.md
│   └── TESTES.md
├── .clasp.json.example
├── .claspignore
├── .gitignore
├── SECURITY.md
└── README.md
```

`Code.gs` contém os endpoints do Web App. `Database.gs` concentra o acesso à planilha, `Automation.gs` contém as regras recorrentes, `WhatsAppService.gs` isola a futura integração e `Utils.gs` centraliza validações, datas e tratamento de erros.

## Configuração inicial

### Criando Google Sheets

1. Crie uma planilha vazia chamada, por exemplo, `Agenda Odonto - Banco`.
2. Restrinja o compartilhamento às pessoas responsáveis pela agenda.
3. Abra **Extensões → Apps Script**.

Não crie nem edite manualmente as abas `Pacientes` e `Logs`: `setup()` faz isso sem apagar dados existentes.

### Abrindo Apps Script

Copie os arquivos de `src/` para o projeto vinculado à planilha. Arquivos `.gs` devem ser criados como **Script**; `Index`, `Styles` e `Scripts` devem ser criados como **HTML**.

Em **Configurações do projeto**, habilite a exibição do manifesto e use o conteúdo de `src/appsscript.json`.

Como alternativa, configure `.clasp.json` a partir de `.clasp.json.example` e execute `clasp push`. O `.clasp.json` real não é versionado.

### Executando `setup()`

1. No editor do Apps Script, selecione a função `setup`.
2. Clique em **Executar**.
3. Autorize o acesso à planilha e aos gatilhos.
4. Confirme no histórico de execuções que a função terminou com sucesso.

O setup cria e valida as abas, configura cabeçalhos e formatos, registra o ID da planilha, verifica timezone/modo de teste e instala um único gatilho a cada 5 minutos. Ele é idempotente: executá-lo duas vezes não apaga dados nem duplica o gatilho.

## Publicando como Web App

1. No Apps Script, abra **Implantar → Nova implantação**.
2. Selecione **Aplicativo da Web**.
3. Em **Executar como**, escolha **Eu**.
4. Escolha quem pode acessar conforme a política da clínica. Durante a configuração, prefira **Somente eu**.
5. Clique em **Implantar** e autorize se solicitado.

A implantação de produção usa a URL fornecida pelo Apps Script terminada em `/exec`. Uma implantação de teste acessada pelo editor pode usar `/dev`. Não invente nem edite manualmente essas URLs.

## Disponibilizando para a dentista

Depois de validar a implantação:

1. ajuste a permissão do Web App para a conta ou organização autorizada;
2. abra a URL `/exec` nessa conta e confirme o acesso;
3. envie somente essa URL à dentista;
4. no celular, opcionalmente use **Adicionar à tela inicial** no navegador.

A planilha não precisa ser aberta para a operação diária. Ela deve continuar privada e serve como banco e apoio administrativo.

## Atualizando uma implantação

Salvar o código não atualiza uma implantação versionada. Depois de um `clasp push` ou de alterações no editor:

1. abra **Implantar → Gerenciar implantações**;
2. edite a implantação existente;
3. selecione **Nova versão**;
4. implante novamente;
5. teste a mesma URL `/exec`.

## Testando

Com Node.js disponível, execute:

```bash
node tests/run-tests.js
```

O roteiro cobre setup, CRUD, status, duplicidades, importação parcial, timezone, virada de dia, automações e proteção contra logs repetidos.

As funções `gerarPacientesFicticios()` e `testarConfirmacaoSemanal()` permanecem apenas no backend para desenvolvimento. Elas não aparecem na interface de produção. Use-as somente em uma planilha de testes e nunca em uma base real.

Veja o roteiro manual em [docs/TESTES.md](docs/TESTES.md).

## Logs

Cada mensagem simulada contém data/hora, paciente, telefone, tipo, conteúdo e status. Os tipos atuais são `CONFIRMACAO_SEMANAL`, `LEMBRETE_24H` e `LEMBRETE_1H`; todos recebem status `SIMULADO`.

Falhas técnicas ficam no histórico de execuções/Cloud Logging do Apps Script e não são expostas diretamente ao usuário.

## Importação

Use uma linha por agendamento:

```text
Paciente Teste 01;62999990001;20/08/2026;14:00
Paciente Teste 02;62999990002;20/08/2026;15:00
```

O formato é `Nome;WhatsApp;DD/MM/AAAA;HH:MM`. Linhas inválidas ou obviamente duplicadas são informadas sem interromper as demais. Telefones brasileiros são normalizados para `55 + DDD + número`.

## Automação

`processarAutomacoes()` executa, nessa ordem:

1. confirmação semanal de segunda-feira para consultas nos próximos `DIAS_CONFIRMACAO` (padrão 7);
2. lembrete na janela aproximada de 24 horas;
3. lembrete na janela aproximada de 1 hora.

Cancelados e atendidos são ignorados. Flags persistidas na aba `Pacientes`, lock de script e IDs determinísticos de log impedem repetição mesmo quando o gatilho roda várias vezes na mesma janela.

## Integração futura com WhatsApp Cloud API

O único ponto de passagem é `enviarMensagemWhatsApp()` em `WhatsAppService.gs`. A versão atual não contém chamadas reais e não exige credenciais.

Quando a integração for implementada, valores como `ACCESS_TOKEN`, `PHONE_NUMBER_ID` e `WHATSAPP_BUSINESS_ACCOUNT_ID` deverão ser lidos exclusivamente de `PropertiesService.getScriptProperties()`. Nunca coloque valores reais em `.gs`, HTML, JSON, `.env`, documentação ou GitHub.

## Segurança

- mantenha `MODO_TESTE: true` nesta versão;
- aplique menor privilégio no Web App e na planilha;
- não publique planilhas, exportações, backups ou dados de pacientes;
- não use pacientes reais em testes ou commits;
- revise `git status`, diffs e padrões de segredo antes de cada push;
- rotacione qualquer credencial que tenha sido versionada, mesmo após removê-la do arquivo atual.

Consulte [SECURITY.md](SECURITY.md).

## Desenvolvimento local / Git

Antes de enviar alterações:

```bash
node tests/run-tests.js
git status
git diff
git diff --cached
```

O servidor `node tests/preview-server.js` serve apenas para inspeção visual local com dados fictícios. Ele não substitui o teste final na URL `/dev` ou `/exec` do Apps Script.

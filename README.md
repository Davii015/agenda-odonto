# Agenda Odonto

Sistema web responsivo para gerenciamento de agendamentos de uma clínica odontológica universitária, construído com Google Apps Script e Google Sheets.

> A primeira versão opera exclusivamente em modo de teste. Nenhuma mensagem é enviada ao WhatsApp; todas são registradas na aba `Logs`.

## Funcionalidades

- cadastro, edição e exclusão de agendamentos;
- dashboard com resumo diário e semanal;
- agenda com busca e filtros;
- painel de confirmações;
- importação de pacientes em massa;
- confirmação semanal de segunda-feira;
- lembretes de 24 horas e 1 hora;
- registros de mensagens simuladas;
- geração de pacientes fictícios para testes;
- interface mobile-first, sem frameworks.

## Tecnologias

- Google Apps Script;
- Google Sheets;
- HTML, CSS e JavaScript puro;
- Google Apps Script Web App.

## Estrutura

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
├── docs/
│   ├── INSTALACAO.md
│   └── TESTES.md
├── .clasp.json.example
├── .claspignore
├── .gitignore
├── SECURITY.md
└── README.md
```

## Instalação rápida

1. Crie uma Google Sheets vazia.
2. Abra **Extensões → Apps Script**.
3. Crie no editor os arquivos existentes em [`src`](src/).
4. Execute `setup()` e autorize o acesso solicitado.
5. Publique como **Aplicativo da Web**, executando como sua conta.

O guia detalhado está em [docs/INSTALACAO.md](docs/INSTALACAO.md).

## Testes

Depois da implantação, abra **Configurações** e use:

- **Gerar pacientes de teste**;
- **Processar automações**;
- **Simular rodada semanal**.

Confira os resultados na Agenda, em Confirmações e na tela Logs. Veja o roteiro completo em [docs/TESTES.md](docs/TESTES.md).

## Envio com `clasp` (opcional)

O projeto está preparado para usar o [clasp](https://github.com/google/clasp), a ferramenta oficial de linha de comando do Google Apps Script.

1. Copie `.clasp.json.example` para `.clasp.json`.
2. Substitua `COLE_O_SCRIPT_ID_AQUI` pelo ID do projeto Apps Script.
3. Autentique com `clasp login`.
4. Envie os arquivos com `clasp push`.

O `.clasp.json` real é ignorado pelo Git para evitar publicar o ID do projeto.

## Privacidade

O sistema armazena somente nome, telefone, data, horário e status do agendamento. Não armazena prontuário, diagnóstico, CPF, endereço, exames ou dados de tratamento.

Antes de disponibilizar o sistema para outras pessoas, leia [SECURITY.md](SECURITY.md).

## Integração futura com WhatsApp Cloud API

A integração externa ainda não está implementada. Toda mensagem passa por `enviarMensagemWhatsApp()` em [`src/WhatsAppService.gs`](src/WhatsAppService.gs).

Tokens e IDs futuros deverão ser armazenados em `PropertiesService`, nunca no frontend ou no repositório GitHub.

## Licença

Nenhuma licença foi definida ainda. Escolha uma licença antes de permitir reutilização pública do código.

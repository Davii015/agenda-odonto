# Segurança e privacidade

O Agenda Odonto lida com nomes e números de telefone de pacientes. Mesmo sem dados clínicos, essas informações devem ser tratadas como privadas.

## Recomendações para implantação

- Durante o desenvolvimento, publique o Web App para **Somente eu**.
- Se outras pessoas precisarem acessar, prefira restrição por conta Google ou organização.
- Não publique uma planilha real como arquivo público ou “qualquer pessoa com o link”.
- Restrinja o compartilhamento da Google Sheets às pessoas responsáveis pelo atendimento.
- Mantenha `CONFIG.MODO_TESTE = true` até a integração real ser revisada.
- Nunca grave tokens, chaves ou credenciais em arquivos HTML, JavaScript do navegador ou GitHub.
- Não exporte a planilha de produção para dentro do repositório.
- Revise os usuários autorizados no Web App e na planilha sempre que a equipe mudar.

## Dados que não devem ser armazenados

- diagnóstico ou condição médica;
- prontuário, exames ou tratamentos;
- CPF, endereço ou documentos;
- informações financeiras;
- tokens e credenciais de serviços externos.

## WhatsApp Cloud API

Quando a integração for implementada, use `PropertiesService.getScriptProperties()` para armazenar `ACCESS_TOKEN`, `PHONE_NUMBER_ID` e demais identificadores. Centralize todas as chamadas externas em `WhatsAppService.gs`.

## Proteções implementadas

- validação no navegador e no servidor;
- bloqueio de fórmulas em campos de nome/configuração antes da escrita no Sheets;
- `LockService` em cadastros, importações e automações;
- UUIDs para agendamentos e chaves determinísticas para mensagens;
- erros técnicos enviados apenas ao log do Apps Script;
- nenhuma credencial sensível retornada ao frontend;
- ferramentas de dados fictícios ausentes da interface de produção.

## Antes de cada publicação

Execute os testes, revise `git status`, `git diff` e `git diff --cached`, e pesquise padrões de tokens, chaves privadas, senhas, telefones e exportações de planilha. Se um segredo tiver aparecido em um commit anterior, revogue-o e remova-o do histórico antes de tornar o repositório público.

## Relato de vulnerabilidade

Não publique tokens, dados de pacientes ou detalhes sensíveis em uma issue pública. Comunique o responsável pelo repositório por um canal privado.

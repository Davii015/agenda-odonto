# Segurança e privacidade

O Agenda Odonto lida com nomes e números de telefone de pacientes. Mesmo sem dados clínicos, essas informações devem ser tratadas como privadas.

## Recomendações para implantação

- Durante o desenvolvimento, publique o Web App para **Somente eu**.
- Se outras pessoas precisarem acessar, prefira restrição por conta Google ou organização.
- Não publique uma planilha real como arquivo público ou “qualquer pessoa com o link”.
- Restrinja o compartilhamento da Google Sheets às pessoas responsáveis pelo atendimento.
- Mantenha `CONFIG.MODO_TESTE = true` até a integração real ser revisada.
- Nunca grave tokens, chaves ou credenciais em arquivos HTML, JavaScript do navegador ou GitHub.

## Dados que não devem ser armazenados

- diagnóstico ou condição médica;
- prontuário, exames ou tratamentos;
- CPF, endereço ou documentos;
- informações financeiras;
- tokens e credenciais de serviços externos.

## WhatsApp Cloud API

Quando a integração for implementada, use `PropertiesService.getScriptProperties()` para armazenar `ACCESS_TOKEN`, `PHONE_NUMBER_ID` e demais identificadores. Centralize todas as chamadas externas em `WhatsAppService.gs`.

## Relato de vulnerabilidade

Não publique tokens, dados de pacientes ou detalhes sensíveis em uma issue pública. Comunique o responsável pelo repositório por um canal privado.

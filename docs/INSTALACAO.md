# Instalação do Agenda Odonto

## Opção recomendada: projeto vinculado à planilha

### 1. Criar o banco

1. Acesse o Google Sheets.
2. Crie uma planilha vazia chamada `Agenda Odonto - Banco`.
3. Abra **Extensões → Apps Script**.

Não crie manualmente as abas `Pacientes` e `Logs`.

### 2. Criar os arquivos no Apps Script

Crie os arquivos de script abaixo e copie o conteúdo correspondente da pasta `src`:

```text
Code.gs
Config.gs
Database.gs
Automation.gs
WhatsAppService.gs
Utils.gs
```

Em **+ → HTML**, crie:

```text
Index.html
Styles.html
Scripts.html
```

Os arquivos HTML devem ser criados usando a opção **HTML**, enquanto os arquivos `.gs` devem usar a opção **Script**.

### 3. Configurar o manifesto

1. Abra **Configurações do projeto**.
2. Ative **Mostrar o arquivo de manifesto appsscript.json**.
3. Substitua o conteúdo pelo arquivo `src/appsscript.json`.
4. Salve o projeto.

### 4. Executar `setup()`

1. No seletor de funções do editor, escolha `setup`.
2. Clique em **Executar**.
3. Escolha sua conta e autorize as permissões solicitadas.

A função cria e formata as abas, salva o ID da planilha e instala o gatilho de cinco minutos sem duplicá-lo.

### 5. Publicar o Web App

1. Abra **Implantar → Nova implantação**.
2. Escolha **Aplicativo da Web**.
3. Em **Executar como**, escolha **Eu**.
4. Durante os testes, use **Somente eu**.
5. Clique em **Implantar** e abra a URL terminada em `/exec`.

Quando o código for atualizado, abra **Implantar → Gerenciar implantações**, edite a implantação, selecione **Nova versão** e implante novamente.

## Opção alternativa: `clasp`

O arquivo `.clasp.json.example` já aponta para a pasta `src`.

```bash
npm install -g @google/clasp
clasp login
```

Copie `.clasp.json.example` para `.clasp.json`, informe o Script ID encontrado em **Configurações do projeto** e execute:

```bash
clasp push
```

O arquivo `.clasp.json` não deve ser enviado ao GitHub.

## Solução de problemas

### `parseBoolean_ is not defined`

Confirme que `Utils.gs` foi criado como **Script**, que seu conteúdo foi copiado integralmente e que uma nova versão do Web App foi implantada.

### Interface abre vazia depois de uma correção

Salvar o código não atualiza automaticamente uma implantação versionada. Publique uma **Nova versão** em **Gerenciar implantações**.

### Abas não foram criadas

Execute `setup()` pelo editor vinculado à planilha e confira o histórico de execuções do Apps Script.

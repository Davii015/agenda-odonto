'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, 'src', file), 'utf8');
const styles = read('Styles.html');
const scripts = read('Scripts.html');
const mock = `<script>
  (() => {
    let pacientes = [
      { id: 'PAC-TESTE-01', nome: 'Paciente Teste 01', telefone: '5562999990001', dataConsulta: '2026-08-17', horario: '08:00', status: 'Confirmado' },
      { id: 'PAC-TESTE-02', nome: 'Paciente Teste 02', telefone: '5562999990002', dataConsulta: '2026-08-17', horario: '09:30', status: 'Aguardando confirmação' },
      { id: 'PAC-TESTE-03', nome: 'Paciente Teste 03', telefone: '5562999990003', dataConsulta: '2026-08-17', horario: '14:00', status: 'Agendado' },
      { id: 'PAC-TESTE-04', nome: 'Paciente Teste 04', telefone: '5562999990004', dataConsulta: '2026-08-18', horario: '10:00', status: 'Confirmado' },
      { id: 'PAC-TESTE-05', nome: 'Paciente Teste 05', telefone: '5562999990005', dataConsulta: '2026-08-20', horario: '15:30', status: 'Cancelado' }
    ];
    const logs = [
      { id: 'LOG-TESTE-01', dataHora: '2026-08-17 08:00:00', paciente: 'Paciente Teste 01', telefone: '5562999990001', tipo: 'LEMBRETE_1H', conteudo: 'Mensagem simulada de lembrete para o paciente fictício.', status: 'SIMULADO' },
      { id: 'LOG-TESTE-02', dataHora: '2026-08-16 09:00:00', paciente: 'Paciente Teste 04', telefone: '5562999990004', tipo: 'CONFIRMACAO_SEMANAL', conteudo: 'Mensagem simulada de confirmação semanal.', status: 'SIMULADO' }
    ];
    const dados = () => ({ sucesso: true, mensagem: 'Dados carregados.', dados: {
      pacientes, logs, configuracoes: { nomeDentista: 'Dentista Teste', nomeFaculdade: 'Faculdade Teste', modoTeste: true, diasConfirmacao: 7, timezone: 'America/Sao_Paulo' },
      statusDisponiveis: ['Agendado', 'Aguardando confirmação', 'Confirmado', 'Cancelado', 'Atendido', 'Faltou'], servidorAgora: '2026-08-17 09:00:00'
    }});
    const executar = (funcao, argumentos) => {
      if (funcao === 'obterDadosAplicacao') return dados();
      if (funcao === 'atualizarStatusPaciente') {
        pacientes = pacientes.map(item => item.id === argumentos[0] ? { ...item, status: argumentos[1] } : item);
        return { sucesso: true, mensagem: 'Status atualizado.', dados: null };
      }
      if (funcao === 'excluirPaciente') {
        pacientes = pacientes.filter(item => item.id !== argumentos[0]);
        return { sucesso: true, mensagem: 'Agendamento excluído.', dados: null };
      }
      return { sucesso: true, mensagem: 'Operação simulada concluída.', dados: funcao === 'importarPacientes' ? { importados: 1, erros: [] } : null };
    };
    const construir = handlers => new Proxy({}, {
      get(_, prop) {
        if (prop === 'withSuccessHandler') return fn => construir({ ...handlers, success: fn });
        if (prop === 'withFailureHandler') return fn => construir({ ...handlers, failure: fn });
        return (...args) => setTimeout(() => {
          try { handlers.success?.(executar(String(prop), args)); } catch (error) { handlers.failure?.(error); }
        }, 120);
      }
    });
    window.google = { script: { run: construir({}) } };
  })();
</script>`;

const html = read('Index.html')
  .replace("<?!= include('Styles'); ?>", styles)
  .replace("<?!= include('Scripts'); ?>", `${mock}\n${scripts}`);

const server = http.createServer((request, response) => {
  if (request.url === '/' || request.url === '/index.html') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(html);
    return;
  }
  response.writeHead(404);
  response.end('Not found');
});

server.listen(4173, '127.0.0.1', () => console.log('Preview em http://127.0.0.1:4173'));

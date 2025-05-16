const WebSocket = require('ws');

const wsUrl = 'ws://localhost:8080';

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
    console.log('Conectado ao servidor WebSocket.');

    const valor = 100;
    ws.send(valor);
    console.log(`Mensagem enviada: ${valor}`);
});

ws.on('message', (message) => {
    console.log(`Mensagem recebida do servidor: ${message.toString()}`);
});

ws.on('close', () => {
    console.log('Conexão WebSocket fechada.');
});

ws.on('error', (error) => {
    console.error('Erro na conexão WebSocket:', error);
});

const WebSocket = require('ws');
const cookie = require('cookie');

const TokenService = require("./App/Services/TokenService");

let wss = null;

function createWebSocketServer(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('Клиент подключился по WebSocket');
    const cookies = cookie.parse(req.headers.cookie || '');
    const access_token = cookies['access_token'] || false;

    if (!access_token) {
      ws.close(1008, 'Unauthorized: No token');
      return;
    }
    
    const decoded = TokenService.verifyAccessTokenWS(access_token);
    //console.log(decoded);

    ws.user = decoded;

    // ws.on('message', (message) => {
    //   console.log('Получено сообщение:', message.toString());
    //   wss.clients.forEach((client) => {
    //     if (client.readyState === WebSocket.OPEN) {
    //       client.send(`Эхо: ${message}`);
    //     }
    //   });
    // });

    //ws.send('Добро пожаловать в WebSocket сервер!');
  });

  return wss;
}

function getWss() {
  if (!wss) {
    throw new Error("WebSocket сервер ещё не инициализирован");
  }
  return wss;
}

module.exports = {
  createWebSocketServer,
  getWss
};

const httpHelper = require('../Helpers/HTTP_Helper');
const TokenService = require('../Services/TokenService');
const dbService = require('../Services/DatabaseService');

const { getWss } = require('../../WebSocketServer');
const axios = require('axios');
const config = require('../config/config');

//chat_id, wss
exports.handleBotResponse = async (chat_id, user_id) => {
    try {
        const wss = getWss();
        const query = "SELECT message_role, message_content FROM messages WHERE chat_id = $1 ORDER BY id LIMIT 200";
        const messages = await dbService.executeQuery(query, [chat_id]);
    
        const formattedMessages = messages.rows.map(msg => ({
          role: msg.message_role,
          content: msg.message_content
        }));

        //добавлено временное сообщение в процессе генерации текста
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client.user && client.user.user_id === user_id) {
            client.send(JSON.stringify({
              role: "assistant",
              message: "Сообщение генерируется...",
              id: Date.now() % 1000000000,
              isGenerating: true
            }));
          }
        });
        console.log("Temp message sent!");
    
        //'http://127.0.0.1:8133/generate'
        const response = await axios.post(`${config.LLM_SERVICE_URL}/generate`, {
          messages: formattedMessages
        });
    
        const botReply = response.data.response;
    

        //ДОБАВИТЬ возврат настоящего ID из базы данных для сообщения бота - один хрен ждем пока запишется в БД - TODO
        const insertBotMessage = "INSERT INTO messages (chat_id, message_role, message_content) VALUES($1, $2, $3)";
        await dbService.executeQuery(insertBotMessage, [chat_id, "assistant", botReply]);
    
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client.user && client.user.user_id === user_id) {
            client.send(JSON.stringify({
              role: "assistant",
              message: botReply
            }));
          }
        });
        console.log("Actual message sent!");
    
      } catch (error) {
        //console.error('Ошибка в handleBotResponse:', error);
        const wss = getWss();
        wss.clients.forEach((client) => {
          console.log("Sending to user id ", user_id);
          console.log("Client: ", client.user);
          if (client.readyState === WebSocket.OPEN && client.user.user_id === user_id) {
            console.log("Sending to client id ", client.user.user_id);
            client.send(JSON.stringify({
              role: "assistant",
              message: "Произошла ошибка при генерации сообщения",
              status: "error"
            }));
          }
        });
      }
};



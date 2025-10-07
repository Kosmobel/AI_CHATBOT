require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./App/Routes/UserRoutes');
const httpHelper = require('./App/Helpers/HTTP_Helper');
const cookieParser = require('cookie-parser');

const { createWebSocketServer } = require('./WebSocketServer');
const http = require('http');

const config = require('./App/config/config');

const initDatabase = require('./App/config/initDatabase');



async function startServer() {
  try {
    await initDatabase(); //ждем, пока БД будет готова
    console.log('База данных инициализирована');

    const app = express();

    app.use(cors({
      origin: config.CORS_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }));
    app.use(express.json());
    app.use(cookieParser());

    app.use('/api', userRoutes);

    app.use((req, res) => {
      httpHelper.sendJsonResponse(res, { error: 'Wrong routing' }, 400);
    });

    const server = http.createServer(app);
    createWebSocketServer(server);

    const PORT = config.SELF_PORT || 3001;
    server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
  } catch (err) {
    console.error('Ошибка инициализации базы данных:', err);
    process.exit(1); //если БД не поднялась то завершаем
  }
}

startServer();

const express = require('express');
const router = express.Router();
const UserController = require('../Controllers/UserController');
const { verifyAccessToken, verifyRefreshToken } = require('../Middlewares/AuthMiddleware');

const multer = require('multer');




router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.delete('/logout', UserController.logout);

router.post('/refresh_access', verifyRefreshToken, async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.refresh_access(req, res);
});

//юзал для инициализации, переделать под метаданные чатов
//LEGACY, DO NOT USE IN PROD <!--ONLY FOR TESTING--!> FROM NOW ON 31.03.2025!
router.get('/user/chats', verifyAccessToken, async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.chatsInit(req, res);
});

//Добавление сообщения в чат ОК
router.put('/user/chats/messages', verifyAccessToken, async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.chatsPutMessage(req, res);
});

//Получение сообщений с ПАГИНАЦИЕЙ!
router.get('/user/chats/messages', verifyAccessToken, async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.chatsGetMessages(req, res);
});

//НУЖНО для создания чата
router.post('/user/chats', verifyAccessToken, async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.chatsCreateChat(req, res);
});

//МЕТАДАННЫЕ ЧАТОВ, ДЛЯ ПАГИНАЦИИ И ПРОЧ.
router.get('/user/chats/meta', verifyAccessToken, async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.chatsGetMeta(req, res);
});

//Запрос конкретного чата, для маршрутизации на клиенте
router.get('/user/chats/meta/:chat_id', verifyAccessToken, async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.chatsGetMetaSpecific(req, res);
});

router.delete('/user/chats', verifyAccessToken, async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.chatsDeleteChat(req, res);
});

router.post('/user/chats/search', verifyAccessToken, async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.chatsSearchChat(req, res);
});

//для аудио
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, //10Мбайт
});

router.post('/user/speech-to-text', verifyAccessToken, upload.single('audio'), async (req, res) => {
    const UserController = require('../Controllers/UserController');
    return UserController.speechToText(req, res);
});


module.exports = router;

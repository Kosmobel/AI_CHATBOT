const httpHelper = require('../Helpers/HTTP_Helper');
const TokenService = require('../Services/TokenService');
const dbService = require('../Services/DatabaseService');
const bcrypt = require('bcrypt');
const HTTP_Helper = require('../Helpers/HTTP_Helper');
const { resolveMx } = require('dns');
const { console } = require('inspector');

const BotController = require('./BotController');
const { error } = require('console');

const FormData = require('form-data');
const axios = require('axios');

const config = require('../config/config');



const setAuthCookies = (res, { access_token, refresh_token }) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'Strict' : 'Lax',
  };

  if(refresh_token) res.cookie('refresh_token', refresh_token, cookieOptions);
  
  if(access_token) res.cookie('access_token', access_token, cookieOptions);
}

const clearAuthCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'Strict' : 'Lax',
  };

  res.clearCookie('refresh_token', cookieOptions);
  res.clearCookie('access_token', cookieOptions);
}

exports.register = async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return httpHelper.sendJsonResponse(res, { error: 'username and password are required' }, 400);
      }
  
      const password_hash = await bcrypt.hash(password, 10);
  
      const checkUserQuery = 'SELECT id FROM users WHERE username = $1';
      const userCheck = await dbService.executeQuery(checkUserQuery, [username]);
  
      if (userCheck.rowCount > 0) {
        return httpHelper.sendJsonResponse(res, { error: 'Username already taken' }, 409);
      }
  
      const insertQuery = 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id';
      const result = await dbService.executeQuery(insertQuery, [username, password_hash]);
  
      const user_id = result.rows[0].id;

      //тут создадим для юзера сразу новый чатик
      const newChatQuery = "INSERT INTO chats (user_id) VALUES ($1)";
      await dbService.executeQuery(newChatQuery, [user_id]);
  
      const access_token = TokenService.generateToken(user_id);
      const refresh_token = TokenService.generateToken(user_id, true);
  
      await TokenService.storeRefreshToken(user_id, refresh_token);
  
      //res.cookie('refresh_token', refresh_token, { httpOnly: true, secure: true, sameSite: 'Strict' });
      //res.cookie('access_token', access_token, { httpOnly: true, secure: true, sameSite: 'Strict' });
      setAuthCookies(res, { access_token, refresh_token} );


      return httpHelper.sendJsonResponse(res, {
        message: 'User registered successfully'
      }, 201);

  
    } catch (err) {
      console.error(err);
      return httpHelper.sendJsonResponse(res, { error: 'Internal server error', message: err.message }, 500);
    }
  };

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return httpHelper.sendJsonResponse(res, { error: 'username and password are required' }, 400);
        }

        console.log(username + ' ' + password);

        const selectQuery = "SELECT id, password_hash FROM users WHERE username = $1";
        const result = await dbService.executeQuery(selectQuery, [username]);

        //console.log(result);

        if(result.rowCount > 0){
            const user = result.rows[0];
            var {id: user_id, password_hash} = user;
        }
        else {
          return HTTP_Helper.sendJsonResponse(res, {error: 'Invalid credentials'}, 401);
        }

        console.log('Checking passwd with hash: ');
        console.log(password_hash);

        const isPasswordValid = await bcrypt.compare(password, password_hash);

        if(!isPasswordValid){
            return HTTP_Helper.sendJsonResponse(res, {error: 'Invalid credentials'}, 401);
        }

        console.log('Password valid: ' + isPasswordValid);
        console.log('User id: ' + user_id);

        let {access_token, refresh_token} = HTTP_Helper.getTokensFromCookies(req);

        console.log('Got headers: ', req.headers);
        console.log('Got access token from user: ', access_token);
        console.log('Got refresh token from user: ', refresh_token);

        refresh_token = await TokenService.getOrCreateRefreshToken(user_id);

        //Сценарий 1: оба токена отсутствуют
        if(!access_token){

            console.log('Before generating tokens:', user_id);
            access_token = TokenService.generateToken(user_id);

            //console.log('Access: ', access_token);            
            //console.log('Generated: ' + access_token + ' ' + refresh_token);

            //res.cookie('refresh_token', refresh_token, { httpOnly: true, secure: true, sameSite: 'Strict' });
            //res.cookie('access_token', access_token, { httpOnly: true, secure: true, sameSite: 'Strict' });
            setAuthCookies(res, { access_token, refresh_token} );

            return HTTP_Helper.sendJsonResponse(res, { message: 'Successfully logined' });


        }
        else {
          //res.cookie('refresh_token', refresh_token, { httpOnly: true, secure: true, sameSite: 'Strict' });
          setAuthCookies(res, { refresh_token} );

          return HTTP_Helper.sendJsonResponse(res, { message: 'Successfully logined' });
          
        }

    }
    catch(err) {
        console.log('Login func', err);
    }

    //httpHelper.sendJsonResponse(res, { message: 'Logined'});
  };

exports.refresh_access = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const access_token = TokenService.generateToken(user_id);
        //res.cookie('access_token', access_token, { httpOnly: true, secure: true, sameSite: 'Strict' });
        setAuthCookies(res, { access_token} );
        return httpHelper.sendJsonResponse(res, { access_token: 'Refreshed access in cookie' });
    }
    catch(err){
        console.log('Refresh acces func: ', err)
    }
  };

exports.chatsInit = async (req, res) => {

  try {
    const selectQuery = "SELECT * FROM GET_ALL_USER_CHATS($1);";
    const result = await dbService.executeQuery(selectQuery, [req.user.user_id]);

    const chats = result.rows.reduce((acc, row) => {
      let chat = acc.find(c => c.chat_id === row.chat_id);
  
      if (!chat) {
          chat = {
              chat_id: row.chat_id,
              chat_name: row.chat_name,
              chat_time: row.chat_time,
              messages: []
          };
          acc.push(chat);
      }
  
      chat.messages.push({
          message_id: row.message_id,
          role: row.message_role,
          message: row.message_content,
          message_time: row.message_time
      });
  
      return acc;
  }, []);
  return HTTP_Helper.sendJsonResponse(res, {chats: chats});

  }
  catch(e) {
    console.log("ChatsGet error: ", e);
    return HTTP_Helper.sendJsonResponse(res, {error: "Something went wrong!"}, 500);
  }
};

//СДЕЛАТЬ ПРОВЕРКУ НА СУЩЕСТВОВАНИЕ ВООБЩЕ ТАКОГО ЧАТА, СДЕЛАТЬ СОЗДАНИЕ НОВОГО ЧАТА!
exports.chatsPutMessage = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { chat_id, message, role } = req.body;

    if(!chat_id) {
      return httpHelper.sendJsonResponse(res, {error: "Provide chat id"}, 400);
    }

    if(!message) {
      return httpHelper.sendJsonResponse(res, {error: "Provide message"}, 400);
    }

    const query = "INSERT INTO messages (chat_id, message_role, message_content) VALUES($1, $2, $3)";
    await dbService.executeQuery(query, [chat_id, role, message]);
    //NEW
    BotController.handleBotResponse(chat_id, user_id);
    return httpHelper.sendJsonResponse(res, {message: "Added new message"}, 201);
  }
  catch(e) {
    console.log("ChatsPut error: ", e);
    return httpHelper.sendJsonResponse(res, {error: "Something went wrong!"}, 500);
  }
};


exports.chatsCreateChat = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const query = "INSERT INTO chats (user_id) VALUES ($1) RETURNING chats.id, chats.chat_name, chats.created_at;";
    const result = await dbService.executeQuery(query, [user_id]);

    const chat_id = result.rows[0].id;
    const chat_name = result.rows[0].chat_name;
    const chat_time = result.rows[0].created_at;

    return httpHelper.sendJsonResponse(res, {chat_id: chat_id, chat_name: chat_name, chat_time: chat_time}, 201);
  }
  catch(e) {
    console.log(e);
    return httpHelper.sendJsonResponse(res, {error: "Internal server error"}, 500);
  }
  {  }
};
//Пагинация метаданных чатов
exports.chatsGetMeta = async (req, res) => {
  const user_id = req.user.user_id;
  const { last_id } = req.query;
  const elementsPerPage = 30;

  //console.log("User requested page");

  try {
    const query = last_id == 0 ? "SELECT id AS chat_id, chat_name, created_at AS chat_time FROM chats WHERE user_id = $1 ORDER BY chat_time DESC LIMIT $2;" : "SELECT id AS chat_id, chat_name, created_at AS chat_time FROM chats WHERE user_id = $1 AND id < $2 ORDER BY chat_time DESC LIMIT $3;";

    const params = last_id == 0 ? [user_id, elementsPerPage] : [user_id, last_id, elementsPerPage];

    const result = await dbService.executeQuery(query, params);

    const chatsMeta = result.rows.map(row => ({
      chat_id: row.chat_id,
      chat_name: row.chat_name,
      chat_time: row.chat_time,
      messages: []
    }));
    return httpHelper.sendJsonResponse(res, {chats: chatsMeta});
  }
  catch(e) {
    console.log(e);
    return httpHelper.sendJsonResponse(res, {error: e.message}, 500);
  }
};

//получение метаданных одного конкретного чата
exports.chatsGetMetaSpecific = async (req, res) => {
  const user_id = req.user.user_id;
  const chatId = req.params.chat_id;

  console.log("User asked for specific chat: ", chatId);

  try {
    const query = "SELECT id AS chat_id, chat_name, created_at AS chat_time FROM chats WHERE user_id = $1 AND chats.id = $2;";

    const params = [user_id, chatId];

    const result = await dbService.executeQuery(query, params);

    const chatsMeta = result.rows.map(row => ({
      chat_id: row.chat_id,
      chat_name: row.chat_name,
      chat_time: row.chat_time,
      specific: true,
      messages: []
    }));
    return httpHelper.sendJsonResponse(res, {chats: chatsMeta});
  }
  catch(e) {
    console.log(e);
    return httpHelper.sendJsonResponse(res, {error: e.message}, 500);
  }
};

//НЕМНОГО ПЕРЕДЕЛАЛ ЗАПРОС. Теперь передается не page - а last_id.
exports.chatsGetMessages = async (req, res) => {

  console.log("Entering chatsGetMessages");

  const user_id = req.user.user_id;
  const { last_id, chat_id } = req.query;
  const elementsPerPage = 20;

  console.log("Last_id: ", last_id);

  try {
    //ТУТ НАДО ПРОВЕРКУ НА user_id - ОБЯЗАТЕЛЬНО
    const query = last_id == 0 ? "SELECT * FROM (SELECT messages.id AS id, message_role AS role, message_content AS message, messages.created_at AS message_time FROM messages JOIN chats ON messages.chat_id = chats.id WHERE chat_id = $1 AND chats.user_id = $2 ORDER BY message_time DESC LIMIT $3) AS sub_q ORDER BY message_time ASC;" 
    : 
    "SELECT * FROM (SELECT messages.id AS id, message_role AS role, message_content AS message, messages.created_at AS message_time FROM messages JOIN chats ON messages.chat_id = chats.id WHERE chat_id = $1 AND chats.user_id = $2 AND messages.id < $3  ORDER BY message_time DESC LIMIT $4) AS sub_q ORDER BY message_time ASC;";

    const params = last_id == 0 ? [chat_id, user_id, elementsPerPage] : [chat_id, user_id, last_id, elementsPerPage];
    const result = await dbService.executeQuery(query, params);

    const messages = result.rows.map(row => ({
      id: row.id,
      role: row.role,
      message: row.message,
      message_time: row.message_time
    }));

    return httpHelper.sendJsonResponse(res, {messages: messages});
  }

  catch(e) {
    console.log(e);
    return httpHelper.sendJsonResponse(res, {error: e.message}, 500);
  }
};

exports.logout = async (req, res) => {
  try {
    const {refresh_token} = HTTP_Helper.getTokensFromCookies(req);

    console.log('Пришел запрос на logout: ', refresh_token);

    await TokenService.deleteRefreshToken(refresh_token);
    //res.clearCookie('refresh_token', { httpOnly: true, secure: true, sameSite: 'Strict' });
    //res.clearCookie('access_token', { httpOnly: true, secure: true, sameSite: 'Strict' });
    clearAuthCookies(res);
    
    //setAuthCookies(res, { access_token, refresh_token} );

    return httpHelper.sendJsonResponse(res, { message: 'Logged out'});
  }
  catch(err) {
    console.log('Logout error: ', err);
    return HTTP_Helper.sendJsonResponse(res, {error: err}, 500);
  }
};

//добавить также where условия для user_id ВАЖНО
exports.chatsDeleteChat = async (req, res) => {
  try {
    const { chat_id } = req.query;
    const query = 'DELETE FROM chats WHERE id = $1';
    await dbService.executeQuery(query, [chat_id]);
    return httpHelper.sendJsonResponse(res, {message: 'Ok'}, 200);
  }
  catch(err) {
    return httpHelper.sendJsonResponse(res, {error: 'Internal server error'}, 500);
  }
}

exports.chatsSearchChat = async (req, res) => {
  const user_id = req.user.user_id;
  const { chat_name } = req.body;

  //console.log("User requested page: ", page);

  try {
    const query = "SELECT id AS chat_id, chat_name, created_at AS chat_time FROM chats WHERE user_id = $1 AND chat_name ILIKE $2 ORDER BY chat_time DESC LIMIT 100";
    //ограничил выборку в 100 записей (в будущем надо сделать расчет контекста в токенах)

    const search_param = `%${chat_name}%`;

    //console.log("Searching with params: ", params);

    const result = await dbService.executeQuery(query, [user_id, search_param]);

    console.log("Search results: ", result);

    const chatsMeta = result.rows.map(row => ({
      chat_id: row.chat_id,
      chat_name: row.chat_name,
      chat_time: row.chat_time,
      messages: []
    }));
    return httpHelper.sendJsonResponse(res, {chats: chatsMeta});
  }
  catch(e) {
    console.log(e);
    return httpHelper.sendJsonResponse(res, {error: e.message}, 500);
  }
}


exports.speechToText = async (req, res) => {
  const user_id = req.user.user_id;
  //const { chat_name } = req.body;

  console.log("Начинаем распазнавать речь...");

  //console.log("User requested page: ", page);

  try {
    if (!req.file) {
      return httpHelper.sendJsonResponse(res, {error: 'Аудиофайл не загружен'}, 400);
    }
    const formData = new FormData();
      formData.append('audio', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      knownLength: req.file.size,
    });

    //`${config.LLM_SERVICE_URL}`
    //'http://localhost:8134/voice_service/speech_to_text'
    const response = await axios.post(`${config.VOICE_SERVICE_URL}/speech_to_text`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return httpHelper.sendJsonResponse(res, {text: response.data.text.trim()}, 200)
  }
  catch(e) {
    console.error(e);
    return httpHelper.sendJsonResponse(res, {error: e.message}, 500);
  }
}

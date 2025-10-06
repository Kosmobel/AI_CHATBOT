const { Client, Pool } = require('pg');
const config = require('./config');

const {
  PGHOST,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPORT
} = config;

async function ensureDatabaseExists() {
  const client = new Client({
    host: PGHOST,
    user: PGUSER,
    password: PGPASSWORD,
    database: 'postgres', //системная БД
    port: PGPORT,
  });

  try {
    await client.connect();

    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [PGDATABASE]
    );

    if (res.rowCount === 0) {
      console.log(`БД "${PGDATABASE}" не найдена. Создаю...`);
      await client.query(`CREATE DATABASE "${PGDATABASE}"`);
      console.log(`БД "${PGDATABASE}" успешно создана.`);
    } else {
      console.log(`БД "${PGDATABASE}" уже существует.`);
    }
  } catch (err) {
    console.error('Ошибка при проверке/создании БД:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function initializeSchema() {
  const pool = new Pool({
    host: PGHOST,
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE, //теперь уже нужная база
    port: PGPORT,
  });

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, 
        username VARCHAR(255) UNIQUE, 
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY, 
        chat_name VARCHAR(255) DEFAULT 'New chat',
        user_id INT REFERENCES users(id) ON DELETE CASCADE, 
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INT REFERENCES chats(id) ON DELETE CASCADE, 
        message_role VARCHAR(50), 
        message_content TEXT, 
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY, 
        user_id INT REFERENCES users(id) ON DELETE CASCADE, 
        token VARCHAR(512) UNIQUE NOT NULL, 
        expires_at TIMESTAMPTZ, 
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION GET_ALL_USER_CHATS(in_user_id INT) RETURNS 
      TABLE (
        chat_id INT,
        chat_name TEXT,
        message_role TEXT,
        message_content TEXT,
        message_id INT,
        message_time TIMESTAMPTZ,
        chat_time TIMESTAMPTZ
      ) 
      AS 
      $$
      SELECT chat_id, chat_name, message_role, message_content, message_id, message_time, chat_time
      FROM (
        SELECT messages.chat_id, chats.chat_name, messages.message_role, messages.message_content, 
               messages.id AS message_id, messages.created_at AS message_time, chats.created_at AS chat_time
        FROM messages
        INNER JOIN chats ON messages.chat_id = chats.id 
        INNER JOIN users ON chats.user_id = users.id
        WHERE users.id = in_user_id
        AND messages.id IN (
            SELECT id FROM messages AS sub_m
            WHERE sub_m.chat_id = messages.chat_id
            ORDER BY sub_m.created_at DESC
            LIMIT 20
        )
        ORDER BY chats.created_at DESC
        LIMIT 20
      ) AS subquery
      ORDER BY chat_id ASC, message_time ASC;
      $$
      LANGUAGE SQL;
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_chat_name_on_first_message()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (SELECT COUNT(*) FROM messages WHERE chat_id = NEW.chat_id) = 0 THEN
          UPDATE chats
          SET chat_name = LEFT(NEW.message_content, 40)
          WHERE id = NEW.chat_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_chat_name_on_first_message ON messages;
      
      CREATE TRIGGER set_chat_name_on_first_message
      BEFORE INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_chat_name_on_first_message();
    `);

    console.log('Схема базы данных успешно инициализирована!');
  } catch (err) {
    console.error('Ошибка инициализации схемы:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

async function initDatabase() {
  await ensureDatabaseExists();
  await initializeSchema();
}

module.exports = initDatabase;

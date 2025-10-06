const { Pool } = require('pg');
require('dotenv').config();
const config = require('../config/config');



class DatabaseService {
  constructor() {
    this.pool = new Pool({
      host: config.PGHOST,
      user: config.PGUSER,
      password: config.PGPASSWORD,
      database: config.PGDATABASE,
      port: config.PGPORT,
    });
  }

  async executeQuery(query, parameters) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, parameters);
      return result;
    } finally {
      client.release();
    }
  }

  //для получения экземпляра pool, если нужно. Лучше не использовать без ОСТРОЙ необходимости (!!!)
  getPool() {
    return this.pool;
  }
}

module.exports = new DatabaseService();
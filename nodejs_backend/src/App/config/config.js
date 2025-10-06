require('dotenv').config();

const config = {
    MODE: process.env.MODE,
    SELF_PORT: process.env.SELF_PORT,

    CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://192.168.3.100:3000', 'http://192.168.3.6:3000'],


    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,


    PGHOST: process.env.PGHOST,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGDATABASE: process.env.PGDATABASE,
    PGPORT: process.env.PGPORT,

    LLM_SERVICE_API_PREFIX: process.env.LLM_SERVICE_API_PREFIX,
    LLM_SERVICE_HOST: process.env.LLM_SERVICE_HOST,
    LLM_SERVICE_PORT: process.env.LLM_SERVICE_PORT,

    VOICE_SERVICE_API_PREFIX: process.env.VOICE_SERVICE_API_PREFIX,
    VOICE_SERVICE_HOST: process.env.VOICE_SERVICE_HOST,
    VOICE_SERVICE_PORT: process.env.VOICE_SERVICE_PORT,

    get LLM_SERVICE_URL() {
        return `http://${this.LLM_SERVICE_HOST}:${this.LLM_SERVICE_PORT}/${this.LLM_SERVICE_API_PREFIX}`;
    },
    get VOICE_SERVICE_URL() {
        return `http://${this.VOICE_SERVICE_HOST}:${this.VOICE_SERVICE_PORT}/${this.VOICE_SERVICE_API_PREFIX}`;
    },

};

module.exports = config;

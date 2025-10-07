const MODE = process.env.REACT_APP_MODE || 'dev';

const config = {
  MODE,
  API_HOST: MODE === 'prod' ? process.env.REACT_APP_API_HOST_PROD || '192.168.3.100' : process.env.REACT_APP_API_HOST_DEV || 'localhost',
  API_PORT: process.env.REACT_APP_API_PORT || '3001',
  API_PREFIX: process.env.REACT_APP_API_PREFIX || 'api',

  get API_FULL_URL() {
    return `http://${this.API_HOST}:${this.API_PORT}/${this.API_PREFIX}`;
  },
  get WS_URL() {
    return `ws://${this.API_HOST}:${this.API_PORT}`;
  },
};

export default config;

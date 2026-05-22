// API and environment configuration
const DEV_API_URL = 'http://localhost:3000/api/v1';
const PROD_API_URL = 'https://api.synapse.app/api/v1'; // Update before production

export const Config = {
  API_URL: __DEV__ ? DEV_API_URL : PROD_API_URL,
  TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p',
  REQUEST_TIMEOUT: 15000,
  CHECKIN_POINTS: 50,
  DISCOUNT_PERCENT: 20,
};

export default Config;

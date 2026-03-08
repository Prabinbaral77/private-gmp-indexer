import { cleanEnv, port, str, url } from 'envalid';

const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str({ default: 'development' }),
    PORT: port({ default: 3000 }),
    DB_HOST: str(),
    DB_PORT: port({ default: 5432 }),
    DB_DATABASE: str(),
    DB_USERNAME: str(),
    DB_PASSWORD: str(),
    ALEO_NODE_URL: url(),
    ALEO_NETWORK: str({ default: 'testnet' }),
    ALEO_VIEW_KEY: str(),
  });
};

export default validateEnv;

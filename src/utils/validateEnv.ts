import { cleanEnv, port, str, url } from 'envalid';

const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str({ default: 'development' }),
    PORT: port({ default: 3000 }),
    DATABASE_URL: str(),
    ALEO_NODE_URL: url(),
    ALEO_NETWORK: str({ default: 'testnet' }),
    ALEO_VIEW_KEY: str(),
  });
};

export default validateEnv;

import App from './app';
import validateEnv from './utils/validateEnv';
import RecordRoute from './routes/record.route';

validateEnv();

const app = new App([new RecordRoute()]);

app.listen();

import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'reflect-metadata';
import { ENVIRONMENT, PORT, LOG_FORMAT } from './config';
import { runMigrations } from './databases';
import { Routes } from './interfaces/routes.interface';
import errorMiddleware from './middlewares/error.middleware';
import { logger, stream } from './utils/logger';
import { createServer, Server } from 'http';

class App {
  public app: express.Application;
  public server: Server;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.server = createServer(this.app);
    this.env = ENVIRONMENT || 'development';
    this.port = PORT || 3000;

    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen() {
    this.server.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  private async initializeDatabase() {
    try {
      await runMigrations();
      logger.info('PostgreSQL connected and migrations run.');
    } catch (error) {
      logger.error('Failed to initialize PostgreSQL:', error);
    }
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: '*' }));
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default App;

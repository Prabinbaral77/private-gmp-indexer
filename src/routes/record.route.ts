import { Router } from 'express';
import RecordController from '../controllers/record.controller';
import { CreateRecordDto } from '../dtos/record.dto';
import { Routes } from '../interfaces/routes.interface';
import validationMiddleware from '../middlewares/validation.middleware';

class RecordRoute implements Routes {
  public path = '/record';
  public router = Router();
  public recordController = new RecordController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, validationMiddleware(CreateRecordDto, 'body'), this.recordController.indexRecord);
  }
}

export default RecordRoute;

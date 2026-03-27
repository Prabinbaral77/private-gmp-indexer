import { Router } from 'express';
import RecordController from '../controllers/record.controller.js';
import { createRecordSchema } from '../dtos/record.dto.js';
import { Routes } from '../interfaces/routes.interface.js';
import validationMiddleware from '../middlewares/validation.middleware.js';

class RecordRoute implements Routes {
  public path = '/gmp/private/record';
  public router = Router();
  public recordController = new RecordController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, validationMiddleware(createRecordSchema, 'body'), this.recordController.indexRecord);
    this.router.get(`${this.path}s/spent`, this.recordController.getSpentRecords);
    this.router.get(`${this.path}s/unspent`, this.recordController.getUnspentRecords);
    this.router.get(`${this.path}/:commitment`, this.recordController.getRecordByCommitment);
  }
}

export default RecordRoute;

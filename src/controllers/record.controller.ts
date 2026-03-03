import { NextFunction, Request, Response } from 'express';
import recordService from '../services/record.service';
import { CreateRecordDto } from '../dtos/record.dto';

class RecordController {
  public indexRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recordData: CreateRecordDto = req.body;
      const result = await recordService.indexRecord(recordData.txHash);

      res.status(201).json({
        success: true,
        message: 'Record added successfully',
        data: {
          tx_hash: result.tx_hash,
          generated_hash: result.generated_hash,
          commitment_hash: result.commitment_hash,
          created_at: result.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default RecordController;

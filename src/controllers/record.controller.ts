import { NextFunction, Request, Response } from 'express';
import recordService from '../services/record.service';
import { CreateRecordDto } from '../dtos/record.dto';
import { log } from 'console';

class RecordController {
  public indexRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('Received request to index record with body:', req.body);
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

  public getRecordByCommitment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { commitment } = req.params;
      const { record, decrypted } = await recordService.getRecordByCommitment(commitment);

      res.status(200).json({
        success: true,
        data: {
          tx_hash: record.tx_hash,
          commitment_hash: record.commitment_hash,
          generated_hash: record.generated_hash,
          created_at: record.created_at,
          decrypted_record: decrypted,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default RecordController;

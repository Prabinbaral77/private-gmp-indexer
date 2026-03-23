import { NextFunction, Request, Response } from 'express';
import recordService from '../services/record.service';
import { type CreateRecordDto } from '../dtos/record.dto';

class RecordController {
  public indexRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { txHash }: CreateRecordDto = req.body;
      const result = await recordService.indexRecord(txHash);

      res.status(201).json({
        success: true,
        message: 'Record added successfully',
        data: {
          txHash: result.txHash,
          commitmentHash: result.commitmentHash,
          programId: result.programId,
          transitionType: result.transitionType,
          network: result.network,
          isSpent: result.isSpent,
          createdAt: result.createdAt,
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
          txHash: record.txHash,
          commitmentHash: record.commitmentHash,
          programId: record.programId,
          transitionType: record.transitionType,
          network: record.network,
          isSpent: record.isSpent,
          createdAt: record.createdAt,
          decryptedRecord: decrypted,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default RecordController;

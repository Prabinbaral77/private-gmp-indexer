import { z } from 'zod';

export const createRecordSchema = z.object({
  txHash: z.string().min(1, 'Transaction hash is required'),
});

export const getRecordByCommitmentSchema = z.object({
  commitment: z.string().min(1, 'Commitment hash is required'),
});

export type CreateRecordDto = z.infer<typeof createRecordSchema>;
export type GetRecordByCommitmentDto = z.infer<typeof getRecordByCommitmentSchema>;

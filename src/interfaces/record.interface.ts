export interface IRecord {
  id?: number;
  tx_hash: string;
  encrypted_record: string;
  commitment_hash: string;
  generated_hash: string;
  created_at?: Date;
}

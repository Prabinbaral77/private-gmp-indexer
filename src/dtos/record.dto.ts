import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRecordDto {
  @IsString()
  @IsNotEmpty()
  public txHash: string;
}

export class GetRecordByCommitmentDto {
  @IsString()
  @IsNotEmpty()
  public commitment: string;
}

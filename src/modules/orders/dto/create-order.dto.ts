import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId!: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  amount!: number;
}

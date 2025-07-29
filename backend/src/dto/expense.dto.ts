import { IsNotEmpty, IsOptional, IsNumber, IsString, IsDateString, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsDateString()
  expenseDate: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  isIncome?: boolean;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  confidenceScore?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  isIncome?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  confidenceScore?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class ExpenseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'expenseDate' | 'amount' | 'createdAt' = 'expenseDate';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class ExpenseStatsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  @Max(2030)
  year: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;
}
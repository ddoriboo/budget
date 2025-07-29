import { IsNotEmpty, IsOptional, IsNumber, IsString, IsDateString, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ description: '지출 금액', example: 5000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: '카테고리 ID', example: 'uuid-string' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: '지출 장소', example: '스타벅스 강남점' })
  @IsOptional()
  @IsString()
  place?: string;

  @ApiPropertyOptional({ description: '메모', example: '아메리카노 주문' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({ description: '지출 날짜', example: '2024-01-15' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ description: '결제 방법', example: '신용카드' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: '수입 여부', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isIncome?: boolean;

  @ApiPropertyOptional({ description: '대화 세션 ID', example: 'conversation-123' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'AI 신뢰도 점수', example: 0.95, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  confidenceScore?: number;

  @ApiPropertyOptional({ description: '추가 메타데이터', example: { source: 'chat' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ description: '지출 금액', example: 5000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: '카테고리 ID', example: 'uuid-string' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: '지출 장소', example: '스타벅스 강남점' })
  @IsOptional()
  @IsString()
  place?: string;

  @ApiPropertyOptional({ description: '메모', example: '아메리카노 주문' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional({ description: '지출 날짜', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ description: '결제 방법', example: '신용카드' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: '수입 여부', example: false })
  @IsOptional()
  @IsBoolean()
  isIncome?: boolean;

  @ApiPropertyOptional({ description: 'AI 신뢰도 점수', example: 0.95, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  confidenceScore?: number;

  @ApiPropertyOptional({ description: '추가 메타데이터', example: { source: 'manual' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ExpenseQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지 크기', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '카테고리 필터', example: '식비' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '시작 날짜', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료 날짜', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '검색어 (장소, 메모)', example: '스타벅스' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '정렬 기준', example: 'expenseDate', enum: ['expenseDate', 'amount', 'createdAt'] })
  @IsOptional()
  @IsString()
  sortBy?: 'expenseDate' | 'amount' | 'createdAt' = 'expenseDate';

  @ApiPropertyOptional({ description: '정렬 순서', example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class ExpenseStatsDto {
  @ApiProperty({ description: '연도', example: 2024 })
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  @Max(2030)
  year: number;

  @ApiProperty({ description: '월', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;
}
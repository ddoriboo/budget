import { IsNotEmpty, IsOptional, IsString, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatSessionDto {
  @ApiProperty({ description: '세션 ID', example: 'session-123' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiPropertyOptional({ description: '세션 제목', example: '스타벅스 지출 입력' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '초기 메시지 목록', example: [] })
  @IsOptional()
  @IsArray()
  messages?: Record<string, any>[];

  @ApiPropertyOptional({ description: '세션 컨텍스트', example: {} })
  @IsOptional()
  context?: Record<string, any>;
}

export class UpdateChatSessionDto {
  @ApiPropertyOptional({ description: '세션 제목', example: '스타벅스 지출 입력' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '메시지 목록', example: [] })
  @IsOptional()
  @IsArray()
  messages?: Record<string, any>[];

  @ApiPropertyOptional({ description: '세션 컨텍스트', example: {} })
  @IsOptional()
  context?: Record<string, any>;

  @ApiPropertyOptional({ description: '마지막 메시지', example: '지출이 저장되었습니다.' })
  @IsOptional()
  @IsString()
  lastMessage?: string;
}

export class AddMessageDto {
  @ApiProperty({ description: '메시지 타입', example: 'user', enum: ['user', 'ai'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['user', 'ai'])
  type: 'user' | 'ai';

  @ApiProperty({ description: '메시지 내용', example: '어제 스타벅스에서 5천원 썼어' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '추가 데이터 (지출 정보 등)', example: { amount: 5000, place: '스타벅스' } })
  @IsOptional()
  data?: Record<string, any>;
}

export class ConversationHistoryDto {
  @ApiPropertyOptional({ description: '조회할 메시지 개수', example: 10, default: 10 })
  @IsOptional()
  limit?: number = 10;
}
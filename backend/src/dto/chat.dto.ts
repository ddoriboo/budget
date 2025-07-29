import { IsNotEmpty, IsOptional, IsString, IsArray, IsIn } from 'class-validator';

export class CreateChatSessionDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  messages?: Record<string, any>[];

  @IsOptional()
  context?: Record<string, any>;
}

export class UpdateChatSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  messages?: Record<string, any>[];

  @IsOptional()
  context?: Record<string, any>;

  @IsOptional()
  @IsString()
  lastMessage?: string;
}

export class AddMessageDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['user', 'ai'])
  type: 'user' | 'ai';

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  data?: Record<string, any>;
}

export class ConversationHistoryDto {
  @IsOptional()
  limit?: number = 10;
}
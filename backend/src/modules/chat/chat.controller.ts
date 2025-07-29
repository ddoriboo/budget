import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatSessionDto, UpdateChatSessionDto, AddMessageDto, ConversationHistoryDto } from '../../dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  async createSession(@Body() createChatSessionDto: CreateChatSessionDto, @Request() req) {
    return await this.chatService.create(createChatSessionDto, req.user.id);
  }

  @Get('sessions')
  async getSessions(@Request() req) {
    return await this.chatService.findAll(req.user.id);
  }

  @Get('sessions/current')
  async getCurrentSession(@Request() req) {
    return await this.chatService.getCurrentSession(req.user.id);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string, @Request() req) {
    return await this.chatService.findOne(id, req.user.id);
  }

  @Get('sessions/:id/history')
  async getConversationHistory(
    @Param('id') id: string,
    @Query() query: ConversationHistoryDto,
    @Request() req
  ) {
    return await this.chatService.getConversationHistory(id, req.user.id, query.limit);
  }

  @Patch('sessions/:id')
  async updateSession(
    @Param('id') id: string,
    @Body() updateChatSessionDto: UpdateChatSessionDto,
    @Request() req
  ) {
    return await this.chatService.update(id, updateChatSessionDto, req.user.id);
  }

  @Post('sessions/:id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() addMessageDto: AddMessageDto,
    @Request() req
  ) {
    return await this.chatService.addMessage(id, addMessageDto, req.user.id);
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string, @Request() req) {
    await this.chatService.remove(id, req.user.id);
    return { message: '채팅 세션이 성공적으로 삭제되었습니다.' };
  }

  @Post('sessions/cleanup')
  async cleanupOldSessions(@Request() req) {
    await this.chatService.cleanupOldSessions(req.user.id);
    return { message: '오래된 세션이 정리되었습니다.' };
  }
}
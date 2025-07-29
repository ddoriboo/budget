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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatSessionDto, UpdateChatSessionDto, AddMessageDto, ConversationHistoryDto } from '../../dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  @ApiOperation({ summary: '채팅 세션 생성' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '채팅 세션이 성공적으로 생성됨' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 사용자' })
  async createSession(@Body() createChatSessionDto: CreateChatSessionDto, @Request() req) {
    return await this.chatService.create(createChatSessionDto, req.user.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: '채팅 세션 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '채팅 세션 목록 조회 성공' })
  async getSessions(@Request() req) {
    return await this.chatService.findAll(req.user.id);
  }

  @Get('sessions/current')
  @ApiOperation({ summary: '현재 활성 채팅 세션 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '현재 세션 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '활성 세션이 없음' })
  async getCurrentSession(@Request() req) {
    return await this.chatService.getCurrentSession(req.user.id);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '특정 채팅 세션 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '채팅 세션 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '채팅 세션을 찾을 수 없음' })
  async getSession(@Param('id') id: string, @Request() req) {
    return await this.chatService.findOne(id, req.user.id);
  }

  @Get('sessions/:id/history')
  @ApiOperation({ summary: '채팅 세션의 대화 히스토리 조회 (OpenAI API용)' })
  @ApiResponse({ status: HttpStatus.OK, description: '대화 히스토리 조회 성공' })
  async getConversationHistory(
    @Param('id') id: string,
    @Query() query: ConversationHistoryDto,
    @Request() req
  ) {
    return await this.chatService.getConversationHistory(id, req.user.id, query.limit);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: '채팅 세션 수정' })
  @ApiResponse({ status: HttpStatus.OK, description: '채팅 세션이 성공적으로 수정됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '채팅 세션을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  async updateSession(
    @Param('id') id: string,
    @Body() updateChatSessionDto: UpdateChatSessionDto,
    @Request() req
  ) {
    return await this.chatService.update(id, updateChatSessionDto, req.user.id);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: '채팅 세션에 메시지 추가' })
  @ApiResponse({ status: HttpStatus.OK, description: '메시지가 성공적으로 추가됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '채팅 세션을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  async addMessage(
    @Param('id') id: string,
    @Body() addMessageDto: AddMessageDto,
    @Request() req
  ) {
    return await this.chatService.addMessage(id, addMessageDto, req.user.id);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: '채팅 세션 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '채팅 세션이 성공적으로 삭제됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '채팅 세션을 찾을 수 없음' })
  async deleteSession(@Param('id') id: string, @Request() req) {
    await this.chatService.remove(id, req.user.id);
    return { message: '채팅 세션이 성공적으로 삭제되었습니다.' };
  }

  @Post('sessions/cleanup')
  @ApiOperation({ summary: '오래된 채팅 세션 정리' })
  @ApiResponse({ status: HttpStatus.OK, description: '세션 정리 완료' })
  async cleanupOldSessions(@Request() req) {
    await this.chatService.cleanupOldSessions(req.user.id);
    return { message: '오래된 세션이 정리되었습니다.' };
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../../entities/chat-session.entity';
import { CreateChatSessionDto, UpdateChatSessionDto, AddMessageDto } from '../../dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
  ) {}

  // 채팅 세션 생성
  async create(createChatSessionDto: CreateChatSessionDto, userId: string): Promise<ChatSession> {
    const chatSession = this.chatSessionRepository.create({
      ...createChatSessionDto,
      userId,
      lastActivity: new Date(),
    });

    return await this.chatSessionRepository.save(chatSession);
  }

  // 사용자의 모든 채팅 세션 조회
  async findAll(userId: string): Promise<ChatSession[]> {
    return await this.chatSessionRepository.find({
      where: { userId },
      order: { lastActivity: 'DESC' },
    });
  }

  // 특정 채팅 세션 조회
  async findOne(id: string, userId: string): Promise<ChatSession> {
    const chatSession = await this.chatSessionRepository.findOne({
      where: { id, userId },
    });

    if (!chatSession) {
      throw new NotFoundException('채팅 세션을 찾을 수 없습니다.');
    }

    return chatSession;
  }

  // 현재 활성 세션 조회 (가장 최근 업데이트된 세션)
  async getCurrentSession(userId: string): Promise<ChatSession | null> {
    return await this.chatSessionRepository.findOne({
      where: { userId },
      order: { lastActivity: 'DESC' },
    });
  }

  // 채팅 세션 수정
  async update(id: string, updateChatSessionDto: UpdateChatSessionDto, userId: string): Promise<ChatSession> {
    const chatSession = await this.findOne(id, userId);

    Object.assign(chatSession, updateChatSessionDto);
    chatSession.lastActivity = new Date();

    return await this.chatSessionRepository.save(chatSession);
  }

  // 메시지 추가
  async addMessage(id: string, addMessageDto: AddMessageDto, userId: string): Promise<ChatSession> {
    const chatSession = await this.findOne(id, userId);

    chatSession.lastMessage = addMessageDto.content;
    chatSession.lastActivity = new Date();

    return await this.chatSessionRepository.save(chatSession);
  }

  // 채팅 세션 삭제
  async remove(id: string, userId: string): Promise<void> {
    const chatSession = await this.findOne(id, userId);
    await this.chatSessionRepository.remove(chatSession);
  }

  // 세션의 메시지 히스토리 조회 (OpenAI API용)
  async getConversationHistory(id: string, userId: string, limit: number = 10): Promise<Array<{role: 'user' | 'assistant', content: string}>> {
    // 현재 데이터베이스 스키마에서 messages 필드가 없으므로 빈 배열 반환
    // 필요시 frontend에서 localStorage를 사용하여 처리
    return [];
  }

  // 세션 정리 (오래된 세션 삭제)
  async cleanupOldSessions(userId: string, keepCount: number = 10): Promise<void> {
    const sessions = await this.chatSessionRepository.find({
      where: { userId },
      order: { lastActivity: 'DESC' },
      skip: keepCount,
    });

    if (sessions.length > 0) {
      await this.chatSessionRepository.remove(sessions);
    }
  }
}
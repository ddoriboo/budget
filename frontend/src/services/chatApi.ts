// 채팅 관련 API 호출 서비스

import { apiClient, ApiResponse } from './apiClient';

// Backend API 응답 타입 (백엔드 DTO와 일치)
export interface ApiChatSession {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    data?: any;
  }>;
  context: Record<string, any>;
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface CreateChatSessionRequest {
  id: string;
  title?: string;
  messages?: Array<any>;
  context?: Record<string, any>;
}

export interface UpdateChatSessionRequest {
  title?: string;
  messages?: Array<any>;
  context?: Record<string, any>;
  lastMessage?: string;
}

export interface AddMessageRequest {
  type: 'user' | 'ai';
  content: string;
  data?: Record<string, any>;
}

export interface ConversationHistoryResponse {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatApiService {
  // 채팅 세션 목록 조회
  async getSessions(): Promise<ApiResponse<ApiChatSession[]>> {
    return apiClient.get<ApiChatSession[]>('/chat/sessions');
  }

  // 현재 활성 세션 조회
  async getCurrentSession(): Promise<ApiResponse<ApiChatSession | null>> {
    return apiClient.get<ApiChatSession | null>('/chat/sessions/current');
  }

  // 특정 세션 조회
  async getSession(id: string): Promise<ApiResponse<ApiChatSession>> {
    return apiClient.get<ApiChatSession>(`/chat/sessions/${id}`);
  }

  // 채팅 세션 생성
  async createSession(data: CreateChatSessionRequest): Promise<ApiResponse<ApiChatSession>> {
    return apiClient.post<ApiChatSession>('/chat/sessions', data);
  }

  // 채팅 세션 수정
  async updateSession(id: string, data: UpdateChatSessionRequest): Promise<ApiResponse<ApiChatSession>> {
    return apiClient.patch<ApiChatSession>(`/chat/sessions/${id}`, data);
  }

  // 메시지 추가
  async addMessage(sessionId: string, data: AddMessageRequest): Promise<ApiResponse<ApiChatSession>> {
    return apiClient.post<ApiChatSession>(`/chat/sessions/${sessionId}/messages`, data);
  }

  // 대화 히스토리 조회 (OpenAI API용)
  async getConversationHistory(sessionId: string, limit: number = 10): Promise<ApiResponse<ConversationHistoryResponse[]>> {
    return apiClient.get<ConversationHistoryResponse[]>(`/chat/sessions/${sessionId}/history`, { limit });
  }

  // 채팅 세션 삭제
  async deleteSession(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/chat/sessions/${id}`);
  }

  // 오래된 세션 정리
  async cleanupOldSessions(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/chat/sessions/cleanup');
  }
}

export const chatApi = new ChatApiService();
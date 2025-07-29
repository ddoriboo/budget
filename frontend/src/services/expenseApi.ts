// 지출 관련 API 호출 서비스

import { apiClient, ApiResponse } from './apiClient';

// Backend API 응답 타입 (백엔드 DTO와 일치)
export interface ApiExpense {
  id: string;
  amount: number;
  categoryId?: string;
  place?: string;
  memo?: string;
  expenseDate: string;
  paymentMethod?: string;
  isIncome: boolean;
  conversationId?: string;
  confidenceScore: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
}

export interface CreateExpenseRequest {
  amount: number;
  categoryId?: string;
  place?: string;
  memo?: string;
  expenseDate: string;
  paymentMethod?: string;
  isIncome?: boolean;
  conversationId?: string;
  confidenceScore?: number;
  metadata?: Record<string, any>;
}

export interface UpdateExpenseRequest {
  amount?: number;
  categoryId?: string;
  place?: string;
  memo?: string;
  expenseDate?: string;
  paymentMethod?: string;
  isIncome?: boolean;
  confidenceScore?: number;
  metadata?: Record<string, any>;
}

export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'expenseDate' | 'amount' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ExpenseListResponse {
  expenses: ApiExpense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseStatsResponse {
  totalExpenses: number;
  totalAmount: number;
  categoryStats: Record<string, number>;
  dailyStats: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}

export class ExpenseApiService {
  // 지출 목록 조회
  async getExpenses(params?: ExpenseQueryParams): Promise<ApiResponse<ExpenseListResponse>> {
    return apiClient.get<ExpenseListResponse>('/expenses', params);
  }

  // 특정 지출 조회
  async getExpense(id: string): Promise<ApiResponse<ApiExpense>> {
    return apiClient.get<ApiExpense>(`/expenses/${id}`);
  }

  // 지출 생성
  async createExpense(data: CreateExpenseRequest): Promise<ApiResponse<ApiExpense>> {
    return apiClient.post<ApiExpense>('/expenses', data);
  }

  // 지출 수정
  async updateExpense(id: string, data: UpdateExpenseRequest): Promise<ApiResponse<ApiExpense>> {
    return apiClient.patch<ApiExpense>(`/expenses/${id}`, data);
  }

  // 지출 삭제
  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/expenses/${id}`);
  }

  // 최근 지출 조회
  async getRecentExpenses(limit: number = 10): Promise<ApiResponse<ApiExpense[]>> {
    return apiClient.get<ApiExpense[]>('/expenses/recent', { limit });
  }

  // 월별 통계
  async getMonthlyStats(year: number, month: number): Promise<ApiResponse<ExpenseStatsResponse>> {
    return apiClient.get<ExpenseStatsResponse>('/expenses/stats', { year, month });
  }

  // 현재 월 통계 (편의 메서드)
  async getCurrentMonthStats(): Promise<ApiResponse<ExpenseStatsResponse>> {
    const now = new Date();
    return this.getMonthlyStats(now.getFullYear(), now.getMonth() + 1);
  }
}

export const expenseApi = new ExpenseApiService();
// Hybrid Storage: API + LocalStorage fallback

import { expenseApi, ExpenseApiService, ApiExpense, CreateExpenseRequest, UpdateExpenseRequest } from '@/services/expenseApi';
import { chatApi, ChatApiService, ApiChatSession, CreateChatSessionRequest, AddMessageRequest } from '@/services/chatApi';

export interface ExpenseItem {
  id: string;
  date: string;
  amount: number;
  category: string;
  subcategory: string;
  place: string;
  memo?: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
  lastMessageAt: Date;
}

const EXPENSES_KEY = 'moneychat_expenses';
const CHAT_SESSIONS_KEY = 'moneychat_chat_sessions';

class ExpenseStore {
  private useApi: boolean = true;

  // API를 먼저 시도하고, 실패하면 localStorage 사용
  private async withFallback<T>(
    apiCall: () => Promise<T>,
    fallbackCall: () => T,
    errorMessage: string = 'API 호출 실패'
  ): Promise<T> {
    if (!this.useApi) {
      return fallbackCall();
    }

    try {
      return await apiCall();
    } catch (error) {
      console.warn(`${errorMessage}, localStorage로 fallback:`, error);
      return fallbackCall();
    }
  }

  // API 데이터를 localStorage 형식으로 변환
  private convertApiExpenseToLocal(apiExpense: ApiExpense): ExpenseItem {
    return {
      id: apiExpense.id,
      date: apiExpense.expenseDate,
      amount: apiExpense.amount,
      category: apiExpense.category?.name || '기타',
      subcategory: apiExpense.category?.name || '기타',
      place: apiExpense.place || '',
      memo: apiExpense.memo,
      confidence: apiExpense.confidenceScore || 1.0,
      createdAt: new Date(apiExpense.createdAt),
      updatedAt: new Date(apiExpense.updatedAt),
    };
  }

  // localStorage 데이터를 API 형식으로 변환
  private convertLocalExpenseToApi(localExpense: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>): CreateExpenseRequest {
    return {
      amount: localExpense.amount,
      place: localExpense.place,
      memo: localExpense.memo,
      expenseDate: localExpense.date,
      confidenceScore: localExpense.confidence,
      metadata: {
        category: localExpense.category,
        subcategory: localExpense.subcategory,
      },
    };
  }

  // 비용 데이터 관리 (하이브리드)
  async getExpenses(): Promise<ExpenseItem[]> {
    return this.withFallback(
      async () => {
        const response = await expenseApi.getExpenses();
        if (response.success && response.data) {
          return response.data.expenses.map(this.convertApiExpenseToLocal);
        }
        throw new Error('API 응답 실패');
      },
      () => {
        try {
          const data = localStorage.getItem(EXPENSES_KEY);
          return data ? JSON.parse(data) : [];
        } catch (error) {
          console.error('localStorage 로드 실패:', error);
          return [];
        }
      },
      '지출 목록 로드'
    );
  }

  addExpense(expense: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>): ExpenseItem {
    const expenses = this.getExpenses();
    const newExpense: ExpenseItem = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    expenses.push(newExpense);
    this.saveExpenses(expenses);
    return newExpense;
  }

  updateExpense(id: string, updates: Partial<ExpenseItem>): ExpenseItem | null {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    expenses[index] = {
      ...expenses[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    this.saveExpenses(expenses);
    return expenses[index];
  }

  deleteExpense(id: string): boolean {
    const expenses = this.getExpenses();
    const filteredExpenses = expenses.filter(e => e.id !== id);
    
    if (filteredExpenses.length === expenses.length) return false;
    
    this.saveExpenses(filteredExpenses);
    return true;
  }

  private saveExpenses(expenses: ExpenseItem[]): void {
    try {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('비용 데이터 저장 실패:', error);
    }
  }

  // 채팅 세션 관리
  getChatSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(CHAT_SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('채팅 세션 로드 실패:', error);
      return [];
    }
  }

  getCurrentSession(): ChatSession | null {
    const sessions = this.getChatSessions();
    return sessions.length > 0 ? sessions[0] : null;
  }

  createNewSession(title?: string): ChatSession {
    const sessions = this.getChatSessions();
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: title || `대화 ${new Date().toLocaleDateString('ko-KR')}`,
      messages: [{
        id: '1',
        type: 'ai',
        content: '안녕하세요! 가계부 입력을 도와드릴게요. 어떤 지출이나 수입이 있으셨나요? 😊',
        timestamp: new Date(),
      }],
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };
    
    sessions.unshift(newSession); // 최신 세션을 맨 앞에
    this.saveChatSessions(sessions);
    return newSession;
  }

  updateSession(sessionId: string, updates: Partial<ChatSession>): ChatSession | null {
    const sessions = this.getChatSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    
    if (index === -1) return null;
    
    sessions[index] = {
      ...sessions[index],
      ...updates,
      lastMessageAt: new Date(),
    };
    
    this.saveChatSessions(sessions);
    return sessions[index];
  }

  addMessageToSession(sessionId: string, message: any): ChatSession | null {
    const sessions = this.getChatSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) return null;
    
    session.messages.push(message);
    session.lastMessageAt = new Date();
    
    this.saveChatSessions(sessions);
    return session;
  }

  private saveChatSessions(sessions: ChatSession[]): void {
    try {
      // 최대 10개 세션만 유지
      const limitedSessions = sessions.slice(0, 10);
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(limitedSessions));
    } catch (error) {
      console.error('채팅 세션 저장 실패:', error);
    }
  }

  // 통계 데이터
  getExpenseStats() {
    const expenses = this.getExpenses();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const thisMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    const totalAmount = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const categoryStats = thisMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses: thisMonthExpenses.length,
      totalAmount,
      categoryStats,
      recentExpenses: expenses.slice(0, 5),
    };
  }

  // 데이터 초기화 (개발/테스트용)
  clearAllData(): void {
    localStorage.removeItem(EXPENSES_KEY);
    localStorage.removeItem(CHAT_SESSIONS_KEY);
  }
}

export const expenseStore = new ExpenseStore();
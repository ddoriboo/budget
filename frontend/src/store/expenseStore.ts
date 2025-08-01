// Hybrid Storage: API + LocalStorage fallback

import { expenseApi, ExpenseApiService, ApiExpense, CreateExpenseRequest, UpdateExpenseRequest } from '@/services/expenseApi';
import { chatApi, ChatApiService, ApiChatSession, CreateChatSessionRequest, AddMessageRequest } from '@/services/chatApi';
import { BudgetStore } from '@/services/budgetService';

export interface ExpenseItem {
  id: string;
  date: string;
  amount: number;
  category: string;
  subcategory: string;
  place: string;
  memo?: string;
  confidence: number;
  type: 'expense' | 'income';
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
  private useApi: boolean = false; // API 사용 여부 (로그인 상태에 따라 변경)
  private eventListeners: Array<() => void> = []; // 데이터 변경 이벤트 리스너

  // 로그인 상태에 따라 API 사용 여부 설정
  setApiMode(useApi: boolean): void {
    this.useApi = useApi;
    console.log(`📡 ExpenseStore API 모드: ${useApi ? 'ON (서버 데이터)' : 'OFF (로컬 데이터)'}`);
  }

  // 현재 API 모드 확인
  isUsingApi(): boolean {
    return this.useApi;
  }

  // 데이터 변경 이벤트 리스너 추가
  addChangeListener(listener: () => void): void {
    this.eventListeners.push(listener);
  }

  // 데이터 변경 이벤트 리스너 제거
  removeChangeListener(listener: () => void): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  // 데이터 변경 알림
  private notifyChange(): void {
    this.eventListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('ExpenseStore listener error:', error);
      }
    });
  }

  // LocalStorage 우선 사용 (오프라인 모드)
  private async withFallback<T>(
    apiCall: () => Promise<T>,
    fallbackCall: () => T,
    errorMessage: string = 'API 호출 실패'
  ): Promise<T> {
    if (!this.useApi) {
      // 오프라인 모드: 바로 localStorage 사용
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
      type: apiExpense.amount >= 0 ? 'expense' : 'income', // API에서 음수는 수입으로 처리
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

  // 비용 데이터 관리 (API 우선, localStorage 폴백)
  async getExpenses(): Promise<ExpenseItem[]> {
    return this.withFallback(
      async () => {
        const response = await expenseApi.getExpenses();
        if (response.success && response.data) {
          return response.data.expenses.map(expense => this.convertApiExpenseToLocal(expense));
        }
        throw new Error('API 응답 실패');
      },
      () => {
        try {
          const data = localStorage.getItem(EXPENSES_KEY);
          return data ? JSON.parse(data) : [];
        } catch (error) {
          console.error('localStorage 데이터 로드 실패:', error);
          return [];
        }
      },
      '지출 목록 조회 실패'
    );
  }

  // 동기 버전 (기존 호환성 유지)
  getExpensesSync(): ExpenseItem[] {
    try {
      const data = localStorage.getItem(EXPENSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('비용 데이터 로드 실패:', error);
      return [];
    }
  }

  async addExpense(expense: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExpenseItem> {
    return this.withFallback(
      async () => {
        const apiExpense = this.convertLocalExpenseToApi(expense);
        const response = await expenseApi.createExpense(apiExpense);
        if (response.success && response.data) {
          const createdExpense = this.convertApiExpenseToLocal(response.data);
          // API 성공 시 localStorage에도 저장
          const localExpenses = this.getExpensesSync();
          localExpenses.push(createdExpense);
          this.saveExpenses(localExpenses);
          this.notifyChange(); // 데이터 변경 알림
          return createdExpense;
        }
        throw new Error('지출 생성 API 실패');
      },
      () => {
        const expenses = this.getExpensesSync();
        const newExpense: ExpenseItem = {
          ...expense,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        expenses.push(newExpense);
        this.saveExpenses(expenses);
        
        // 지출인 경우 예산에서 차감
        if (expense.type === 'expense') {
          BudgetStore.updateSpentAmount(expense.category, expense.amount);
        }
        
        this.notifyChange(); // 데이터 변경 알림
        return newExpense;
      },
      '지출 추가 실패'
    );
  }

  // 동기 버전 (기존 호환성 유지)
  addExpenseSync(expense: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>): ExpenseItem {
    const expenses = this.getExpensesSync();
    const newExpense: ExpenseItem = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    expenses.push(newExpense);
    this.saveExpenses(expenses);
    
    // 지출인 경우 예산에서 차감
    if (expense.type === 'expense') {
      BudgetStore.updateSpentAmount(expense.category, expense.amount);
    }
    
    return newExpense;
  }

  async updateExpense(id: string, updates: Partial<ExpenseItem>): Promise<ExpenseItem | null> {
    return this.withFallback(
      async () => {
        const response = await expenseApi.updateExpense(id, {
          amount: updates.amount,
          place: updates.place,
          memo: updates.memo,
          expenseDate: updates.date,
          confidenceScore: updates.confidence,
        });
        
        if (response.success && response.data) {
          const updatedExpense = this.convertApiExpenseToLocal(response.data);
          // API 성공 시 localStorage도 업데이트
          const localExpenses = this.getExpensesSync();
          const index = localExpenses.findIndex(e => e.id === id);
          if (index !== -1) {
            localExpenses[index] = updatedExpense;
            this.saveExpenses(localExpenses);
          }
          return updatedExpense;
        }
        throw new Error('지출 수정 API 실패');
      },
      () => {
        const expenses = this.getExpensesSync();
        const index = expenses.findIndex(e => e.id === id);
        
        if (index === -1) return null;
        
        expenses[index] = {
          ...expenses[index],
          ...updates,
          updatedAt: new Date(),
        };
        
        this.saveExpenses(expenses);
        return expenses[index];
      },
      '지출 수정 실패'
    );
  }

  // 동기 버전 (기존 호환성 유지)
  updateExpenseSync(id: string, updates: Partial<ExpenseItem>): ExpenseItem | null {
    const expenses = this.getExpensesSync();
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

  async deleteExpense(id: string): Promise<boolean> {
    return this.withFallback(
      async () => {
        const response = await expenseApi.deleteExpense(id);
        if (response.success) {
          // API 성공 시 localStorage에서도 삭제
          const localExpenses = this.getExpensesSync();
          const filteredExpenses = localExpenses.filter(e => e.id !== id);
          this.saveExpenses(filteredExpenses);
          return true;
        }
        throw new Error('지출 삭제 API 실패');
      },
      () => {
        const expenses = this.getExpensesSync();
        const filteredExpenses = expenses.filter(e => e.id !== id);
        
        if (filteredExpenses.length === expenses.length) return false;
        
        this.saveExpenses(filteredExpenses);
        return true;
      },
      '지출 삭제 실패'
    );
  }

  // 동기 버전 (기존 호환성 유지)
  deleteExpenseSync(id: string): boolean {
    const expenses = this.getExpensesSync();
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

  // 통계 데이터 (API 우선)
  async getExpenseStats() {
    return this.withFallback(
      async () => {
        const response = await expenseApi.getCurrentMonthStats();
        if (response.success && response.data) {
          const recentResponse = await expenseApi.getRecentExpenses(5);
          const recentExpenses = recentResponse.success && recentResponse.data 
            ? recentResponse.data.map(expense => this.convertApiExpenseToLocal(expense))
            : [];

          return {
            totalExpenses: response.data.totalExpenses,
            totalAmount: response.data.totalAmount,
            totalIncome: 0, // TODO: API에서 수입 데이터 지원 시 추가
            categoryStats: response.data.categoryStats,
            recentExpenses,
          };
        }
        throw new Error('통계 API 실패');
      },
      () => {
        const expenses = this.getExpensesSync();
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        const thisMonthTransactions = expenses.filter(e => e.date.startsWith(currentMonth));
        
        // 지출과 수입 분리 계산
        const thisMonthExpenses = thisMonthTransactions.filter(e => e.type === 'expense' || !e.type);
        const thisMonthIncome = thisMonthTransactions.filter(e => e.type === 'income');
        
        const totalExpenseAmount = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncomeAmount = thisMonthIncome.reduce((sum, e) => sum + e.amount, 0);
        
        const categoryStats = thisMonthExpenses.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {} as Record<string, number>);

        return {
          totalExpenses: thisMonthExpenses.length,
          totalAmount: totalExpenseAmount,
          totalIncome: totalIncomeAmount,
          categoryStats,
          recentExpenses: expenses.slice(0, 5),
        };
      },
      '통계 조회 실패'
    );
  }

  // 동기 버전 (기존 호환성 유지)
  getExpenseStatsSync() {
    const expenses = this.getExpensesSync();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const thisMonthTransactions = expenses.filter(e => e.date.startsWith(currentMonth));
    
    // 지출과 수입 분리 계산
    const thisMonthExpenses = thisMonthTransactions.filter(e => e.type === 'expense' || !e.type);
    const thisMonthIncome = thisMonthTransactions.filter(e => e.type === 'income');
    
    const totalExpenseAmount = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncomeAmount = thisMonthIncome.reduce((sum, e) => sum + e.amount, 0);
    
    const categoryStats = thisMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses: thisMonthExpenses.length,
      totalAmount: totalExpenseAmount,
      totalIncome: totalIncomeAmount,
      categoryStats,
      recentExpenses: expenses.slice(0, 5),
    };
  }

  // 데이터 초기화 (개발/테스트용)
  clearAllData(): void {
    localStorage.removeItem(EXPENSES_KEY);
    localStorage.removeItem(CHAT_SESSIONS_KEY);
  }

  // 예산 관련 메서드들
  getBudgets() {
    return BudgetStore.getBudgets();
  }

  getBudgetStatus() {
    return BudgetStore.getBudgetStatus();
  }

  createBudget(budgetData: any) {
    return BudgetStore.createBudget(budgetData);
  }

  updateBudget(categoryName: string, updates: any) {
    return BudgetStore.updateBudget(categoryName, updates);
  }

  deleteBudget(categoryName: string) {
    return BudgetStore.deleteBudget(categoryName);
  }

  // 카테고리별 예산 vs 실제 지출 비교
  getCategoryBudgetComparison() {
    const budgets = BudgetStore.getBudgetStatus();
    const expenses = this.getExpensesSync();
    
    // 현재 월의 지출만 필터링
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentMonthExpenses = expenses.filter(expense => 
      expense.date.startsWith(currentMonth) && expense.type === 'expense'
    );
    
    // 카테고리별 실제 지출 계산
    const actualSpending = currentMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // 예산과 실제 지출 비교
    return budgets.map(budget => ({
      ...budget,
      actualSpent: actualSpending[budget.categoryName] || 0,
      budgetUtilization: budget.amount > 0 ? ((actualSpending[budget.categoryName] || 0) / budget.amount) * 100 : 0
    }));
  }

  // 전체 예산 요약
  getBudgetSummary() {
    const comparison = this.getCategoryBudgetComparison();
    const totalBudget = comparison.reduce((sum, item) => sum + item.amount, 0);
    const totalSpent = comparison.reduce((sum, item) => sum + item.actualSpent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overBudgetCategories = comparison.filter(item => item.actualSpent > item.amount);

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overBudgetCategories: overBudgetCategories.length,
      utilizationPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      categoryComparisons: comparison
    };
  }
}

export const expenseStore = new ExpenseStore();
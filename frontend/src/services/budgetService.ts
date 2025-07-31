// Budget Management Service

export interface Budget {
  id: string;
  userId?: string;
  categoryName: string;
  amount: number;
  spent: number;
  periodType: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAnalysisResult {
  success: boolean;
  budgets?: Partial<Budget>[];
  action?: 'create' | 'update' | 'delete' | 'query';
  clarificationNeeded?: boolean;
  clarificationMessage?: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
const BUDGETS_KEY = 'moneychat_budgets';

// 예산 관리 LLM
export const analyzeBudgetRequest = async (
  message: string,
  currentBudgets: Budget[] = []
): Promise<BudgetAnalysisResult> => {
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('⚠️ OpenAI API 키가 없어서 간단한 예산 분석을 사용합니다.');
    return analyzeBudgetFallback(message, currentBudgets);
  }

  const today = new Date().toISOString().split('T')[0];
  const currentBudgetsList = currentBudgets.map(b => 
    `${b.categoryName}: ${b.amount.toLocaleString()}원 (사용: ${b.spent.toLocaleString()}원)`
  ).join('\n');

  const systemPrompt = `
You are a Budget Management AI for a Korean personal finance app. Analyze budget-related requests and provide structured responses.

CURRENT DATE: ${today}

EXISTING BUDGETS:
${currentBudgetsList || '설정된 예산이 없습니다.'}

BUDGET ACTIONS:
1. **CREATE**: Set new budget
   - Examples: "식비 예산 30만원으로 설정", "교통비 월 15만원으로 잡아줘"
   
2. **UPDATE**: Modify existing budget
   - Examples: "식비 예산을 35만원으로 늘려줘", "교통비 예산 줄여줘"
   
3. **DELETE**: Remove budget
   - Examples: "교통비 예산 삭제해줘", "예산 취소"
   
4. **QUERY**: Check budget status
   - Examples: "예산 현황 알려줘", "식비 예산 얼마나 남았어?"

CATEGORIES (use these exactly):
식비, 교통, 쇼핑, 문화/여가, 주거/통신, 건강/의료, 교육, 경조사, 기타

RESPONSE FORMAT (JSON):
{
  "success": true,
  "action": "create|update|delete|query",
  "budgets": [
    {
      "categoryName": "string",
      "amount": number,
      "periodType": "monthly",
      "startDate": "${today}",
      "endDate": null
    }
  ],
  "clarificationNeeded": false,
  "clarificationMessage": null
}

RULES:
1. Always return valid JSON
2. Default to monthly periods unless specified
3. If amount unclear, ask for clarification
4. Use exact category names from the list
5. For updates, provide new amount, not increment

Now analyze this budget request:
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    console.log('Budget Analysis Result:', result);
    return result;

  } catch (error) {
    console.error('Budget Analysis Error:', error);
    return {
      success: false,
      clarificationNeeded: true,
      clarificationMessage: '예산 분석 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
};

// 간단한 키워드 기반 예산 분석 (API 키 없을 때)
const analyzeBudgetFallback = (message: string, currentBudgets: Budget[]): BudgetAnalysisResult => {
  const lowerMessage = message.toLowerCase();
  const today = new Date().toISOString().split('T')[0];
  
  // 예산 조회
  if (lowerMessage.includes('현황') || lowerMessage.includes('알려줘') || lowerMessage.includes('보여줘') || 
      lowerMessage.includes('확인') || lowerMessage.includes('어떻게')) {
    return {
      success: true,
      action: 'query'
    };
  }
  
  // 예산 설정
  const amountMatch = lowerMessage.match(/(\d+)만원/);
  if (amountMatch && (lowerMessage.includes('예산') || lowerMessage.includes('설정') || lowerMessage.includes('잡아'))) {
    const amount = parseInt(amountMatch[1]) * 10000;
    
    // 카테고리 추출
    let categoryName = '기타';
    if (lowerMessage.includes('식비') || lowerMessage.includes('음식')) categoryName = '식비';
    else if (lowerMessage.includes('교통')) categoryName = '교통';
    else if (lowerMessage.includes('쇼핑')) categoryName = '쇼핑';
    else if (lowerMessage.includes('문화') || lowerMessage.includes('여가')) categoryName = '문화/여가';
    else if (lowerMessage.includes('주거') || lowerMessage.includes('통신')) categoryName = '주거/통신';
    else if (lowerMessage.includes('건강') || lowerMessage.includes('의료')) categoryName = '건강/의료';
    else if (lowerMessage.includes('교육')) categoryName = '교육';
    else if (lowerMessage.includes('경조사')) categoryName = '경조사';
    
    return {
      success: true,
      action: 'create',
      budgets: [{
        categoryName,
        amount,
        periodType: 'monthly' as const,
        startDate: today,
        endDate: undefined
      }]
    };
  }
  
  // 전체 예산 설정 (예: "내 이번달 예산은 200만원이야")
  const totalAmountMatch = lowerMessage.match(/(\d+)만원/);
  if (totalAmountMatch && (lowerMessage.includes('이번달') || lowerMessage.includes('이번 달') || 
      lowerMessage.includes('예산은') || lowerMessage.includes('총'))) {
    const amount = parseInt(totalAmountMatch[1]) * 10000;
    
    return {
      success: true,
      action: 'create',
      budgets: [{
        categoryName: '전체',
        amount,
        periodType: 'monthly' as const,
        startDate: today,
        endDate: undefined
      }]
    };
  }
  
  return {
    success: false,
    clarificationNeeded: true,
    clarificationMessage: '예산 설정을 정확히 이해하지 못했어요. 예: "식비 예산 30만원으로 설정해줘"'
  };
};

// 로컬 예산 데이터 관리
export class BudgetStore {
  
  static getBudgets(): Budget[] {
    try {
      const data = localStorage.getItem(BUDGETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('예산 데이터 로드 실패:', error);
      return [];
    }
  }

  static setBudgets(budgets: Budget[]): void {
    try {
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    } catch (error) {
      console.error('예산 데이터 저장 실패:', error);
    }
  }

  static createBudget(budgetData: Omit<Budget, 'id' | 'spent' | 'createdAt' | 'updatedAt'>): Budget {
    const budget: Budget = {
      id: Date.now().toString(),
      spent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...budgetData
    };

    const budgets = this.getBudgets();
    
    // 같은 카테고리의 기존 예산 찾기
    const existingIndex = budgets.findIndex(b => b.categoryName === budget.categoryName);
    
    if (existingIndex >= 0) {
      budgets[existingIndex] = budget;
    } else {
      budgets.push(budget);
    }
    
    this.setBudgets(budgets);
    return budget;
  }

  static updateBudget(categoryName: string, updates: Partial<Budget>): Budget | null {
    const budgets = this.getBudgets();
    const index = budgets.findIndex(b => b.categoryName === categoryName);
    
    if (index >= 0) {
      budgets[index] = {
        ...budgets[index],
        ...updates,
        updatedAt: new Date()
      };
      this.setBudgets(budgets);
      return budgets[index];
    }
    
    return null;
  }

  static deleteBudget(categoryName: string): boolean {
    const budgets = this.getBudgets();
    const filteredBudgets = budgets.filter(b => b.categoryName !== categoryName);
    
    if (filteredBudgets.length < budgets.length) {
      this.setBudgets(filteredBudgets);
      return true;
    }
    
    return false;
  }

  static updateSpentAmount(categoryName: string, amount: number): void {
    const budgets = this.getBudgets();
    const budget = budgets.find(b => b.categoryName === categoryName);
    
    if (budget) {
      budget.spent += amount;
      budget.updatedAt = new Date();
      this.setBudgets(budgets);
    }
  }

  static getBudgetStatus(): Array<Budget & { remaining: number; percentage: number; status: 'safe' | 'warning' | 'exceeded' }> {
    const budgets = this.getBudgets();
    
    return budgets.map(budget => {
      const remaining = budget.amount - budget.spent;
      const percentage = (budget.spent / budget.amount) * 100;
      
      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';
      
      return {
        ...budget,
        remaining,
        percentage,
        status
      };
    });
  }
}
// Intent Analysis Service - LLM Orchestration의 핵심

export enum UserIntent {
  EXPENSE_INCOME = 'EXPENSE_INCOME',
  BUDGET_SETTING = 'BUDGET_SETTING', 
  GOAL_SETTING = 'GOAL_SETTING',
  ANALYSIS_REQUEST = 'ANALYSIS_REQUEST',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
  ACCOUNT_MANAGEMENT = 'ACCOUNT_MANAGEMENT'
}

export interface IntentAnalysisResult {
  intent: UserIntent;
  confidence: number;
  extractedData?: any;
  clarificationNeeded?: boolean;
  clarificationMessage?: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

export const analyzeUserIntent = async (
  message: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<IntentAnalysisResult> => {
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('⚠️ OpenAI API 키가 없어서 fallback 분석을 사용합니다.');
    return fallbackIntentAnalysis(message);
  }

  const systemPrompt = `
You are an Intent Analysis AI for a Korean personal finance app. Your job is to classify user messages into specific intents and extract relevant data.

INTENT CATEGORIES:

1. **EXPENSE_INCOME**: Recording income or expenses
   - Examples: "어제 스벅에서 5천원 썼어", "이번 달 월급 300만원 들어왔어"
   - Keywords: 썼다, 샀다, 먹었다, 결제, 지출, 월급, 받았다, 수입

2. **BUDGET_SETTING**: Setting or managing budgets
   - Examples: "이번 달 식비 예산을 30만원으로 잡아줘", "교통비 예산 늘려줘"
   - Keywords: 예산, 한도, 제한, 설정, 잡아줘, 정해줘

3. **GOAL_SETTING**: Setting financial goals or targets
   - Examples: "올해 저축 목표 500만원으로 설정", "해외여행 자금 모으기"
   - Keywords: 목표, 저축, 모으기, 달성, 계획

4. **ANALYSIS_REQUEST**: Requesting analysis or statistics
   - Examples: "이번 달 지출 얼마나 되는지 알려줘", "지난달과 비교해줘"
   - Keywords: 분석, 통계, 얼마나, 비교, 현황, 상태

5. **GENERAL_INQUIRY**: General questions about features
   - Examples: "가계부 사용법 알려줘", "이 앱 어떻게 써?"
   - Keywords: 사용법, 도움말, 어떻게, 방법

6. **ACCOUNT_MANAGEMENT**: Account or profile related
   - Examples: "비밀번호 바꾸고 싶어", "프로필 수정하기"
   - Keywords: 비밀번호, 프로필, 계정, 설정

RESPONSE FORMAT (JSON):
{
  "intent": "one of the intent categories",
  "confidence": 0.0-1.0,
  "extractedData": {
    // Relevant data based on intent
  },
  "clarificationNeeded": boolean,
  "clarificationMessage": "if clarification needed"
}

ANALYSIS RULES:
1. Always return valid JSON
2. Confidence should reflect how certain you are
3. If message is ambiguous, set clarificationNeeded=true
4. Consider conversation context for better accuracy

Context from previous messages:
${conversationHistory.slice(-3).map(msg => `[${msg.role}]: ${msg.content}`).join('\n')}

Now analyze this user message and return JSON response:
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
        max_tokens: 500,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    console.log('Intent Analysis Result:', result);
    
    return {
      intent: result.intent as UserIntent,
      confidence: result.confidence || 0.8,
      extractedData: result.extractedData,
      clarificationNeeded: result.clarificationNeeded || false,
      clarificationMessage: result.clarificationMessage
    };

  } catch (error) {
    console.error('Intent Analysis Error:', error);
    
    // 간단한 키워드 기반 폴백 분석
    return fallbackIntentAnalysis(message);
  }
};

// 키워드 기반 폴백 분석 (API 실패 시)
const fallbackIntentAnalysis = (message: string): IntentAnalysisResult => {
  console.log('🔧 Fallback Intent 분석 시작:', message);
  const lowerMessage = message.toLowerCase();
  console.log('🔧 소문자 변환:', lowerMessage);
  
  // 예산 관련 키워드 (더 상세하게)
  if (lowerMessage.includes('예산') || lowerMessage.includes('한도') || lowerMessage.includes('제한') ||
      (lowerMessage.includes('만원') && (lowerMessage.includes('설정') || lowerMessage.includes('잡아') || lowerMessage.includes('정해')))) {
    return {
      intent: UserIntent.BUDGET_SETTING,
      confidence: 0.8,
      clarificationNeeded: false
    };
  }
  
  // 목표 관련 키워드
  if (lowerMessage.includes('목표') || lowerMessage.includes('저축') || lowerMessage.includes('모으기')) {
    return {
      intent: UserIntent.GOAL_SETTING,
      confidence: 0.7,
      clarificationNeeded: false
    };
  }
  
  // 분석 요청 키워드
  if (lowerMessage.includes('분석') || lowerMessage.includes('얼마나') || lowerMessage.includes('통계') || 
      lowerMessage.includes('현황') || lowerMessage.includes('알려줘') || lowerMessage.includes('보여줘')) {
    return {
      intent: UserIntent.ANALYSIS_REQUEST,
      confidence: 0.7,
      clarificationNeeded: false
    };
  }
  
  // 도움말/일반 문의
  if (lowerMessage.includes('사용법') || lowerMessage.includes('도움말') || lowerMessage.includes('어떻게') ||
      lowerMessage.includes('방법') || lowerMessage.includes('뭐할') || lowerMessage.includes('뭘할')) {
    return {
      intent: UserIntent.GENERAL_INQUIRY,
      confidence: 0.8,
      clarificationNeeded: false
    };
  }
  
  // 수입/지출 키워드 (더 정확하게)
  const expenseKeywords = ['썼', '샀', '결제', '지출', '먹었', '마셨', '월급', '받았', '수입', '원', '만원', '천원'];
  const matchedKeywords = expenseKeywords.filter(keyword => lowerMessage.includes(keyword));
  console.log('🔧 수입/지출 키워드 매치:', matchedKeywords);
  
  if (matchedKeywords.length > 0) {
    console.log('✅ EXPENSE_INCOME 의도로 분류됨');
    return {
      intent: UserIntent.EXPENSE_INCOME,
      confidence: 0.8,
      clarificationNeeded: false
    };
  }
  
  // 기본값: 수입/지출
  console.log('🔧 기본값으로 EXPENSE_INCOME 반환');
  return {
    intent: UserIntent.EXPENSE_INCOME,
    confidence: 0.6,
    clarificationNeeded: false
  };
};
// Chat Summary Service using OpenAI

export interface ChatSummaryData {
  recentActivity: string;
  spendingPattern: string;
  keyInsights: string[];
  recommendations: string[];
  totalTransactions: number;
  timeframe: string;
}

export interface ChatSummaryResult {
  success: boolean;
  summary?: ChatSummaryData;
  fallbackSummary?: ChatSummaryData;
  error?: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

// LLM을 통한 대화내역 요약
export const summarizeChatHistory = async (
  chatSessions: any[],
  expenses: any[]
): Promise<ChatSummaryResult> => {
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('⚠️ OpenAI API 키가 없어서 간단한 요약을 생성합니다.');
    return generateFallbackSummary(chatSessions, expenses);
  }

  // 최근 7일간의 대화와 거래 데이터 수집
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 7);
  const recentDateStr = recentDate.toISOString().slice(0, 10);

  // 최근 대화 메시지들 수집
  const recentMessages = chatSessions
    .flatMap(session => session.messages || [])
    .filter(msg => msg.timestamp >= recentDate)
    .slice(-20); // 최근 20개 메시지만

  // 최근 거래 데이터 수집
  const recentExpenses = expenses
    .filter(expense => expense.date >= recentDateStr)
    .slice(-15); // 최근 15개 거래만

  const chatContext = recentMessages
    .map(msg => `${msg.type}: ${msg.content}`)
    .join('\n');

  const expenseContext = recentExpenses
    .map(exp => `${exp.date} ${exp.category} ${exp.amount.toLocaleString()}원 ${exp.place}`)
    .join('\n');

  const systemPrompt = `
당신은 한국의 개인 가계부 앱의 지능형 분석가입니다. 사용자의 최근 대화내역과 거래내역을 분석해서 간결하고 실용적인 요약을 제공하세요.

최근 대화내역:
${chatContext || '대화 내역 없음'}

최근 거래내역:
${expenseContext || '거래 내역 없음'}

다음 JSON 형식으로 응답하세요:
{
  "success": true,
  "summary": {
    "recentActivity": "최근 활동 한 줄 요약 (예: 이번 주 카페와 식비 지출이 많았네요)",
    "spendingPattern": "지출 패턴 분석 (예: 주로 오후에 카페 이용, 주말에 외식 집중)",
    "keyInsights": [
      "핵심 인사이트 1 (예: 카페 지출이 전주 대비 30% 증가)",
      "핵심 인사이트 2 (예: 교통비는 일정하게 유지)"
    ],
    "recommendations": [
      "실행 가능한 추천사항 1 (예: 집에서 커피 마시는 날을 늘려보세요)",
      "실행 가능한 추천사항 2 (예: 주말 외식 예산을 미리 정해두세요)"  
    ],
    "totalTransactions": ${recentExpenses.length},
    "timeframe": "최근 7일"
  }
}

규칙:
1. 친근하고 자연스러운 한국어 사용
2. 구체적인 숫자와 카테고리 언급
3. 실행 가능한 조언 제공
4. 간결하고 핵심적인 내용
5. 부정적이지 않고 건설적인 톤
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
          { role: 'user', content: '위 데이터를 분석해서 요약해주세요.' }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    console.log('Chat Summary Result:', result);
    
    // Fallback도 함께 제공
    const fallbackSummary = generateFallbackSummary(chatSessions, expenses);
    
    return {
      ...result,
      fallbackSummary: fallbackSummary.fallbackSummary
    };

  } catch (error) {
    console.error('Chat Summary Error:', error);
    return generateFallbackSummary(chatSessions, expenses);
  }
};

// 간단한 규칙 기반 요약 (API 키 없을 때)
const generateFallbackSummary = (
  chatSessions: any[], 
  expenses: any[]
): ChatSummaryResult => {
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 7);
  const recentDateStr = recentDate.toISOString().slice(0, 10);

  const recentExpenses = expenses.filter(exp => exp.date >= recentDateStr);
  const totalTransactions = recentExpenses.length;

  // 카테고리별 집계
  const categoryStats = recentExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)[0];

  const totalAmount = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const averageDaily = totalAmount / 7;

  // 시간대별 패턴 분석
  const hourlyPattern = recentExpenses.reduce((acc, exp) => {
    const hour = new Date(`${exp.date}T12:00:00`).getHours(); // 기본값으로 12시 사용
    if (hour >= 6 && hour < 12) acc.morning++;
    else if (hour >= 12 && hour < 18) acc.afternoon++;
    else acc.evening++;
    return acc;
  }, { morning: 0, afternoon: 0, evening: 0 });

  const peakTime = Object.entries(hourlyPattern)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'afternoon';

  const timeLabels = {
    morning: '오전',
    afternoon: '오후', 
    evening: '저녁'
  };

  const formatAmount = (amount: number) => 
    amount >= 10000 ? `${(amount / 10000).toFixed(1)}만원` : `${Math.floor(amount / 1000)}천원`;

  const fallbackSummary: ChatSummaryData = {
    recentActivity: totalTransactions > 0 
      ? `이번 주 ${totalTransactions}건의 거래로 총 ${formatAmount(totalAmount)} 지출했어요`
      : '이번 주는 아직 거래 내역이 없네요',
    spendingPattern: totalTransactions > 0
      ? `주로 ${timeLabels[peakTime as keyof typeof timeLabels]}에 활동하며, ${topCategory?.[0] || '기타'} 카테고리 지출이 많아요`
      : '지출 패턴을 분석할 데이터가 부족해요',
    keyInsights: totalTransactions > 0 ? [
      `${topCategory?.[0] || '기타'}에서 ${formatAmount(topCategory?.[1] || 0)} 지출`,
      `일평균 ${formatAmount(averageDaily)} 수준으로 지출`
    ] : [
      '아직 분석할 거래가 없어요',
      '채팅으로 첫 가계부를 입력해보세요'
    ],
    recommendations: totalTransactions > 0 ? [
      averageDaily > 50000 ? '일일 지출이 높은 편이니 예산 관리를 해보세요' : '현재 지출 수준은 적정해 보여요',
      Object.keys(categoryStats).length > 3 ? '다양한 카테고리로 지출하고 있어 분산이 잘 되어 있어요' : '지출 카테고리를 다양화해보는 것도 좋겠어요'
    ] : [
      '대화형 가계부로 지출을 입력해보세요',
      '꾸준한 기록이 좋은 습관의 시작이에요'
    ],
    totalTransactions,
    timeframe: '최근 7일'
  };

  return {
    success: true,
    fallbackSummary
  };
};
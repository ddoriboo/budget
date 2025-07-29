// 클라이언트에서 직접 OpenAI API 호출 (테스트용)
// 실제 프로덕션에서는 백엔드에서 처리해야 합니다

interface ExpenseData {
  date: string;
  amount: number;
  category: string;
  subcategory: string;
  place: string;
  memo?: string;
  confidence: number;
  type: 'expense' | 'income';
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

const parseRelativeDate = (text: string): string => {
  const today = new Date();
  const lowerText = text.toLowerCase();
  
  // 오늘 관련
  if (lowerText.includes('오늘')) {
    return today.toISOString().split('T')[0];
  }
  
  // 어제 관련
  if (lowerText.includes('어제')) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  // 그제, 그저께
  if (lowerText.includes('그저께') || lowerText.includes('그제')) {
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(today.getDate() - 2);
    return dayBeforeYesterday.toISOString().split('T')[0];
  }
  
  // 그그저께 (3일 전)
  if (lowerText.includes('그그저께')) {
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    return threeDaysAgo.toISOString().split('T')[0];
  }
  
  // 지난주 관련
  if (lowerText.includes('지난주') || lowerText.includes('저번주')) {
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    return lastWeek.toISOString().split('T')[0];
  }
  
  // 이번주 관련
  if (lowerText.includes('이번주')) {
    const thisWeekStart = new Date(today);
    const dayOfWeek = today.getDay(); // 0(일) ~ 6(토)
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일을 주 시작일로
    thisWeekStart.setDate(today.getDate() - daysFromMonday);
    return thisWeekStart.toISOString().split('T')[0];
  }
  
  // 특정 요일 (지난 금요일, 이번 화요일 등)
  const weekdayMatch = lowerText.match(/(지난|저번|이번)\s*(월|화|수|목|금|토|일)요일/);
  if (weekdayMatch) {
    const [, period, weekday] = weekdayMatch;
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const targetDay = weekdays.indexOf(weekday);
    const currentDay = today.getDay();
    
    if (targetDay !== -1) {
      let daysDiff;
      if (period === '이번') {
        // 이번주 해당 요일
        daysDiff = targetDay - currentDay;
        if (daysDiff > 0) {
          // 아직 오지 않은 요일이면 지난주로 계산
          daysDiff -= 7;
        }
      } else {
        // 지난주 해당 요일
        daysDiff = targetDay - currentDay - 7;
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysDiff);
      return targetDate.toISOString().split('T')[0];
    }
  }
  
  // 지난달 관련
  if (lowerText.includes('지난달') || lowerText.includes('저번달') || lowerText.includes('전달')) {
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    // 지난달 같은 날짜, 없으면 말일
    const targetDate = today.getDate();
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    lastMonth.setDate(Math.min(targetDate, lastDayOfLastMonth));
    return lastMonth.toISOString().split('T')[0];
  }
  
  // 이번달 관련
  if (lowerText.includes('이번달') || lowerText.includes('이달')) {
    // 이번달 1일로 설정
    const thisMonth = new Date(today);
    thisMonth.setDate(1);
    return thisMonth.toISOString().split('T')[0];
  }
  
  // "N일 전" 형태 파싱
  const daysAgoMatch = lowerText.match(/(\d+)일\s*전/);
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1]);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - daysAgo);
    return targetDate.toISOString().split('T')[0];
  }
  
  // "N주 전" 형태 파싱
  const weeksAgoMatch = lowerText.match(/(\d+)주\s*전/);
  if (weeksAgoMatch) {
    const weeksAgo = parseInt(weeksAgoMatch[1]);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - (weeksAgo * 7));
    return targetDate.toISOString().split('T')[0];
  }
  
  // "N달 전" 형태 파싱
  const monthsAgoMatch = lowerText.match(/(\d+)달\s*전/);
  if (monthsAgoMatch) {
    const monthsAgo = parseInt(monthsAgoMatch[1]);
    const targetDate = new Date(today);
    targetDate.setMonth(today.getMonth() - monthsAgo);
    return targetDate.toISOString().split('T')[0];
  }
  
  return today.toISOString().split('T')[0];
};

// 대화 맥락 분석을 위한 헬퍼 함수
const analyzeConversationContext = (
  message: string, 
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
): string => {
  const lowerMessage = message.toLowerCase();
  
  // 지시어 패턴 검출
  const referencePatterns = [
    '그거', '그것', '그때', '아까', '방금', '전에', '위에', '앞에서',
    '틀렸어', '아니야', '바꿔', '수정', '다시', '변경'
  ];
  
  const hasReference = referencePatterns.some(pattern => lowerMessage.includes(pattern));
  
  if (hasReference && conversationHistory.length > 0) {
    // 최근 대화에서 관련 정보 추출
    const recentContext = conversationHistory.slice(-4) // 최근 4개 메시지
      .map(msg => `[${msg.role}]: ${msg.content}`)
      .join('\n');
    
    return `\n\n**중요 컨텍스트 정보:**\n${recentContext}\n\n현재 사용자가 위 대화를 참조하고 있습니다. 지시어나 수정 요청을 반드시 고려하여 분석하세요.`;
  }
  
  return '';
};

export const analyzeExpenseMessage = async (
  message: string, 
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<{
  success: boolean;
  expenses: ExpenseData[];
  clarification_needed: boolean;
  clarification_message?: string;
}> => {
  try {
    // API 키 확인
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return {
        success: false,
        expenses: [],
        clarification_needed: true,
        clarification_message: '⚠️ OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.',
      };
    }
    // 현재 시점에서 실시간 날짜 계산
    const today = getCurrentDate();
    const yesterday = parseRelativeDate('어제');
    const dayBeforeYesterday = parseRelativeDate('그저께');  
    const threeDaysAgo = parseRelativeDate('그그저께');
    const lastWeek = parseRelativeDate('지난주');
    const thisWeekStart = parseRelativeDate('이번주');
    const lastMonth = parseRelativeDate('지난달');
    const thisMonth = parseRelativeDate('이번달');

    const systemPrompt = `
!!! CRITICAL SYSTEM INSTRUCTIONS - MUST FOLLOW EXACTLY !!!

You are a Korean expense tracker AI. You MUST follow these rules EXACTLY:

RULE 1: DATE CALCULATIONS (NEVER VIOLATE THIS!)
Current date: ${today}
- "어제" (yesterday) = ${yesterday} ← USE THIS EXACT DATE
- "오늘" (today) = ${today} ← USE THIS EXACT DATE  
- "그저께" (day before yesterday) = ${dayBeforeYesterday} ← USE THIS EXACT DATE
- "지난주" (last week) = ${lastWeek} ← USE THIS EXACT DATE
- "지난달" (last month) = ${lastMonth} ← USE THIS EXACT DATE

!!! WARNING: NEVER use ${today} when user says "어제" (yesterday) !!!
!!! WARNING: ALWAYS use ${yesterday} when user says "어제" (yesterday) !!!

RULE 2: MULTIPLE TRANSACTIONS (MANDATORY!)
If input contains multiple expenses (like "A 1만원, B 2만원, C 3만원"), you MUST create separate objects for EACH expense.
Example: "삼겹살 2만원, 스벅 5천원" → CREATE 2 SEPARATE EXPENSE OBJECTS

RULE 3: REQUIRED JSON FORMAT
You MUST return JSON with expenses array containing ALL transactions found.

PROCESSING EXAMPLE:
Input: "어제 점심으로 삼겹살 2만원, 스벅 5천원, 이마트 3만원, 지하철 2천원 냈어"

STEP 1: Identify date = "어제" = ${yesterday} (NOT ${today}!)
STEP 2: Find 4 transactions: 삼겹살 2만원, 스벅 5천원, 이마트 3만원, 지하철 2천원
STEP 3: Create 4 separate expense objects

REQUIRED OUTPUT:
{
  "expenses": [
    {
      "date": "${yesterday}",
      "amount": 20000,
      "category": "식비",
      "subcategory": "점심", 
      "place": "삼겹살집",
      "memo": "점심 삼겹살",
      "confidence": 0.9,
      "type": "expense"
    },
    {
      "date": "${yesterday}",
      "amount": 5000,
      "category": "식비",
      "subcategory": "음료",
      "place": "스타벅스", 
      "memo": "커피",
      "confidence": 0.95,
      "type": "expense"
    },
    {
      "date": "${yesterday}",
      "amount": 30000,
      "category": "쇼핑",
      "subcategory": "생필품",
      "place": "이마트",
      "memo": "장보기", 
      "confidence": 0.9,
      "type": "expense"
    },
    {
      "date": "${yesterday}",
      "amount": 2000,
      "category": "교통",
      "subcategory": "대중교통",
      "place": "지하철",
      "memo": "지하철비",
      "confidence": 0.95, 
      "type": "expense"
    }
  ],
  "clarification_needed": false,
  "clarification_message": null
}

!!! FINAL VERIFICATION CHECKLIST !!!
Before responding, verify:
□ Did I use ${yesterday} for "어제" (NOT ${today})?
□ Did I create separate objects for each transaction?
□ Did I include ALL transactions mentioned?
□ Is the JSON format correct?

!!! ABSOLUTE MANDATORY RULES !!!

TRANSACTION TYPE IDENTIFICATION:
- Income keywords: 월급, 급여, 보너스, 용돈, 받았다, 들어옴, 입금, 수입
- Expense keywords: 썼다, 샀다, 먹었다, 지출, 결제, 지불, 구입, 냈어

EXPENSE CATEGORIES:
- 식비 (Food): 음식, 카페, 레스토랑, 마트, 배달, 점심, 저녁, 간식
- 교통 (Transport): 지하철, 버스, 택시, 주유, 주차비  
- 쇼핑 (Shopping): 의류, 생활용품, 화장품, 전자제품, 이마트, 마트
- 문화/여가 (Entertainment): 영화, 도서, 여행, 게임
- 주거/통신 (Housing): 관리비, 인터넷, 휴대폰, 전기요금
- 건강/의료 (Health): 병원, 약국, 건강식품

INCOME CATEGORIES:  
- 급여 (Salary): 월급, 급여, 보너스, 성과급
- 부수입 (Side income): 프리랜서, 아르바이트, 부업
- 기타수입 (Other): 용돈, 선물, 환급

!!! FINAL MANDATORY CHECK BEFORE RESPONSE !!!
1. Did I use correct date for "어제"? → MUST be ${yesterday}
2. Did I separate ALL transactions? → Each expense = separate object  
3. Did I include ALL amounts mentioned? → Count them carefully
4. Is JSON valid? → Check syntax

${analyzeConversationContext(message, conversationHistory)}
`;

    console.log('분석 요청:', message);
    console.log('대화 이력:', conversationHistory);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API 에러:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI 응답:', data);
    console.log('OpenAI 메시지 내용:', data.choices[0].message.content);
    
    const result = JSON.parse(data.choices[0].message.content);
    console.log('파싱된 결과:', result);
    console.log('파싱된 결과 상세:', {
      expenses: result.expenses,
      expensesLength: result.expenses?.length,
      clarificationNeeded: result.clarification_needed,
      clarificationMessage: result.clarification_message
    });

    // 날짜 정규화
    if (result.expenses) {
      result.expenses.forEach((expense: any) => {
        if (expense.date) {
          expense.date = parseRelativeDate(expense.date);
        }
      });
    }

    return {
      success: true,
      expenses: result.expenses || [],
      clarification_needed: result.clarification_needed || false,
      clarification_message: result.clarification_message,
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      success: false,
      expenses: [],
      clarification_needed: true,
      clarification_message: 'AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
};
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
    console.log('🔑 OpenAI API Key 상태:', OPENAI_API_KEY ? '설정됨' : '미설정', OPENAI_API_KEY === 'your_openai_api_key_here' ? '(기본값)' : '');
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('⚠️ OpenAI API 키가 없어서 간단한 지출 분석을 사용합니다.');
      return analyzeExpenseFallback(message);
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
You are a Korean expense tracking AI. Analyze user messages and extract expense/income data.
Your response must be in JSON format.

🚨 MOST IMPORTANT RULE: ONLY EXTRACT NEW TRANSACTIONS FROM THE CURRENT MESSAGE
- NEVER include transactions from previous messages in the conversation
- ONLY analyze the user's CURRENT message
- Ignore any transactions mentioned in conversation history
- If the current message is a correction/update, only extract the corrected values

📅 DATE MAPPING (USE EXACTLY AS SHOWN):
Today: ${today}
어제 (yesterday): ${yesterday}
그저께/그제 (day before yesterday): ${dayBeforeYesterday}
그그저께 (3 days ago): ${threeDaysAgo}
지난주/저번주 (last week): ${lastWeek}
이번주 (this week start): ${thisWeekStart}
지난달/저번달/전달 (last month): ${lastMonth}
이번달/이달 (this month): ${thisMonth}

🔴 CRITICAL RULE #1: EXTRACT ONLY NEW TRANSACTIONS
When user mentions multiple items, create SEPARATE expense object for EACH item IN THE CURRENT MESSAGE ONLY.
Example: "삼겹살 2만원, 커피 5천원, 마트 3만원" → Create 3 separate expense objects

🔴 CRITICAL RULE #2: USE EXACT DATES
When user says "어제", use "${yesterday}", NOT "${today}"

🔴 CRITICAL RULE #3: IDENTIFY INCOME VS EXPENSE
**INCOME KEYWORDS** (type: "income"):
- 월급, 급여, 봉급, 연봉
- 받았다, 들어왔다, 입금, 지급
- 보너스, 상여금, 인센티브
- 용돈, 알바비, 부수입

**EXPENSE KEYWORDS** (type: "expense"):
- 썼다, 샀다, 결제, 지출
- 먹었다, 마셨다, 탔다
- 냈다, 지불, 구매

📝 PARSING STRATEGY:
1. Split the message by commas, "그리고", "또", or natural breaks
2. Identify EACH expense/income item separately
3. Determine if it's income or expense based on keywords
4. Create individual object for EACH item
5. Count your objects - must match number of items mentioned

💡 EXPENSE EXAMPLES:

**Example 1 - Multiple Items:**
Input: "어제 점심으로 삼겹살 2만원, 스벅 5천원, 이마트 3만원, 지하철 2천원 냈어"
Output:
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
      "memo": "교통비",
      "confidence": 0.95,
      "type": "expense"
    }
  ],
  "clarification_needed": false
}

**Example 2 - Movie & Snacks:**
Input: "지난주 금요일에 영화 1만5천원, 팝콘 8천원 썼어"
Output:
{
  "expenses": [
    {
      "date": "${lastWeek}",
      "amount": 15000,
      "category": "문화/여가",
      "subcategory": "엔터테인먼트",
      "place": "영화관",
      "memo": "영화",
      "confidence": 0.9,
      "type": "expense"
    },
    {
      "date": "${lastWeek}",
      "amount": 8000,
      "category": "식비",
      "subcategory": "간식",
      "place": "영화관",
      "memo": "팝콘",
      "confidence": 0.9,
      "type": "expense"
    }
  ],
  "clarification_needed": false
}

💰 INCOME EXAMPLE:
Input: "월급 300만원 들어왔어"
Output:
{
  "expenses": [
    {
      "date": "${today}",
      "amount": 3000000,
      "category": "급여",
      "subcategory": "월급",
      "place": "회사",
      "memo": "월급",
      "confidence": 0.95,
      "type": "income"
    }
  ],
  "clarification_needed": false
}

💰 MORE INCOME EXAMPLES:
- "이번달 급여 250만원 받았어" → type: "income", category: "급여", place: "회사"
- "보너스 100만원 입금됐어" → type: "income", category: "급여", subcategory: "보너스", place: "회사"
- "알바비 50만원 들어왔어" → type: "income", category: "부수입", subcategory: "알바", place: "알바"
- "용돈 10만원 받았어" → type: "income", category: "기타수입", subcategory: "용돈", place: "기타"

📊 CATEGORIES:
Expense: 식비, 교통, 쇼핑, 문화/여가, 주거/통신, 건강/의료, 교육, 경조사, 기타
Income: 급여 (월급, 보너스, 상여금), 부수입 (알바, 프리랜서), 기타수입 (용돈, 지원금)

⚠️ VALIDATION CHECKLIST:
1. Count items in CURRENT message only
2. Count objects in expenses array
3. Numbers must match!
4. Each item gets its own object
5. Use correct date mapping
6. Set correct "type" field: "income" or "expense"
7. DO NOT include any transactions from conversation history

⚠️ CONTEXT USAGE:
- Use conversation history ONLY to understand corrections or references (like "아니야", "틀렸어")
- NEVER extract transactions from previous messages
- Focus ONLY on the current user message

Always return valid JSON format with "expenses" array and "clarification_needed" boolean.
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
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 2000,
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

    // 날짜 정규화 제거 - OpenAI가 이미 올바른 날짜를 반환함
    // 기존 parseRelativeDate 호출이 올바른 날짜를 망가뜨리는 문제 해결

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

// 간단한 키워드 기반 지출 분석 (API 키 없을 때)
const analyzeExpenseFallback = (message: string): {
  success: boolean;
  expenses: ExpenseData[];
  clarification_needed: boolean;
  clarification_message?: string;
} => {
  console.log('🔧 Fallback 지출 분석 시작:', message);
  
  const lowerMessage = message.toLowerCase();
  const expenses: ExpenseData[] = [];
  
  // 금액 추출
  const amountMatches = message.match(/(\d+)([만천]?)원/g);
  console.log('💵 찾은 금액들:', amountMatches);
  
  if (!amountMatches || amountMatches.length === 0) {
    return {
      success: false,
      expenses: [],
      clarification_needed: true,
      clarification_message: '금액을 찾을 수 없어요. 예: "5천원", "1만원"과 같이 말씀해주세요.'
    };
  }
  
  // 날짜 파싱
  let date = getCurrentDate();
  if (lowerMessage.includes('어제')) {
    date = parseRelativeDate('어제');
  } else if (lowerMessage.includes('그저께') || lowerMessage.includes('그제')) {
    date = parseRelativeDate('그저께');
  } else if (lowerMessage.includes('지난주')) {
    date = parseRelativeDate('지난주');
  } else if (lowerMessage.includes('지난달')) {
    date = parseRelativeDate('지난달');
  }
  
  // 타입 결정 (수입 vs 지출) - 키워드 확장
  const isIncome = lowerMessage.includes('월급') || lowerMessage.includes('급여') || 
                   lowerMessage.includes('받았') || lowerMessage.includes('들어왔') ||
                   lowerMessage.includes('수입') || lowerMessage.includes('입금') ||
                   lowerMessage.includes('보너스') || lowerMessage.includes('상여') ||
                   lowerMessage.includes('알바비') || lowerMessage.includes('용돈') ||
                   lowerMessage.includes('봉급') || lowerMessage.includes('지급');
  
  // 메시지를 쉼표로 분리해서 각 항목 분석
  // 쉼표가 없으면 전체 메시지를 하나의 항목으로 처리
  const items = message.includes(',') 
    ? message.split(',').map(item => item.trim())
    : [message.trim()];
  console.log('🔍 분리된 항목들:', items);
  
  items.forEach((item) => {
    const itemLower = item.toLowerCase();
    
    // 각 항목에서 금액 찾기
    const itemAmountMatch = item.match(/(\d+)([만천]?)원/);
    if (!itemAmountMatch) return;
    
    // 금액 파싱
    let amount = 0;
    const num = parseInt(itemAmountMatch[1]);
    if (itemAmountMatch[2] === '만') amount = num * 10000;
    else if (itemAmountMatch[2] === '천') amount = num * 1000;
    else amount = num;
    
    // 카테고리 추출
    let category = '기타';
    let subcategory = '기타';
    let place = '';
    let memo = '';
    
    if (isIncome) {
      // 수입 카테고리 분류
      if (itemLower.includes('월급') || itemLower.includes('급여') || itemLower.includes('봉급')) {
        category = '급여';
        subcategory = '월급';
        place = '회사';
        memo = '월급';
      } else if (itemLower.includes('보너스') || itemLower.includes('상여')) {
        category = '급여';
        subcategory = '보너스';
        place = '회사';
        memo = '보너스';
      } else if (itemLower.includes('알바')) {
        category = '부수입';
        subcategory = '알바';
        place = '알바';
        memo = '알바비';
      } else if (itemLower.includes('용돈')) {
        category = '기타수입';
        subcategory = '용돈';
        place = '기타';
        memo = '용돈';
      } else {
        category = '기타수입';
        subcategory = '기타';
        place = '기타';
        memo = '수입';
      }
    } else {
      // 스타벅스, 커피
      if (itemLower.includes('스타벅스') || itemLower.includes('스벅')) {
        category = '식비';
        subcategory = '카페/간식';
        place = '스타벅스';
        if (itemLower.includes('아메리카노')) memo = '아메리카노';
      } 
      // 점심, 저녁, 식사
      else if (itemLower.includes('점심') || itemLower.includes('저녁') || itemLower.includes('아침')) {
        category = '식비';
        subcategory = '외식';
        place = '식당';
        if (itemLower.includes('삼겹살')) {
          place = '고기집';
          memo = '삼겹살';
        }
      }
      // 마트
      else if (itemLower.includes('이마트') || itemLower.includes('마트')) {
        category = '식비';
        subcategory = '식료품';
        place = itemLower.includes('이마트') ? '이마트' : '마트';
      }
      // 교통
      else if (itemLower.includes('택시') || itemLower.includes('버스') || itemLower.includes('지하철')) {
        category = '교통';
        subcategory = '대중교통';
        place = itemLower.includes('택시') ? '택시' : 
                itemLower.includes('버스') ? '버스' : '지하철';
      }
      // 영화
      else if (itemLower.includes('영화') || itemLower.includes('cgv')) {
        category = '문화/여가';
        subcategory = '엔터테인먼트';
        place = 'CGV';
        if (itemLower.includes('팝콘')) memo = '팝콘';
      }
      // 커피
      else if (itemLower.includes('커피') || itemLower.includes('카페')) {
        category = '식비';
        subcategory = '카페/간식';
        place = '카페';
      }
    }
    
    if (!place) place = category;
    
    expenses.push({
      date,
      amount,
      category,
      subcategory,
      place,
      memo,
      confidence: 0.7,
      type: isIncome ? 'income' : 'expense'
    });
  });
  
  console.log('✅ Fallback 분석 완료. 거래 수:', expenses.length);
  console.log('📊 분석된 거래들:', expenses);
  
  // 아무 거래도 파싱하지 못했다면 기본값 반환
  if (expenses.length === 0) {
    console.log('⚠️ 거래를 파싱하지 못했습니다. 기본값 반환');
    
    // 예산 관련 메시지인지 확인
    if (lowerMessage.includes('예산') && lowerMessage.includes('만원')) {
      return {
        success: false,
        expenses: [],
        clarification_needed: true,
        clarification_message: '예산 설정을 원하시나요? 예: "식비 예산 30만원으로 설정해줘"'
      };
    }
    
    return {
      success: false,
      expenses: [],
      clarification_needed: true,
      clarification_message: '금액 정보를 찾을 수 없어요. 예: "어제 스타벅스에서 5천원 썼어"와 같이 구체적으로 말씀해주세요.'
    };
  }
  
  return {
    success: true,
    expenses,
    clarification_needed: false
  };
};
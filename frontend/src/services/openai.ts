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
    const systemPrompt = `
당신은 한국어 가계부 입력을 분석하는 전문 AI입니다.

사용자의 자연어 입력에서 다음 정보를 정확히 추출하세요:

1. **거래 유형**: 수입(income)인지 지출(expense)인지 구분
2. **날짜**: 상대적 표현을 정확한 날짜로 변환 (고도로 정확한 해석 필요)
3. **금액**: 숫자와 단위 인식 ('5천원', '만원', '50000원' 등)
4. **카테고리**: 내용을 기반으로 적절한 카테고리 추론
5. **장소/상점**: 구체적인 장소명이나 상점명
6. **메모**: 추가 정보나 상황 설명

**날짜 해석 규칙 (매우 중요! 절대 실수하지 말 것!):**

**현재 기준일: ${getCurrentDate()}**

**상대적 날짜 변환:**
- "오늘": ${getCurrentDate()}
- "어제": ${parseRelativeDate('어제')}  
- "그저께", "그제": ${parseRelativeDate('그저께')}
- "그그저께": ${parseRelativeDate('그그저께')}

**주 단위:**
- "지난주", "저번주": ${parseRelativeDate('지난주')}
- "이번주": ${parseRelativeDate('이번주')}

**월 단위:**
- "지난달", "저번달": ${parseRelativeDate('지난달')}
- "이번달": ${parseRelativeDate('이번달')}

**절대 규칙: 사용자가 "어제"라고 하면 무조건 ${parseRelativeDate('어제')}로 설정하세요.**
**절대 규칙: 사용자가 "오늘이 아니라 어제"라고 하면 ${parseRelativeDate('어제')}로 수정하세요.**

**예시:**
- "어제 스타벅스에서 5천원" → date: "${parseRelativeDate('어제')}"
- "오늘이 아니라 어제 미용실에서 4만원" → date: "${parseRelativeDate('어제')}"
- "그저께 마트에서 쇼핑" → date: "${parseRelativeDate('그저께')}"

**거래 유형 구분 (매우 중요! 놓치지 말 것!):**
- 수입(income) 키워드: 월급, 급여, 보너스, 용돈, 부수입, 프리랜서, 이자, 배당금, "들어옴", "받았다", "입금", "월급", "수입", "받음", "용돈", "보너스"
- 지출(expense) 키워드: 구매, 식사, 교통비, 쇼핑, "썼다", "샀다", "먹었다", "지출", "결제", "지불", "구입"

**지출 카테고리:**
- 식비: 음식, 카페, 레스토랑, 마트, 배달, 테이크아웃 등
- 교통: 지하철, 버스, 택시, 주유, 주차비, 통행료 등
- 문화/여가: 영화, 도서, 여행, 스포츠, 게임, 취미 등
- 쇼핑: 의류, 생활용품, 화장품, 전자제품 등
- 주거/통신: 관리비, 인터넷, 휴대폰, 전기요금 등
- 건강/의료: 병원, 약국, 건강식품, 운동 등
- 교육: 학원, 도서, 강의, 자격증 등

**수입 카테고리:**
- 급여: 월급, 급여, 보너스, 성과급
- 부수입: 프리랜서, 아르바이트, 부업, 외주
- 금융수입: 이자, 배당금, 투자수익
- 기타수입: 용돈, 선물, 환급, 판매수익

**오늘 날짜: ${getCurrentDate()}**

**대화 맥락 처리 (매우 중요!):**
- 이전 대화 내용을 면밀히 분석하고 참조할 것
- "그거", "그것", "그때", "아까 그", "방금 전" 등 지시어 사용 시 반드시 이전 대화에서 해당 내용 찾기
- 수정/변경 요청 시 ("아니야", "틀렸어", "바꿔줘") 이전 분석 결과를 기반으로 수정
- 추가 정보 제공 시 기존 거래와 연결하여 업데이트
- 모호한 표현도 맥락을 통해 최대한 해석

**한국어 자연어 처리 개선:**
- 구어체, 줄임말, 오타에 대한 관대한 해석
- "ㅋㅋ", "ㅎㅎ" 등 감정 표현 무시
- "뭐", "좀", "막" 등 불필요한 어미 제거 후 해석
- 문맥상 당연한 정보는 추론하여 보완

${analyzeConversationContext(message, conversationHistory)}

응답은 반드시 다음 JSON 형식으로 제공하세요:
{
  "expenses": [
    {
      "date": "YYYY-MM-DD",
      "amount": 숫자 (항상 양수로 표기),
      "category": "카테고리",
      "subcategory": "하위카테고리",
      "place": "장소명",
      "memo": "메모",
      "confidence": 0.0-1.0,
      "type": "expense" 또는 "income"
    }
  ],
  "clarification_needed": false,
  "clarification_message": null
}

**특별 지시 (절대 위반 금지!):**
- 반드시 expenses 배열에 최소 1개 항목을 포함할 것!
- 오타나 불분명한 표현도 최대한 추론하여 처리할 것!
- amount는 항상 양수로 표기 (수입/지출은 type으로 구분)
- 한 문장에 여러 거래가 있으면 각각 분리
- 확실하지 않은 정보는 confidence를 낮게 설정
- 정말 이해할 수 없는 경우에만 clarification_needed를 true로 설정

**수정 요청 처리:**
- "오늘이 아니라 어제" → 날짜를 어제로 수정
- "아니다", "수정", "틀렸다" 등의 표현 인식
- 이전 대화 맥락을 고려하여 수정사항 반영

**오타 처리 규칙:**
- "지단달" → "지난달"로 해석
- "몇만원", "몇십만원" 등도 추론하여 처리

**예시:**
입력: "지단달 350만원 월급으로 들어옴" (오타 있음)
출력: {
  "expenses": [{
    "date": "2024-06-01",
    "amount": 3500000,
    "category": "급여",
    "subcategory": "월급",
    "place": "회사",
    "memo": "월급 수입",
    "confidence": 0.9,
    "type": "income"
  }],
  "clarification_needed": false
}

입력: "컵배 5천원"
출력: {
  "expenses": [{
    "date": "2024-07-29",
    "amount": 5000,
    "category": "식비",
    "subcategory": "음료",
    "place": "카페",
    "memo": "커피",
    "confidence": 0.8,
    "type": "expense"
  }],
  "clarification_needed": false
}
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
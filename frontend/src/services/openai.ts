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
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

const parseRelativeDate = (text: string): string => {
  const today = new Date();
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('오늘')) {
    return today.toISOString().split('T')[0];
  } else if (lowerText.includes('어제')) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  } else if (lowerText.includes('그저께') || lowerText.includes('그제')) {
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(today.getDate() - 2);
    return dayBeforeYesterday.toISOString().split('T')[0];
  }
  
  // "3일 전" 형태 파싱
  const daysAgoMatch = lowerText.match(/(\d+)일 전/);
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1]);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - daysAgo);
    return targetDate.toISOString().split('T')[0];
  }
  
  return today.toISOString().split('T')[0];
};

export const analyzeExpenseMessage = async (message: string): Promise<{
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

1. **날짜**: 상대적 표현('어제', '그저께', '3일 전' 등)을 정확한 날짜로 변환
2. **금액**: 숫자와 단위 인식 ('5천원', '만원', '50000원' 등)
3. **카테고리**: 내용을 기반으로 적절한 카테고리 추론
4. **장소/상점**: 구체적인 장소명이나 상점명
5. **메모**: 추가 정보나 상황 설명

**카테고리 기준:**
- 식비: 음식, 카페, 레스토랑, 마트 등
- 교통: 지하철, 버스, 택시, 주유 등
- 문화/여가: 영화, 도서, 여행, 스포츠 등
- 쇼핑: 의류, 생활용품, 화장품 등
- 주거/통신: 관리비, 인터넷, 휴대폰 등
- 건강/의료: 병원, 약국, 건강식품 등

**오늘 날짜: ${getCurrentDate()}**

응답은 반드시 다음 JSON 형식으로 제공하세요:
{
  "expenses": [
    {
      "date": "YYYY-MM-DD",
      "amount": 숫자,
      "category": "카테고리",
      "subcategory": "하위카테고리",
      "place": "장소명",
      "memo": "메모",
      "confidence": 0.0-1.0
    }
  ],
  "clarification_needed": false,
  "clarification_message": null
}

**특별 지시:**
- 한 문장에 여러 지출이 있으면 각각 분리
- 확실하지 않은 정보는 confidence를 낮게 설정
- 금액이 명확하지 않으면 clarification_needed를 true로 설정
`;

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
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

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
"""
머니챗 NLP 서비스 - OpenAI 기반 자연어 처리
"""

import os
import json
import redis
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
import pandas as pd
from io import BytesIO
import re

# FastAPI 앱 초기화
app = FastAPI(
    title="머니챗 NLP 서비스",
    description="OpenAI 기반 자연어 처리를 통한 가계부 데이터 추출",
    version="1.0.0"
)

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Redis 클라이언트 (캐싱용)
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# Pydantic 모델 정의
class ChatMessage(BaseModel):
    message: str
    user_id: str
    session_id: str
    context: Optional[List[str]] = []

class ExpenseInfo(BaseModel):
    date: str = Field(description="YYYY-MM-DD 형식의 날짜")
    amount: float = Field(description="지출/수입 금액")
    category: str = Field(description="카테고리")
    subcategory: Optional[str] = Field(description="하위 카테고리")
    place: Optional[str] = Field(description="장소/상점명")
    memo: Optional[str] = Field(description="메모")
    is_income: bool = Field(description="수입 여부")
    payment_method: Optional[str] = Field(description="결제 수단")
    confidence: float = Field(description="분석 신뢰도 (0.0-1.0)")

class NLPResponse(BaseModel):
    success: bool
    expenses: List[ExpenseInfo]
    clarification_needed: bool = False
    clarification_message: Optional[str] = None
    conversation_context: List[str]

class ExcelAnalysisRequest(BaseModel):
    file_content: str  # base64 encoded
    filename: str
    user_id: str

class ExcelAnalysisResponse(BaseModel):
    success: bool
    column_mapping: Dict[str, str]  # detected_column -> standard_field
    preview_data: List[Dict[str, Any]]
    total_rows: int
    confidence: float

# 시스템 프롬프트
EXPENSE_EXTRACTION_PROMPT = """
당신은 한국어 가계부 입력을 분석하는 전문 AI입니다.

사용자의 자연어 입력에서 다음 정보를 정확히 추출하세요:

1. **날짜**: 상대적 표현('어제', '그저께', '3일 전', '지난주 화요일' 등)을 정확한 날짜로 변환
2. **금액**: 숫자와 단위 인식 ('5천원', '만원', '50000원' 등)
3. **카테고리**: 내용을 기반으로 적절한 카테고리 추론
4. **장소/상점**: 구체적인 장소명이나 상점명
5. **메모**: 추가 정보나 상황 설명
6. **수입/지출**: 맥락을 통해 판단
7. **결제수단**: 언급된 경우 추출

**카테고리 기준:**
- 식비: 음식, 카페, 레스토랑, 마트 등
- 교통: 지하철, 버스, 택시, 주유 등
- 문화/여가: 영화, 도서, 여행, 스포츠 등
- 쇼핑: 의류, 생활용품, 화장품 등
- 주거/통신: 관리비, 인터넷, 휴대폰 등
- 건강/의료: 병원, 약국, 건강식품 등

**특별 지시:**
- 한 문장에 여러 지출이 있으면 각각 분리
- 확실하지 않은 정보는 confidence를 낮게 설정
- 금액이 명확하지 않으면 clarification 요청
- 오늘 날짜: {today}

응답은 반드시 JSON 형식으로 제공하세요.
"""

def get_today_date() -> str:
    """오늘 날짜를 YYYY-MM-DD 형식으로 반환"""
    return datetime.now().strftime("%Y-%m-%d")

def parse_relative_date(text: str, today: datetime) -> str:
    """상대적 날짜 표현을 절대 날짜로 변환"""
    text = text.lower()
    
    if "오늘" in text:
        return today.strftime("%Y-%m-%d")
    elif "어제" in text:
        return (today - timedelta(days=1)).strftime("%Y-%m-%d")
    elif "그저께" in text or "그제" in text:
        return (today - timedelta(days=2)).strftime("%Y-%m-%d")
    elif "일 전" in text:
        # "3일 전" 형태 파싱
        match = re.search(r'(\d+)일 전', text)
        if match:
            days = int(match.group(1))
            return (today - timedelta(days=days)).strftime("%Y-%m-%d")
    
    return today.strftime("%Y-%m-%d")

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy", "service": "nlp-service"}

@app.post("/extract-expense", response_model=NLPResponse)
async def extract_expense_info(request: ChatMessage):
    """자연어 입력에서 지출 정보 추출"""
    try:
        # 캐시 확인
        cache_key = f"nlp:{hash(request.message + request.user_id)}"
        cached_result = redis_client.get(cache_key)
        
        if cached_result:
            return NLPResponse.parse_raw(cached_result)
        
        # OpenAI API 호출
        today = get_today_date()
        system_prompt = EXPENSE_EXTRACTION_PROMPT.format(today=today)
        
        # 대화 컨텍스트 구성
        messages = [
            {"role": "system", "content": system_prompt},
        ]
        
        # 이전 대화 컨텍스트 추가
        for context_msg in request.context[-5:]:  # 최근 5개만
            messages.append({"role": "user", "content": context_msg})
        
        # 현재 메시지 추가
        messages.append({"role": "user", "content": request.message})
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.1,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        # 응답 파싱
        result_text = response.choices[0].message.content
        result_data = json.loads(result_text)
        
        # ExpenseInfo 객체로 변환
        expenses = []
        if "expenses" in result_data:
            for expense_data in result_data["expenses"]:
                # 날짜 정규화
                if "date" in expense_data:
                    expense_data["date"] = parse_relative_date(
                        expense_data.get("date", ""), 
                        datetime.now()
                    )
                
                expenses.append(ExpenseInfo(**expense_data))
        
        # 응답 구성
        nlp_response = NLPResponse(
            success=True,
            expenses=expenses,
            clarification_needed=result_data.get("clarification_needed", False),
            clarification_message=result_data.get("clarification_message"),
            conversation_context=request.context + [request.message]
        )
        
        # 결과 캐싱 (1시간)
        redis_client.setex(cache_key, 3600, nlp_response.json())
        
        return nlp_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLP 처리 오류: {str(e)}")

@app.post("/analyze-excel", response_model=ExcelAnalysisResponse)
async def analyze_excel_file(request: ExcelAnalysisRequest):
    """엑셀 파일 구조 분석 및 컬럼 매핑"""
    try:
        # Base64 디코딩
        import base64
        file_content = base64.b64decode(request.file_content)
        
        # 엑셀 파일 읽기
        df = pd.read_excel(BytesIO(file_content))
        
        # 컬럼명 분석을 위한 프롬프트
        column_analysis_prompt = f"""
        다음 엑셀 파일의 컬럼명들을 분석하여 가계부 필드와 매핑해주세요.

        컬럼명: {list(df.columns)}
        첫 번째 행 데이터: {df.iloc[0].to_dict() if len(df) > 0 else {}}

        표준 필드:
        - date: 날짜
        - amount: 금액
        - description: 내용/설명
        - category: 카테고리
        - place: 장소
        - memo: 메모

        JSON 형식으로 매핑 결과를 반환하세요:
        {{
            "column_mapping": {{"원본컬럼명": "표준필드명"}},
            "confidence": 0.95
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 엑셀 데이터 분석 전문가입니다."},
                {"role": "user", "content": column_analysis_prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        analysis_result = json.loads(response.choices[0].message.content)
        
        # 미리보기 데이터 준비 (상위 5행)
        preview_data = df.head(5).to_dict('records')
        
        return ExcelAnalysisResponse(
            success=True,
            column_mapping=analysis_result.get("column_mapping", {}),
            preview_data=preview_data,
            total_rows=len(df),
            confidence=analysis_result.get("confidence", 0.8)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"엑셀 분석 오류: {str(e)}")

@app.post("/process-excel-row")
async def process_excel_row(row_data: Dict[str, Any], column_mapping: Dict[str, str]):
    """엑셀 행 데이터를 ExpenseInfo로 변환"""
    try:
        # 컬럼 매핑을 통해 표준 필드로 변환
        mapped_data = {}
        for original_col, standard_field in column_mapping.items():
            if original_col in row_data:
                mapped_data[standard_field] = row_data[original_col]
        
        # 자연어 처리를 통한 카테고리 추론
        description = mapped_data.get("description", "")
        place = mapped_data.get("place", "")
        
        category_prompt = f"""
        다음 정보를 바탕으로 적절한 카테고리를 추천해주세요:
        
        내용: {description}
        장소: {place}
        
        카테고리 옵션: 식비, 교통, 문화/여가, 쇼핑, 주거/통신, 건강/의료
        
        JSON 형식으로 응답: {{"category": "카테고리명", "confidence": 0.95}}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 가계부 카테고리 분류 전문가입니다."},
                {"role": "user", "content": category_prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        category_result = json.loads(response.choices[0].message.content)
        
        # ExpenseInfo 구성
        expense_info = ExpenseInfo(
            date=mapped_data.get("date", get_today_date()),
            amount=float(mapped_data.get("amount", 0)),
            category=category_result.get("category", "기타"),
            place=mapped_data.get("place", ""),
            memo=mapped_data.get("memo", ""),
            is_income=float(mapped_data.get("amount", 0)) > 0,
            confidence=category_result.get("confidence", 0.8)
        )
        
        return {"success": True, "expense_info": expense_info}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"행 처리 오류: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
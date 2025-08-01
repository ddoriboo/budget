# 머니챗(MoneyChat) 사용자 플로우 다이어그램

## 1. 주요 사용자 플로우 맵

### 1.1 전체 사용자 여정 (User Journey Map)

```mermaid
graph TD
    A[앱 실행] --> B{첫 사용자?}
    B -->|Yes| C[온보딩]
    B -->|No| D[홈 화면]
    
    C --> E[간단한 튜토리얼]
    E --> D
    
    D --> F{주요 행동}
    F -->|대화로 입력| G[채팅 화면]
    F -->|엑셀 업로드| H[업로드 화면]
    F -->|내역 확인| I[내역 관리]
    F -->|리포트 보기| J[리포트]
    
    G --> K[자연어 입력]
    K --> L[AI 분석]
    L --> M[확인/수정]
    M --> N[저장 완료]
    
    H --> O[파일 선택]
    O --> P[컬럼 매핑]
    P --> Q[대화형 검증]
    Q --> R[업로드 완료]
    
    N --> D
    R --> D
```

### 1.2 대화형 입력 상세 플로우

```mermaid
sequenceDiagram
    participant U as 사용자
    participant C as 채팅 UI
    participant AI as AI 엔진
    participant DB as 데이터베이스
    
    U->>C: "어제 스벅에서 9천원 썼어"
    C->>AI: 자연어 분석 요청
    AI->>AI: 텍스트 파싱
    Note over AI: 날짜: 어제<br/>장소: 스벅<br/>금액: 9,000원
    AI->>C: 분석 결과 반환
    C->>U: 추출 정보 카드 표시
    U->>C: [확인] 클릭
    C->>DB: 데이터 저장
    DB->>C: 저장 완료
    C->>U: "저장했어요!" 메시지
```

### 1.3 엑셀 업로드 플로우

```mermaid
stateDiagram-v2
    [*] --> 파일선택
    파일선택 --> 파일분석: 파일 업로드
    파일분석 --> 컬럼매핑: 구조 분석 완료
    
    컬럼매핑 --> 자동매핑성공: AI 자동 매핑
    컬럼매핑 --> 수동매핑필요: 매핑 실패
    
    자동매핑성공 --> 매핑확인
    수동매핑필요 --> 사용자매핑
    사용자매핑 --> 매핑확인
    
    매핑확인 --> 대화형검증: 확인
    매핑확인 --> 컬럼매핑: 수정
    
    대화형검증 --> 개별확인: 한 건씩
    대화형검증 --> 일괄확인: 모두 확인
    
    개별확인 --> 다음건: 확인/수정/삭제
    다음건 --> 개별확인: 남은 건 있음
    다음건 --> 완료: 모든 건 처리
    
    일괄확인 --> 완료
    완료 --> 리포트생성
    리포트생성 --> [*]
```

## 2. 핵심 인터랙션 플로우

### 2.1 자연어 수정 플로우

```
사용자: "어제 스벅에서 9천원 썼어"
AI: [카드 UI - 날짜: 어제, 장소: 스타벅스, 금액: 9,000원]
사용자: "아니야, 8천원이었어"
AI: [수정된 카드 UI - 금액: 8,000원으로 변경됨]
사용자: [확인]
AI: "수정해서 저장했어요!"
```

### 2.2 복수 내역 처리 플로우

```
사용자: "오늘 점심 15000원, 교통비 3200원, 저녁 치킨 25000원"

AI: "3건의 지출을 찾았어요. 하나씩 확인해주세요."

[카드 1/3]
- 날짜: 오늘
- 카테고리: 식비(점심)
- 금액: 15,000원
[확인] [수정]

[카드 2/3]
- 날짜: 오늘
- 카테고리: 교통비
- 금액: 3,200원
[확인] [수정]

[카드 3/3]
- 날짜: 오늘
- 카테고리: 식비(저녁)
- 금액: 25,000원
- 메모: 치킨
[확인] [수정]

[모두 확인하기]
```

### 2.3 상대적 시간 인식 플로우

```
지원되는 표현:
- "오늘" → 2025-07-29
- "어제" → 2025-07-28
- "그저께" → 2025-07-27
- "3일 전" → 2025-07-26
- "지난 주 월요일" → 2025-07-22
- "이번 달 초" → 2025-07-01~03
- "지난 달 말" → 2025-06-28~30
```

## 3. 에러 상황별 처리 플로우

### 3.1 모호한 입력 처리

```mermaid
flowchart TD
    A[모호한 입력 감지] --> B{어떤 유형?}
    
    B -->|금액 불명확| C[금액 확인 요청]
    C --> D["정확한 금액을 알려주세요<br/>(예: 10,000원)"]
    D --> E[숫자 버튼 제공]
    
    B -->|날짜 불명확| F[날짜 확인 요청]
    F --> G[달력 UI 표시]
    G --> H[날짜 선택]
    
    B -->|카테고리 불명확| I[카테고리 추천]
    I --> J[상위 3개 카테고리 제시]
    J --> K[선택 또는 직접 입력]
```

### 3.2 중복 감지 플로우

```
IF (동일시간대 AND 동일금액) THEN
    AI: "비슷한 내역이 있어요"
    
    [기존 내역 표시]
    - 2025-07-29 14:30
    - 스타벅스
    - 9,000원
    
    "이 내역과 같은 건가요?"
    [같은 내역] [다른 내역] [취소]
END IF
```

### 3.3 엑셀 파싱 실패 처리

```mermaid
flowchart LR
    A[엑셀 파싱 실패] --> B[실패 원인 분석]
    B --> C{원인 유형}
    
    C -->|형식 오류| D[지원 형식 안내]
    D --> E[.xlsx, .xls, .csv만 가능]
    
    C -->|구조 인식 실패| F[수동 매핑 모드]
    F --> G[샘플 데이터 표시]
    G --> H[컬럼 드래그 매핑]
    
    C -->|파일 손상| I[재업로드 요청]
    I --> J[다른 파일 선택]
```

## 4. 상태 전이 다이어그램

### 4.1 채팅 입력 상태

```mermaid
stateDiagram-v2
    [*] --> 대기중: 앱 시작
    
    대기중 --> 입력중: 텍스트 입력 시작
    입력중 --> 분석중: 전송 버튼 클릭
    
    분석중 --> 확인대기: AI 분석 완료
    분석중 --> 에러: 분석 실패
    
    확인대기 --> 수정중: 수정 버튼
    확인대기 --> 저장중: 확인 버튼
    확인대기 --> 대기중: 취소 버튼
    
    수정중 --> 확인대기: 수정 완료
    저장중 --> 완료: DB 저장 성공
    저장중 --> 에러: 저장 실패
    
    완료 --> 대기중: 3초 후
    에러 --> 대기중: 재시도/취소
```

### 4.2 엑셀 업로드 상태

```mermaid
stateDiagram-v2
    [*] --> 파일대기
    
    파일대기 --> 업로드중: 파일 선택
    업로드중 --> 분석중: 업로드 완료
    업로드중 --> 에러: 업로드 실패
    
    분석중 --> 매핑대기: 구조 분석 완료
    분석중 --> 매핑필요: 자동 매핑 실패
    
    매핑대기 --> 검증시작: 매핑 확인
    매핑필요 --> 수동매핑: 사용자 매핑
    수동매핑 --> 매핑대기: 매핑 완료
    
    검증시작 --> 검증중: 시작
    검증중 --> 검증중: 다음 건
    검증중 --> 처리완료: 모든 건 완료
    
    처리완료 --> 리포트: 자동 생성
    리포트 --> [*]
    
    에러 --> 파일대기: 재시도
```

## 5. 화면 전환 플로우

### 5.1 메인 네비게이션 플로우

```
홈 화면
├─→ 채팅 (하단 + 버튼)
├─→ 엑셀 업로드 (홈 카드)
├─→ 내역 관리 (하단 탭)
├─→ 리포트 (하단 탭)
└─→ 설정 (프로필)

채팅 화면
├─→ 홈 (뒤로 버튼)
├─→ 내역 상세 (저장된 내역 클릭)
└─→ 설정 (우측 상단)

엑셀 업로드
├─→ 파일 선택
├─→ 매핑 확인
├─→ 대화형 검증
├─→ 완료 리포트
└─→ 홈 (완료 후)
```

### 5.2 딥링크 구조

```
moneychat://
├── home (홈 화면)
├── chat (채팅 화면)
│   └── chat/new (새 대화 시작)
├── upload (엑셀 업로드)
├── history (내역 관리)
│   ├── history/detail/{id} (상세 보기)
│   └── history/search (검색)
├── report (리포트)
│   ├── report/monthly (월별)
│   └── report/category (카테고리별)
└── settings (설정)
    ├── settings/profile
    ├── settings/category
    └── settings/export
```

## 6. 접근성 고려사항

### 6.1 스크린 리더 지원
- 모든 버튼과 인터랙티브 요소에 명확한 라벨
- 채팅 메시지 읽기 순서 최적화
- 상태 변경 시 음성 안내

### 6.2 키보드 네비게이션
- Tab 키로 모든 요소 접근 가능
- Enter 키로 기본 동작 실행
- Esc 키로 모달/팝업 닫기

### 6.3 시각적 피드백
- 고대비 모드 지원
- 색맹 사용자를 위한 아이콘 병용
- 충분한 터치 영역 확보 (최소 44x44px)

---

이 플로우 다이어그램은 머니챗의 핵심 사용자 경험을 시각화한 것입니다.
대화형 인터페이스를 통해 복잡한 가계부 작성을 단순하고 직관적으로 만드는 것이 
설계의 핵심 목표입니다.
# 머니챗 (MoneyChat) - LLM 기반 대화형 가계부

> 가계부 작성을 '업무'가 아닌 '대화'로 만들어주는 차세대 가계부 웹 서비스

## 🎯 프로젝트 개요

머니챗은 OpenAI GPT-4를 활용한 자연어 처리 기반의 대화형 가계부 서비스입니다. 사용자는 복잡한 폼 입력 대신, 친구에게 이야기하듯 자연스럽게 가계부를 작성할 수 있습니다.

**핵심 기능:**
- 🗣️ **대화형 가계부**: "어제 스벅에서 친구랑 라떼 마셔서 9천원 썼어" → 자동 분석 및 기록
- 📊 **지능형 엑셀 업로드**: 어떤 형식의 엑셀 파일도 자동 분석하여 대화형으로 검증
- 🎨 **네이버 가계부 스타일 UI**: 깔끔하고 직관적인 사용자 경험

## 🏗️ 기술 스택

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **Headless UI**
- **Zustand** (상태 관리)
- **React Query** (서버 상태 관리)
- **Socket.io Client** (실시간 채팅)

### Backend
- **NestJS** + **TypeScript**
- **PostgreSQL** + **TypeORM**
- **Redis** (캐싱, 세션)
- **Socket.io** (WebSocket)
- **GraphQL** + **REST API**

### AI/NLP
- **Python FastAPI**
- **OpenAI GPT-4o Mini**
- **LangChain** (대화 컨텍스트 관리)

### Infrastructure
- **Docker** + **Docker Compose**
- **MinIO** (파일 저장소)

## 📁 프로젝트 구조

```
/budget/
├── docker-compose.yml          # 개발 환경 오케스트레이션
├── .env                       # 환경 변수 (OpenAI API 키 포함)
├── .gitignore                 # Git 무시 파일
├── database/
│   └── init.sql              # 데이터베이스 초기화 스크립트
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── services/        # API 서비스
│   │   ├── store/           # 상태 관리
│   │   └── types/           # TypeScript 타입 정의
│   ├── package.json
│   └── Dockerfile
├── backend/                   # NestJS 백엔드
│   ├── src/
│   │   ├── modules/         # 기능별 모듈
│   │   ├── entities/        # 데이터베이스 엔티티
│   │   ├── gateways/        # WebSocket 게이트웨이
│   │   └── services/        # 비즈니스 로직
│   ├── package.json
│   └── Dockerfile
└── nlp-service/              # Python NLP 서비스
    ├── main.py              # FastAPI 메인 애플리케이션
    ├── requirements.txt     # Python 의존성
    └── Dockerfile
```

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 저장소 클론 (이미 완료)
cd /home/yoon4088/np_project/budget

# 환경 변수 확인
cat .env
```

### 2. Docker Compose로 전체 시스템 실행

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 3. 서비스 접근

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:4000/api
- **NLP 서비스**: http://localhost:8000
- **데이터베이스**: localhost:5432
- **Redis**: localhost:6379
- **MinIO**: http://localhost:9001

## 🛠️ 개발 가이드

### 개별 서비스 개발 실행

#### Frontend 개발
```bash
cd frontend
npm install
npm run dev
```

#### Backend 개발
```bash
cd backend
npm install
npm run start:dev
```

#### NLP 서비스 개발
```bash
cd nlp-service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 데이터베이스 관리

```bash
# PostgreSQL 컨테이너 접속
docker-compose exec postgres psql -U user -d moneychat

# 데이터베이스 재초기화
docker-compose down -v
docker-compose up -d postgres
```

## 🎨 UI/UX 디자인 시스템

### 컬러 팔레트
- **Primary**: #03C75A (네이버 그린)
- **사이드바**: #4A4A4A (다크 그레이)
- **배경**: #F7F7F7 (라이트 그레이)
- **수입**: #0066CC (파란색)
- **지출**: #FF4444 (빨간색)

### 주요 컴포넌트
- **2-Column 레이아웃**: 좌측 사이드바 + 우측 메인 콘텐츠
- **채팅 인터페이스**: 사용자/AI 구분된 말풍선
- **카드형 UI**: 12px 둥근 모서리, 부드러운 그림자
- **반응형 디자인**: Desktop/Tablet/Mobile 완벽 대응

## 🤖 AI 기능

### 자연어 처리 파이프라인
1. **입력 분석**: 사용자 메시지에서 날짜, 금액, 장소, 카테고리 추출
2. **컨텍스트 관리**: LangChain을 통한 대화 맥락 유지
3. **자동 분류**: 기존 사용자 패턴 학습을 통한 지능형 카테고리 분류
4. **신뢰도 점수**: 분석 결과의 정확도 측정

### 엑셀 처리 워크플로우
1. **파일 분석**: 다양한 형식의 엑셀 파일 자동 인식
2. **컬럼 매핑**: AI를 통한 자동 필드 매핑
3. **대화형 검증**: 각 행을 채팅으로 확인
4. **일괄 처리**: 검증된 데이터 자동 저장

## 📊 데이터베이스 스키마

### 주요 테이블
- `users`: 사용자 정보
- `expenses`: 지출/수입 내역
- `categories`: 카테고리 (계층구조)
- `chat_sessions`: 채팅 세션 관리
- `excel_uploads`: 엑셀 업로드 기록

## 🔐 보안 고려사항

- **API 키 보안**: .env 파일 및 환경 변수 관리
- **사용자 인증**: JWT 기반 인증 시스템
- **데이터 격리**: 사용자별 데이터 완전 분리
- **입력 검증**: 모든 API 엔드포인트 데이터 검증

## 📈 성능 최적화

### Frontend
- **React.memo**: 불필요한 리렌더링 방지
- **Virtual Scrolling**: 대화 내역 최적화
- **Service Worker**: 오프라인 기능

### Backend
- **Redis 캐싱**: NLP 결과 캐싱
- **Connection Pooling**: 데이터베이스 연결 최적화
- **GraphQL DataLoader**: N+1 쿼리 방지

### NLP Service
- **결과 캐싱**: 동일 입력 재사용
- **배치 처리**: 여러 요청 동시 처리

## 🚀 배포 가이드

### 프로덕션 배포
```bash
# 프로덕션 빌드
docker-compose -f docker-compose.prod.yml up -d

# 환경 변수 설정
export NODE_ENV=production
export DATABASE_URL=your_production_db_url
export OPENAI_API_KEY=your_production_api_key
```

## 🤝 기여 가이드

1. **Issue 생성**: 버그 리포트 또는 기능 제안
2. **브랜치 생성**: `feature/기능명` 또는 `fix/버그명`
3. **코드 작성**: ESLint, Prettier 규칙 준수
4. **테스트**: 단위 테스트 및 E2E 테스트 작성
5. **Pull Request**: 상세한 설명과 함께 PR 생성

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

- **개발팀**: [이메일 주소]
- **GitHub Issues**: [프로젝트 이슈 페이지]
- **Documentation**: [프로젝트 위키]

---

**머니챗으로 가계부 작성의 새로운 경험을 시작하세요! 💬💰**
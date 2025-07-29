# 머니챗 Railway 배포 가이드

## 🚀 Railway 배포 단계

### 1. Railway 계정 설정
1. [Railway.app](https://railway.app)에 GitHub 계정으로 로그인
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. `ddoriboo/budget` 저장소 선택

### 2. 환경 변수 설정 ⚠️ 중요!
Railway 대시보드에서 다음 환경 변수들을 **반드시** 설정하세요:

```bash
# 🔑 필수 환경 변수 - 없으면 앱이 작동하지 않습니다!
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxx  # OpenAI API 키
NODE_ENV=production
PORT=3000

# 선택적 환경 변수 (향후 백엔드 연동 시)
DATABASE_URL=postgresql://user:password@host:5432/moneychat
REDIS_URL=redis://host:6379
JWT_SECRET=your-production-jwt-secret
```

**🔧 Railway 환경변수 설정 방법:**
1. Railway 프로젝트 대시보드로 이동
2. "Variables" 탭 클릭
3. "New Variable" 버튼 클릭
4. Variable name: `VITE_OPENAI_API_KEY`
5. Variable value: 실제 OpenAI API 키 입력
6. "Add" 버튼 클릭

### 3. 빌드 설정
Railway가 자동으로 감지하지만, 확인용:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 4. 도메인 설정
1. Railway 대시보드에서 "Settings" 탭
2. "Public Networking" 섹션
3. "Generate Domain" 클릭하여 자동 도메인 생성
4. 또는 커스텀 도메인 연결

## 🔧 배포 후 확인사항

### 1. 서비스 상태 확인
- [ ] 애플리케이션이 정상적으로 시작되는지 확인
- [ ] 모든 페이지가 로드되는지 확인
- [ ] OpenAI API 연동이 작동하는지 확인

### 2. 환경 변수 확인
- [ ] VITE_OPENAI_API_KEY가 올바르게 설정되었는지 확인
- [ ] 브라우저 개발자 도구에서 환경 변수 오류가 없는지 확인

### 3. 성능 테스트
- [ ] 대화형 채팅 기능 테스트
- [ ] 응답 시간이 합리적인지 확인
- [ ] 모바일에서도 정상 작동하는지 확인

## 🐛 문제 해결

### 빌드 실패 시
1. Railway 로그에서 오류 메시지 확인
2. 환경 변수가 올바르게 설정되었는지 확인
3. package.json의 scripts가 올바른지 확인

### OpenAI API 오류 시
1. API 키가 유효한지 확인
2. API 키에 충분한 크레딧이 있는지 확인
3. CORS 오류가 발생하는지 확인

### 로딩 속도 개선
1. Railway의 리전을 가장 가까운 곳으로 설정
2. Vite의 build 최적화 옵션 활용
3. 필요시 CDN 연동 고려

## 📊 모니터링

Railway 대시보드에서 다음을 모니터링하세요:
- CPU 사용률
- 메모리 사용률
- 네트워크 트래픽
- 응답 시간

## 🔄 업데이트 배포

코드 변경 후 자동 배포:
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
```

Railway가 자동으로 새 버전을 감지하고 배포합니다.

## 🌐 예상 배포 URL

Railway 자동 생성 URL: `https://budget-production-xxxx.up.railway.app`

## 💰 비용 관리

- Railway 무료 티어: 월 $5 크레딧
- OpenAI API: 사용량에 따라 과금
- 예상 월 비용: $10-20 (소규모 사용 시)

## 📞 지원

문제 발생 시:
1. GitHub Issues: https://github.com/ddoriboo/budget/issues
2. Railway 문서: https://docs.railway.app
3. OpenAI 문서: https://platform.openai.com/docs
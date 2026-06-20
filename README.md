# 우리단지토크 🏢

> 아파트 주민이 익명으로 민원을 올리고 함께 투표해 공식 청원까지 올리는 모바일 커뮤니티 앱

## 서비스 소개

아파트 민원은 개인이 혼자 제기하면 묵살되고, 실명 노출이 두려워 포기하는 경우가 많습니다.  
**우리단지토크**는 익명성을 보장하면서 주민들이 함께 공감대를 형성하고, 공식 청원까지 연결하는 구조를 제공합니다.

## 주요 기능

- **익명 민원 게시판** — 닉네임만으로 가입, 동·호수 노출 없이 카테고리별 민원 작성
- **공감 · 댓글** — 이웃 주민과 익명으로 소통
- **안건 발의 · 청원 투표** — 게시글에서 바로 정식 안건 발의, 찬반 투표로 공감대 형성
- **청원 현황 추적** — 진행 중인 청원 목록 및 투표 현황 실시간 확인
- **PWA 지원** — 홈화면에 설치해 네이티브 앱처럼 사용 가능

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| PWA | vite-plugin-pwa |
| Backend/DB | Supabase (PostgreSQL) |
| 인증 | UUID + localStorage (MVP) |
| 배포 | Vercel |

## 시작하기

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Supabase URL과 ANON KEY 입력

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 환경 변수

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 프로젝트 구조

```
src/
├── pages/
│   ├── SignUp.jsx       # 가입 페이지
│   ├── Home.jsx         # 민원 목록
│   ├── PostDetail.jsx   # 게시글 상세
│   ├── WritePost.jsx    # 글쓰기
│   ├── Petitions.jsx    # 청원 목록
│   ├── PetitionVote.jsx # 청원 투표
│   └── Profile.jsx      # 내 정보
├── components/
│   └── BottomNav.jsx    # 하단 네비게이션
├── context/
│   └── AuthContext.jsx  # 인증 컨텍스트
└── lib/
    └── supabase.js      # Supabase 클라이언트 및 API
```

## 현재 한계 (MVP)

- 실명 인증 없음 (동·호수 허위 입력 가능)
- 이미지 업로드 비활성화
- RLS 보안 비활성화 상태 (실서비스 전 재설정 필요)

## 향후 계획

- 관리사무소 코드 기반 입주민 실명 인증
- 청원 달성 시 PDF 자동 생성 + 관리사무소 이메일 발송
- 푸시 알림 (청원 달성, 댓글)
- RLS 보안 재활성화

## 사용한 AI 도구

- **Claude (Anthropic)** — 기획, 코드 생성, 디버깅
- **Google Stitch** — UI 디자인 시안
- **Supabase MCP** — DB 자동 생성 및 연동

---

Made with Claude + Supabase + Vercel

# 미션팟 (NudgeMe)

소셜 임팩트 챌린지 서비스 — 베타 준비 중

## 소개
플랫폼이 던져주는 게릴라 미션에 **1,000원**으로 참여하세요.
- ✅ 성공하면 참가비 환급
- 💝 실패하면 기부로 전환

어떻게 해도 의미 있는 하루를 만드는 넛지(Nudge) 기반 챌린지 플랫폼입니다.

## 동작 방식
1. **미션 수신** — 시간대·날씨·요일에 맞춘 게릴라 미션 푸시 알림
2. **참여 결제** — 1,000원 참가비로 즉시 참여
3. **인증** — GPS·타임스탬프·사진으로 자동 인증
4. **정산** — 성공 시 환급, 실패 시 기부 처리

## 기술 스택
- React 19.2
- Vite 8
- ESLint 9

## 개발

```bash
cd NudgeMe
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # 린트
npm run preview  # 빌드 미리보기
```

## 프로젝트 구조
```
NudgeMe/
├── public/        # 정적 에셋 (favicon, icons)
├── src/
│   ├── main.jsx   # 진입점
│   ├── App.jsx    # 랜딩 페이지
│   ├── App.css
│   └── index.css
├── index.html
└── vite.config.js
```

## 상태
- 브랜치: `Kiwon`
- 베타 서비스 준비 중 (사행행위 규제 준수 법무 검토 중)
- 문의: hello@missionpot.kr

---
© 2025 미션팟 · AI Business Group 10

# figma-to-slack-bot

Figma에서 Version history 업데이트(FILE_VERSION_UPDATE)가 발생하면 Slack Incoming Webhook으로 알림을 보냅니다.

## 1) 로컬 실행
```bash
npm i
cp .env.example .env
# .env에 FIGMA_WEBHOOK_PASSCODE / SLACK_WEBHOOK_URL 실제 값 입력
npm start
서버 확인:
http://localhost:3000/ -> ok
2) 배포 (Render 추천)
Render에서 New Web Service
Build Command: npm install
Start Command: npm start
Env vars:
FIGMA_WEBHOOK_PASSCODE
SLACK_WEBHOOK_URL
배포 후 엔드포인트:
https://YOUR-RENDER-URL.onrender.com/figma/webhook
3) Figma Webhook 생성
Figma Webhook은 API로 생성해야 합니다.
예시(curl):
curl -X POST "https://api.figma.com/v2/webhooks" \
  -H "Authorization: Bearer YOUR_FIGMA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "FILE_VERSION_UPDATE",
    "team_id": "YOUR_TEAM_ID",
    "endpoint": "https://YOUR-RENDER-URL.onrender.com/figma/webhook",
    "passcode": "YOUR_PASSCODE_SAME_AS_ENV",
    "status": "ACTIVE"
  }'
이후 Figma에서:
File → Save to version history...
하면 Slack에 알림이 옵니다.
4) 보안
.env는 절대 커밋하지 마세요.
Slack Webhook URL은 비밀번호입니다.

---

# 5) Cursor에서 “한 번에” 만드는 방법 (실전 체크리스트)
1) Cursor에서 새 폴더 생성: `figma-to-slack-bot`
2) 위 레포 구조대로 파일 5개 생성하고 각각 내용 붙여넣기
3) 터미널에서:
   ```bash
   npm i
   cp .env.example .env
.env에 값 채우기
FIGMA_WEBHOOK_PASSCODE=아무문자열(예: my_super_secret)
SLACK_WEBHOOK_URL=슬랙에서 받은 URL
로컬 실행:
npm start
Render에 GitHub 연결해서 배포
배포 URL로 Figma webhook 생성(curl)
Figma에서 버전 저장 → Slack 알림 확인
6) “복붙 실수 방지” 필수 주의사항 5개
.env 절대 커밋 금지 (진짜로)
Slack Webhook URL 유출되면 아무나 네 채널에 스팸 쏜다
Figma webhook의 passcode와 서버 env의 passcode는 무조건 동일
엔드포인트는 반드시 외부 접근 가능한 HTTPS (Render 배포하면 해결)
버전 업데이트는 “그냥 저장”이 아니라 Save to version history… 로 이름 붙이는 동작이 제일 확실함


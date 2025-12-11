# Toy – 멀티 게임(틱택토/지뢰찾기/드로잉) 데모

Socket.IO로 여러 사용자가 동시에 플레이·드로잉할 수 있는 작은 데모입니다. 클라이언트는 React + Vite, 서버는 Express + Socket.IO로 구성되어 있습니다.

## 폴더 구조
```
client/  # React 클라이언트 (Vite)
server/  # Express + Socket.IO 서버
```

## 주요 기능
- 틱택토: 서버가 턴/판 상태를 관리, 실시간 동기화
- 지뢰찾기(10x10/10개): 셀 공개·깃발 토글·리셋 실시간 공유
- 드로잉 보드: 여러 사용자가 동시에 그려도 경로가 섞이지 않도록 사용자별 스트로크 처리
- 틱택토 방: 5자리 코드로 방 생성/입장, 방당 2인 플레이

## 빠른 실행
### 서버
```bash
cd server
npm install
# 환경변수: PORT(기본 3001), CLIENT_ORIGINS(쉼표 구분 허용 오리진, 기본 http://localhost:5173)
npm start
```

### 클라이언트(개발 서버, HMR)
```bash
cd client
npm install
# 환경변수: VITE_SOCKET_URL (기본 http(s)://<현재호스트>:3001)
npm run dev
```

브라우저에서 `http://localhost:5173`로 접속 후 게임을 선택해 테스트합니다.

## 빌드/프리뷰
```bash
cd client
VITE_SOCKET_URL=http://localhost:3001 npm run build
npm run preview  # 프로덕션 번들 미리보기
```

## Docker (서버)
```bash
cd server
docker build -t toy-server .
docker run -p 3001:3001 -e PORT=3001 -e CLIENT_ORIGINS=http://localhost:5173 toy-server
```

## PM2로 서버 유지(선택)
```bash
npm install -g pm2
cd server && pm2 start index.js --name toy-server
pm2 save && pm2 startup   # 재부팅 후 자동 시작
# 확인/중지: pm2 status, pm2 stop toy-server
```

## 환경변수 정리
- 서버: `PORT`(기본 3001), `CLIENT_ORIGINS`(쉼표 구분 오리진 목록, 기본 `http://localhost:5173`)
- 클라이언트: `VITE_SOCKET_URL`(기본 `http(s)://<현재호스트>:3001`)

## 스크립트
- 루트: 없음(메타)
- server: `npm start`
- client: `npm run dev`(HMR), `npm run build`, `npm run preview`, `npm run lint`

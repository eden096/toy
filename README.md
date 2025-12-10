# toy

## Quick start
- Client: `cd client && npm install && npm run dev` (env: `VITE_SOCKET_URL`, defaults to `http://localhost:3001`)
- Server: `cd server && npm install && npm start` (env: `PORT`, `CLIENT_ORIGINS`, defaults to `3001` + `http://localhost:5173`)

## Keep the server running (PM2 on a host)
1) `npm install -g pm2`
2) `cd server && pm2 start index.js --name toy-server`
3) 재부팅 유지: `pm2 save && pm2 startup` 출력 명령 실행
4) 상태/중지: `pm2 status`, `pm2 stop toy-server`

배포 시 CORS와 소켓 URL을 실제 도메인으로 설정하세요.

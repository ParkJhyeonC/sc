@echo off
chcp 65001 >nul
title 연수 관리 서버 (Training Management Server)
echo ===================================================
echo 연수 관리 및 이수증 제출 서버를 시작합니다...
echo ===================================================

:: Check if node_modules exists
if not exist "node_modules" (
    echo [안내] 필요한 패키지를 설치합니다. 잠시만 기다려주세요...
    call npm install
)

:: Start the server
echo [안내] 서버를 구동합니다...
echo [안내] 브라우저에서 http://localhost:3000 으로 접속하세요.
echo ===================================================
call npm run dev

pause

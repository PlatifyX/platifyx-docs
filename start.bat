@echo off
echo.
echo Starting PlatifyX...
echo.

if exist .platifyx.pid (
    echo Warning: PlatifyX is already running. Stop it first with stop.bat
    exit /b 1
)

echo Installing dependencies...
echo.

echo Installing backend dependencies...
cd backend
go mod download
cd ..

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Starting services...
echo.

if not exist logs mkdir logs

echo Starting Backend (http://localhost:8080)...
cd backend
start /B go run cmd/api/main.go > ..\logs\backend.log 2>&1
cd ..

timeout /t 3 /nobreak > nul

echo Starting Frontend (http://localhost:3000)...
cd frontend
start /B npm run dev > ..\logs\frontend.log 2>&1
cd ..

echo. > .platifyx.pid

echo.
echo PlatifyX started successfully!
echo.
echo Access:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8080
echo   API Docs: http://localhost:8080/api/v1/health
echo.
echo Logs:
echo   Backend:  logs\backend.log
echo   Frontend: logs\frontend.log
echo.
echo To stop: run stop.bat
echo.

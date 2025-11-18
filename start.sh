#!/bin/bash

echo "🚀 Starting PlatifyX..."
echo ""

PID_FILE=".platifyx.pid"

if [ -f "$PID_FILE" ]; then
    echo "⚠️  PlatifyX is already running. Stop it first with ./stop.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
echo ""

echo "Installing backend dependencies..."
cd backend
go mod download
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "🔧 Starting services..."
echo ""

echo "Starting Backend (http://localhost:6000)..."
cd backend
go run cmd/api/main.go > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../.backend.pid
cd ..

sleep 2

echo "Starting Frontend (http://localhost:7000)..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid
cd ..

echo "$BACKEND_PID $FRONTEND_PID" > $PID_FILE

echo ""
echo "✅ PlatifyX started successfully!"
echo ""
echo "📍 Access:"
echo "   Frontend: http://localhost:7000"
echo "   Backend:  http://localhost:6000"
echo "   API Docs: http://localhost:6000/api/v1/health"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop: ./stop.sh"
echo ""

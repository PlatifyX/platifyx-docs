#!/bin/bash

echo "🛑 Stopping PlatifyX..."
echo ""

PID_FILE=".platifyx.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  PlatifyX is not running"
    exit 1
fi

if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Stopping Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    rm .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "Stopping Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    rm .frontend.pid
fi

rm $PID_FILE

echo ""
echo "✅ PlatifyX stopped successfully!"
echo ""

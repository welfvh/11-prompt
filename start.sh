#!/bin/bash

# Startup script for 11-prompt platform

echo "🚀 Starting 11-Prompt Testing Platform..."

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo "📝 Please edit backend/.env and add your API keys before continuing."
    exit 1
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend
source venv/bin/activate 2>/dev/null || {
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
}

python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 11-Prompt platform is running!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C and cleanup
trap "echo '\n🛑 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for both processes
wait

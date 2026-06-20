#!/bin/bash
# AgriMarket Ghana - Start both backend and frontend

echo "Starting AgriMarket Ghana..."

# Backend
cd backend
source venv/bin/activate
python seed_data.py
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend running at http://localhost:8000 (PID: $BACKEND_PID)"
cd ..

# Frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend running at http://localhost:5173 (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "AgriMarket Ghana is live!"
echo "  App:  http://localhost:5173"
echo "  API:  http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo ""
echo "Demo login:"
echo "  Buyer:  phone 0271001001 / password buyer123"
echo "  Farmer: phone 0241001001 / password farmer123"
echo "  Driver: phone 0261001001 / password driver123"
echo ""
echo "Press Ctrl+C to stop both servers."
wait

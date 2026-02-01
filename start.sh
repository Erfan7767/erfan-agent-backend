#!/bin/bash
# Install Python dependencies if not already installed (checked by pip)
pip install -r requirements.txt

# Start Python backend in background
echo "Starting Python Backend on port 8000..."
python3 -m uvicorn server.main:app --host 0.0.0.0 --port 8000 &
PID=$!

# Start Node/Vite frontend (existing workflow)
echo "Starting Frontend..."
npm run dev

# Cleanup
kill $PID

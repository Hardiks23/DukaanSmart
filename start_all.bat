@echo off
echo ==========================================================
echo   DUKAANSMART — AI RETAIL INTELLIGENCE AGENT
echo   HackWithHyderabad 3.0 — Team 404: COMPETITION NOT FOUND
echo ==========================================================
echo Starting Backend on http://localhost:8000 ...
start "DukaanSmart Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend on http://localhost:5173 ...
start "DukaanSmart Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo DukaanSmart is launching!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.

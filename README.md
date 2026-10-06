# AgriSense

AI-based precision agriculture system for real-time, personalized irrigation and
fertilizer recommendations.

- **Frontend:** React + Vite + Tailwind (this folder)
- **Backend:** Flask + MongoDB (`backend/`), see [backend/README.md](backend/README.md)

## Quick start

```bash
# Terminal 1: backend
cd backend
python -m venv venv
venv\Scripts\activate            # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env           # Mac/Linux: cp .env.example .env
python run.py                    # http://localhost:5000

# Terminal 2: frontend
npm install
npm run dev                      # http://localhost:3000
```

MongoDB must be running (or set `MONGO_URI=mongomock://` in `backend/.env` for a
quick in-memory trial; requires `pip install mongomock`).

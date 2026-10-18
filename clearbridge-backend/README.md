# BizBridge translation backend

A separate FastAPI service for translating frontend page text with OpenAI. Gemini, document analysis, and ElevenLabs run in `ml/backend/` on port 8000.

## Run

From the repository root, install dependencies into your Python environment:

```powershell
.\.venv312\Scripts\python.exe -m pip install -r clearbridge-backend/requirements.txt
cd clearbridge-backend
..\.venv312\Scripts\python.exe -m uvicorn main:app --reload --port 8001
```

Configure `OPENAI_API_KEY` privately in this service's process environment or `clearbridge-backend/.env`. `OPENAI_MODEL` is optional (default `gpt-5-mini`). Never commit secrets.

Check `http://localhost:8001/health`; `openai_key_set` should be `true`. Add the frontend origin to comma-separated `CORS_ORIGINS` when needed. The frontend uses `VITE_TRANSLATION_API_URL`, defaulting to `http://127.0.0.1:8001`. LAN clients need a browser-reachable URL.

## Endpoints

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/health` | | `{status, openai_key_set, model}` |
| POST | `/translate` | `{"language":"es","texts":["Dashboard"]}` | `{"translations":["Panel"]}` |

Translation languages: Spanish (`es`), Hindi (`hi`), Vietnamese (`vi`), Korean (`ko`), Simplified Chinese (`zh`), French (`fr`), and Portuguese (`pt`). English is the frontend's original language.

For the full application setup, see the [repository README](../README.md).

# BizBridge - Business Made Simpler

An accessible business guidance platform built for HackATL 2026 with React/Vite, FastAPI, Google Gemini, local document classification, and ElevenLabs voice tools.

## What works

- **Dashboard:** business workspace, checklist progress, and navigation.
- **Requirements:** "Your business checklist" collects a business profile and generates requirements for supported businesses inside Atlanta city limits. Required evidence and applicability reviews remain separate; checklist results are not legal determinations. The jurisdiction disclaimer appears at the bottom.
- **Document review:** upload a PDF or supported document photo, inspect the predicted type and classification score, and correct extracted business names, addresses, document numbers, and dates. Once available, results appear beside the upload controls on desktop and above them on mobile; the chatbot stays below.
- **Gemini assistant:** ask business questions and follow source links when available. Reviewed document details accompany questions only after explicit opt-in. Enabling that option moves focus to the chatbot; replacing or clearing a document resets sharing.
- **Voice input:** click the microphone, speak, and pause to transcribe with ElevenLabs. The transcript stays editable; Send submits the question. Compact finish/cancel controls appear beside Send during recording. Answer playback has separate per-answer consent and Play/Pause controls.
- **Accessibility:** open the account avatar menu, then **Accessibility settings** for text sizes, dark mode, high contrast, OpenDyslexic font, reduced motion, and language selection. Settings persist per device. Languages: English, Spanish, Hindi, Vietnamese, Korean, Simplified Chinese, French, and Portuguese.
- **Deadlines and Find Experts:** deadline tracking and searchable expert listings. Expert profiles, ratings, business names, and distances remain fictional demo data; supported search locations are Atlanta, Austin, and Seattle (30303, 78701, 98101). Live listings and personal LinkedIn connections are not connected.

## Repository and services

The current BizBridge application is **`clearbridge-frontend/`**. Other frontend directories are earlier implementations.

| Directory | Purpose | Local port |
| --- | --- | --- |
| `clearbridge-frontend/` | React/Vite UI | 5173 |
| `ml/backend/` | Gemini chat, PDF/photo analysis, ElevenLabs proxy | 8000 |
| `clearbridge-backend/` | OpenAI page translation | 8001 |
| `ml/models/` | Trusted local document classifier |
| `ml/sample_documents/` | Fictional test PDFs and measured sample results |
| `ml/tests/` | Backend tests |

Documents use PyMuPDF, scikit-learn, and label-based field extraction. Photos use local RapidOCR before the same classifier/extractor. Audio validation uses bundled FFmpeg. Provider credentials stay server-side.

## Local setup

Prerequisites: Python 3.12, Node.js/npm, and Git. Run commands from the repository root unless noted.

```powershell
git clone https://github.com/AAWRONGGG/HackATL.git
cd HackATL
py -3.12 -m venv .venv312
.\.venv312\Scripts\python.exe -m pip install -r ml/requirements.txt
.\.venv312\Scripts\python.exe -m pip install -r clearbridge-backend/requirements.txt
```

Configure these names privately in the ML backend's process environment or `ml/backend/.env`:

- `GEMINI_API_KEY`: required for chat.
- `BIZBRIDGE_GEMINI_MODEL`: optional override; choose a model available to your API project.
- `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`: required for voice features.
- `BIZBRIDGE_CORS_ORIGINS`: comma-separated browser origins if using direct cross-origin API calls.

ML configuration precedence is process environment, then `ml/backend/.env`, then the repository-root `.env` for missing values. Restart the service after changing configuration. The voice variable names are also listed in `ml/backend/.env.example` with empty values. Never commit secrets or expose provider keys through `VITE_*` variables.

For translation, configure `OPENAI_API_KEY` in `clearbridge-backend/.env` or its process environment. `OPENAI_MODEL` is optional; `CORS_ORIGINS` controls allowed frontend origins for that separate service.

Start each service in a separate terminal:

```powershell
# ML backend
.\.venv312\Scripts\python.exe -m uvicorn ml.backend.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
# Translation backend
cd clearbridge-backend
..\.venv312\Scripts\python.exe -m uvicorn main:app --reload --port 8001
```

```powershell
# Current frontend
cd clearbridge-frontend
npm install
npm run dev
```

Open `http://localhost:5173`. ML health and interactive API docs are at `http://127.0.0.1:8000/health` and `/docs`; translation health is at `http://127.0.0.1:8001/health`.

Vite proxies chat, document/photo analysis, and voice requests to port 8000 during development. Translation connects directly to port 8001; override its URL with `VITE_TRANSLATION_API_URL` when needed. For LAN testing, that URL must be reachable from the other device and allowed by translation CORS. Microphones require HTTPS or localhost.

Production hosting must provide equivalent `/api` routing or set a browser-reachable `VITE_AI_API_URL` at build time and allow the frontend origin in backend CORS. Vite's development proxy is not a production proxy. See [frontend documentation](clearbridge-frontend/README.md) for interaction and API details.

## ML API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Service and model-file availability |
| POST | `/api/chat` | Gemini guidance and source links |
| POST | `/api/analyze-document` | Multipart PDF upload, field `file` |
| POST | `/api/classify-document` | Compatible PDF classification endpoint |
| POST | `/api/analyze-image` | Multipart document photo, field `file` |
| POST | `/api/voice/transcribe` | Audio transcription with explicit consent |
| POST | `/api/voice/speak` | Answer audio with explicit consent |

## Verification

```powershell
.\.venv312\Scripts\python.exe -m pip install pytest
.\.venv312\Scripts\python.exe -m pytest ml/tests -q
cd clearbridge-frontend
npm run build
```

Manual smoke test:

1. Open Dashboard, Requirements, AI Assistant, Deadlines, and Find Experts. Check the heading/profile alignment, account menu, and mobile layout.
2. Open Accessibility settings and test dark mode, contrast, keyboard navigation, and Hindi translation with the translation service running.
3. Upload a [sample PDF](ml/sample_documents/README.md), review the real score/fields, and edit a field. Enable document sharing and submit a question; clear/replace the file to verify consent resets.
4. Test microphone permission, speech/pause transcription, cancellation, editable text, and explicit Send on localhost/HTTPS. Test answer playback with a configured voice. Check native camera capture on a supported mobile device.

## Limits and responsible use

- Requirements support Atlanta city limits only; confirm legal obligations, applicability, fees, and deadlines with agencies or qualified professionals.
- Classification scores are **not calibrated confidence or measured accuracy**. Extracted fields and review statuses are provisional, not proof of compliance or permit validity. Sample scores are recorded honestly; training-derived samples are not independent evaluation.
- PDFs: 10 MB, 20 pages, unencrypted, text-selectable. Image-only scanned PDFs are unsupported; attach a supported photo or provide a text-selectable PDF instead.
- Photos: JPEG, PNG, or WebP, 10 MB / 20 megapixels. Local OCR supports printed Latin text best (English/Spanish); Hindi-script photo OCR is unsupported even though the UI supports Hindi.
- Voice: supported decoded audio is limited to 12 MB / 60 seconds. Transcription language options are English, Hindi, and Spanish. Silence detection normally finishes after a 1.6-second pause; device/browser behavior varies.
- The app does not persist uploaded contents, recordings, edited document fields, transcripts, or generated audio. Explicitly shared questions/details go to Gemini, recordings to ElevenLabs for transcription, and selected answers to ElevenLabs for playback. Provider retention follows the provider account's policies.
- Avoid sensitive IDs. Source links and AI responses require verification. Persistent conversation memory and live expert search are not implemented.
- Public deployment still requires appropriate access controls, abuse protection, rate limiting, and operational monitoring.

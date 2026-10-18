to run frontend: npm run dev

## Accessibility settings

The **Accessibility** button in the header (every page) controls text size, dark mode, high contrast,
a dyslexia-friendly font (OpenDyslexic), reduced motion, and language. Settings are saved per device and
start from the device's own dark-mode / reduced-motion / contrast settings.

- Code: `src/accessibility/` (settings, panel, page translator) and `src/accessibility/accessibility.css`.
- New pages only need normal class names; to keep text from being translated, add `data-no-translate`.

## Connecting the backend (translation)

Translation goes through the BizBridge backend's `/translate` endpoint (Claude now, your own model later).
Run the backend on port 8000, or point the app elsewhere with `VITE_API_URL` in `.env.local`:

```
VITE_API_URL=http://localhost:8000
```

Without the backend, everything else works; picking a language shows a message asking you to start it.


## Document review (React/Vite)

From the repository root, use the working Python 3.12 environment:

```powershell
.\.venv312\Scripts\python.exe -m pip install -r ml\requirements.txt
.\.venv312\Scripts\python.exe -m uvicorn ml.backend.main:app --host 127.0.0.1 --port 8000
```

Then run `npm run dev` inside `clearbridge-frontend`. Vite forwards
`/api/analyze-document` to the document-analysis service on port 8000.
Restart Vite after adding or changing its configuration. This same-origin upload
also works when opening the frontend's LAN address from another device.
Document uploads always use this proxy during development, even if
`VITE_AI_API_URL` is configured, so LAN pages never bypass it with a loopback request.
For production builds, `VITE_AI_API_URL` still takes precedence; a direct cross-origin
URL must be reachable from the browser and permitted by the backend's CORS settings.
Production hosting must forward `/api/analyze-document` to the ML backend, or use
a reachable `VITE_AI_API_URL` override. Vite's development proxy is not a production proxy.

`GET http://127.0.0.1:8000/health` should report the model file is present.
Upload a text-selectable PDF (maximum 10 MB / 20 pages). The API accepts multipart
`file`, uses the existing local classifier and label-based field extractor, and
returns unverified candidates. It does not send the PDF to Gemini. Extracted details
are included in a chat question only after selecting the consent checkbox;
a new review resets consent. Image-only scans require OCR, which is not supported.

A connection error means the browser or Vite could not reach document review;
check the ML backend terminal and port 8000. Invalid PDF and OCR errors come from
the backend and appear in the review section. The separate translation service
on port 8001 is unchanged.


## Multimodal assistant

The AI page uses one multiline composer (Enter to send, Shift+Enter for a new line).
The + button accepts PDFs and JPEG/PNG/WebP photos; Camera opens the device's native
capture/file chooser only after it is clicked. Selecting a file runs local analysis.
Review and correct the fields before enabling their inclusion with Gemini questions.
Removing/replacing a document resets sharing. User questions, answers, filenames, and
field values are excluded from automatic page translation; Gemini answers in the
selected UI language, and all existing UI languages remain available.

Photo OCR runs locally with the bundled RapidOCR model, then reuses the PDF classifier
and field extractor. It is best for clear printed Latin text (English/Spanish), and
**does not support Hindi-script photos**. Photos are limited to 10 MB / 20 megapixels.
PDF limits remain 10 MB / 20 pages; image-only PDFs still need a text-selectable PDF
or a separately attached supported photo. AI-generated results require verification.

Install updated `ml/requirements.txt` and restart the ML backend. The app does not
persist document contents, edited fields, recordings, transcripts, or generated audio.
ElevenLabs may retain provider requests under its own account policies; this app does
not claim provider zero-retention mode.

### Voice setup (backend only)

`ml/backend/.env.example` lists variable names without values. Configure
`ELEVENLABS_API_KEY` and an accessible `ELEVENLABS_VOICE_ID` in the **ML backend's
process environment**, then restart it. Never put these into `VITE_*` variables.
No existing environment files need to be edited by this implementation.

- `POST /api/voice/transcribe`: multipart `file`, `language` (`en`, `hi`, `es`), and
  explicit `consent=true`. Uses ElevenLabs `scribe_v2`.
- `POST /api/voice/speak`: JSON `text`, `language`, `consent=true`. Uses the configured
  voice and `eleven_multilingual_v2` (the answer's own language determines playback).
- Audio supports WebM, Ogg, WAV, MP4/M4A, and MP3, capped at 12 MB and 60 seconds.
  Content is decoded locally using the bundled FFmpeg executable before transcription;
  browser-provided MIME, filename, and duration alone are not trusted.

Click Mic to start the disclosed ElevenLabs transcription flow. Speak and pause;
local silence detection stops the recording and transcribes automatically. Done
also finishes and transcribes; Cancel discards/aborts. There is no separate recording
preview or transcription checkbox. Text stays editable and is not sent to Gemini
until Send is pressed. Silence detection uses a 1.6-second pause after speech;
recordings with no detected speech stop after 8 seconds, and all recordings stop
before 60 seconds. If silence detection is unavailable, use Done.
Listen retains its per-answer consent and Play/Pause controls. Missing credentials
produce actionable errors, never fake transcripts or audio.
Checking the document-sharing option focuses the chatbot below the results.


Microphones require **HTTPS or localhost**. Recording on an HTTP LAN URL is blocked
by browsers and the UI explains the limitation. Camera capture requires a supported
mobile browser and is tested via a native capture input; desktop may open a file chooser.
Physical microphone/camera behavior and live ElevenLabs output must be checked on the
target device after configuring the voice service.

Vite proxies `/api/chat`, `/api/analyze-document`, `/api/analyze-image`, and `/api/voice`
to port 8000. Translation remains on its existing port 8001 connection. Production
must supply equivalent routing or a reachable `VITE_AI_API_URL`.

Provider references: [ElevenLabs transcription](https://elevenlabs.io/docs/api-reference/speech-to-text/convert),
[speech synthesis](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), and
[supported models/languages](https://elevenlabs.io/docs/overview/models).

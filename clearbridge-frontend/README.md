# BizBridge frontend

The current React/Vite application lives in this directory. See the [repository README](../README.md) for the complete three-service setup and feature overview.

## Run and build

```powershell
npm install
npm run dev
npm run build
```

Vite serves the UI on port 5173. Run `ml.backend.main:app` on port 8000 and the separate `clearbridge-backend` translation service on port 8001.

## Headers and accessibility

Pages share a heading/profile layout without an empty top header. The account avatar menu contains **Accessibility settings** above Sign out. The existing panel controls text size, dark mode, high contrast, OpenDyslexic font, reduced motion, and all supported UI languages, including Hindi. Settings are stored per device.

Accessibility code is in `src/accessibility/`. Add `data-no-translate` to content that must retain its original text. User messages, answers, filenames, and extracted field values are excluded from automatic page translation.

Translation uses OpenAI through the separate `/translate` endpoint. Its default base URL is `http://127.0.0.1:8001`; override with `VITE_TRANSLATION_API_URL`. A LAN client needs a reachable translation URL and an allowed CORS origin.

## Document review and chat

Document review appears above the chatbot. With results available, desktop shows results on the left and file controls on the right; mobile stacks results first. Uploads reuse the real local classifier and field extractor. Scores are not calibrated confidence, and detected fields require review.

- PDF: text-selectable, unencrypted, up to 10 MB / 20 pages. Image-only scanned PDFs are unsupported.
- Photo: JPEG/PNG/WebP, up to 10 MB / 20 megapixels. RapidOCR runs locally; printed English/Spanish works best, Hindi-script photos are unsupported.
- The document controls require **Review Document**. Attaching through the chat composer's + or Camera control starts analysis on selection. Camera uses native device capture where supported; desktop may show a file chooser.
- Correct fields before checking the option to include reviewed details with Gemini questions. This focuses the chatbot below. Sharing is opt-in and resets when a document is cleared/replaced or newly reviewed.
- Enter sends a question; Shift+Enter adds a line. Questions are not automatically sent after upload or transcription. Source links appear when supplied by the backend.

## Voice

Configure `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` on the ML backend only, then restart it. Never use `VITE_*` variables for provider keys.

Click Mic, speak, then pause. Local silence detection ends recording after a 1.6-second pause and automatically requests ElevenLabs transcription. No-speech recording stops after 8 seconds; recording always ends before 60 seconds. Compact finish/cancel icons beside Send provide manual control, including when silence detection is unavailable. Transcribed text remains editable and Send is separate.

Microphones need HTTPS or localhost. Transcription supports English, Hindi, and Spanish. Answer playback requires separate per-answer consent and provides Play/Pause controls. Errors remain visible; routine transcript announcements are available to screen readers without extra visible instructional text.

The app does not persist recordings or generated audio. Provider retention is governed by the provider account's policies. Test physical microphone/camera behavior on the target device.

## API routing

Development always uses Vite's same-origin proxy for `/api/chat`, `/api/analyze-document`, `/api/analyze-image`, and `/api/voice`, targeting `http://127.0.0.1:8000`. This avoids browser loopback requests to the wrong device when using a LAN frontend address.

Production must provide equivalent routing or a reachable `VITE_AI_API_URL` at build time, with backend CORS allowing the frontend origin. The development proxy does not run in a production build.

Voice API contracts:

- `POST /api/voice/transcribe`: multipart `file`, `language` (`en`, `hi`, `es`), `consent=true`; ElevenLabs `scribe_v2`.
- `POST /api/voice/speak`: JSON `text`, `language`, `consent=true`; configured voice with `eleven_multilingual_v2`.
- Audio supports decoded WebM, Ogg, WAV, MP4/M4A, and MP3, up to 12 MB / 60 seconds. The server validates content using bundled FFmpeg.

## Troubleshooting

- **Cannot connect to document review:** check ML `/health`, port 8000, model availability, and Vite/backend terminals. Restart Vite after proxy changes.
- **Chat unavailable:** check server-side Gemini configuration and provider availability/quota; missing configuration and transient failures return helpful errors rather than fabricated answers.
- **Voice unavailable:** verify both ElevenLabs settings and voice access, restart the ML service, and check microphone permission/secure origin.
- **Language changes fail:** verify the separate translation service on port 8001 and its URL/CORS configuration.

Use [sample PDFs](../ml/sample_documents/README.md) for document testing. Run `npm run build` here and backend tests from the repository root as described in the main README.

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

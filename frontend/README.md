# PeachPermit frontend

Next.js 16 + Tailwind 4. Runs on sample data by default so it works before the backend is ready.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Landing page |
| `/onboard` | Questionnaire that builds the business profile |
| `/dashboard` | Checklist by jurisdiction, upcoming deadlines, new-bill alerts |
| `/check` | Upload a document (or pick a sample) and run the check |
| `/report/[id]` | Gap report: findings, fixes, citations, attorney flags |
| `/forms` | Autofilled forms (`/forms?form=<id>` opens one directly) |

## Connecting the backend

All API calls live in `src/lib/api.ts`, and the response shapes are in `src/lib/types.ts`. Match the backend to those types (or change them there first).

Create `.env.local`:

```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Endpoints the frontend calls when mock mode is off:

| Method | Path | Returns |
| --- | --- | --- |
| POST | `/onboard` | `{ businessId }` (body: `BusinessProfile`) |
| GET | `/checklist` | `ChecklistItem[]` |
| GET | `/deadlines` | `Deadline[]` |
| GET | `/alerts` | `Alert[]` |
| POST | `/check-document` | `DocumentReport` (multipart field `file`) |
| GET | `/reports/:id` | `DocumentReport` |
| GET | `/forms` | `FillableForm[]` |
| POST | `/forms/:id/fill` | `FillableForm` (body: `BusinessProfile`) |

The backend needs CORS enabled for the frontend's origin.

## Before the demo

- Sample data is in `src/lib/mock.ts`. Verify every citation against the Georgia Code and GA Rules.
- The bills in `MOCK_ALERTS` are placeholders marked "(sample)"; replace them with real bills from the feed.
- The demo-mode banner disappears when `NEXT_PUBLIC_USE_MOCK=false`.
- Checklist progress, the profile and reports are stored in the browser (localStorage) for the demo.

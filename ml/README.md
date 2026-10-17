# BizBridge Document Classification API

A prototype FastAPI service for classifying **text-based PDFs** with the team's trained TF-IDF + Logistic Regression model.

> Classification is only a first-stage suggestion. A document is **not** verified, valid, or compliant merely because it is recognized. This model was trained on just three forms per class and tested on only one per class.

## Install and run (Windows PowerShell, from repository root)

```powershell
cd C:\Users\Simmi\HackATL
# Install Python 3.12 from python.org first if `py` and `python` are unavailable.
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ml\requirements.txt
python -m uvicorn ml.backend.main:app --reload --port 8000
```

From the repository root, the model should be at `ml/models/document_classifier.joblib` and `metadata.json` beside it. Do not load untrusted joblib files.

Open <http://localhost:8000/docs> and use **POST /api/classify-document** → **Try it out** to upload a PDF.

You can also test with PowerShell:

```powershell
curl.exe -F "file=@ml/data/raw/tax_document/st3_sales_tax_return.pdf" http://localhost:8000/api/classify-document
```

### Example JSON (illustrative)

```json
{"document_type":"tax_document","model_score":0.54,"score_calibrated":false,"pages":4,"characters_extracted":5400,"requires_review":true,"status":"needs_review","message":"Prototype classification only. Not a determination of permit validity or regulatory compliance."}
```

`model_score` is **not a calibrated probability**. Do not interpret it as a percent chance of correctness.

## Frontend interface

Send an HTTP multipart/form-data `POST` to `http://localhost:8000/api/classify-document`, with the selected PDF under the field name `file`. The response fields are shown above. If using the Next.js browser client, configure `NEXT_PUBLIC_BIZBRIDGE_API_URL=http://localhost:8000` in `frontend/.env.local`. This service permits `http://localhost:3000` CORS by default.

## Limitations / security

- Accepts PDF uploads up to 10 MB and 20 pages. It processes files in memory and does not save or log PDF contents.
- Extracts selectable PDF text using PyMuPDF. **Image-only scanned PDFs are rejected** until an OCR fallback is added. This is deliberate rather than silently producing incorrect predictions.
- Does **not** extract business names, check application completeness, retrieve legal requirements, file forms, or send reminders.
- No authentication or production rate limits. Keep the service on localhost for the hackathon demo; do not expose it publicly without authentication, security review and stronger validation.
- This model uses `scikit-learn==1.6.1`, matching the saved artifact metadata.

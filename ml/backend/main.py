"""BizBridge prototype document analysis API; PDFs are processed in memory only."""
import os
import re

from dotenv import load_dotenv
from pathlib import Path

# Preserve process settings, prefer this service's file, then fill missing values
# from the repository configuration used by the original Gemini setup.
load_dotenv(Path(__file__).resolve().parent / '.env', override=False)
load_dotenv(Path(__file__).resolve().parents[2] / '.env', override=False)
from functools import lru_cache
from datetime import datetime


import fitz
import joblib
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ml.backend.chat import router as chat_router
from ml.backend.voice import router as voice_router
from ml.backend.vision import image_text
from starlette.concurrency import run_in_threadpool

MODEL_PATH = Path(__file__).resolve().parents[1] / 'models' / 'document_classifier.joblib'
MAX_BYTES = 10 * 1024 * 1024
MAX_PAGES = 20
MAX_TEXT = 150_000

app = FastAPI(title='BizBridge Document AI', version='0.2.0')
origins = [
    o.strip()
    for o in os.getenv(
        "BIZBRIDGE_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://172.24.142.75:5173,http://localhost:3000"
    ).split(",")
    if o.strip()
]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=['GET','POST'], allow_headers=['Content-Type'])
# Register the BizBridge AI chatbot
app.include_router(chat_router)
app.include_router(voice_router)

@lru_cache(maxsize=1)
def get_model():
    if not MODEL_PATH.is_file():
        raise RuntimeError(f'Model not found: {MODEL_PATH}')
    # Deserialize ONLY a trusted model built by your team, never uploaded model files.
    return joblib.load(MODEL_PATH)


def pdf_text(data: bytes) -> tuple[str, int]:
    try:
        with fitz.open(stream=data, filetype='pdf') as pdf:
            if pdf.needs_pass:
                raise HTTPException(422, 'Password-protected PDFs are not supported.')
            if not 1 <= pdf.page_count <= MAX_PAGES:
                raise HTTPException(422, f'PDF must have 1–{MAX_PAGES} pages.')
            parts, n = [], 0
            for page in pdf:
                s = page.get_text('text', sort=True)
                parts.append(s[:max(0, MAX_TEXT-n)])
                n += len(s)
                if n >= MAX_TEXT:
                    break
            return '\n'.join(parts)[:MAX_TEXT], pdf.page_count
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, 'Cannot read PDF; ensure this is an unencrypted PDF.') from exc


def candidate_fields(text: str) -> dict:
    """Simple candidates for review, not authoritative or verified extracted facts."""
    lines = [' '.join(s.split()) for s in text.splitlines() if s.strip()]
    fields = {}
    # Only label-based patterns: safer than assuming an arbitrary header is the company name.
    patterns = {
        'business_name': r'(?i)^(?:legal\s+)?(?:business|company|entity)\s+name\s*[:\-]\s*(.{2,90})$',
        'business_address': r'(?i)^(?:business|mailing|physical)\s+address\s*[:\-]\s*(.{5,140})$',
        'document_number': r'(?i)^(?:permit|license|registration|certificate)\s*(?:number|no\.?|#)\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9\-/ ]{2,45})$',
        'expiration_date': r'(?i)^(?:expiration|expiry|expires|valid\s+until)\s*(?:date)?\s*[:\-]\s*(.{6,35})$',
        'issue_date': r'(?i)^(?:issue|issued|effective)\s+date\s*[:\-]\s*(.{6,35})$',
    }
    for field, pattern in patterns.items():
        for line in lines:
            match = re.match(pattern, line)
            if match:
                val = match.group(1).strip(' ._')
                if val and val.lower() not in {'n/a','none'}:
                    fields[field] = {'value': val, 'source_line': line, 'verified': False}
                break
    # dates detected independently to help humans inspect a document (not expiry inference).
    dates = re.findall(r'(?<!\d)(?:0?[1-9]|1[0-2])[/\-](?:0?[1-9]|[12]\d|3[01])[/\-](?:20\d{2}|\d{2})(?!\d)', text)
    fields['date_candidates'] = sorted(set(dates))[:20]
    return fields


@app.get('/health')
def health():
    return {'status': 'ok', 'model_file_present': MODEL_PATH.is_file()}


async def analyze(file: UploadFile):
    if not file.filename or Path(file.filename).suffix.lower() != '.pdf':
        raise HTTPException(415, 'Please upload a PDF.')
    try:
        data = await file.read(MAX_BYTES + 1)
    finally:
        await file.close()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, 'Maximum file size is 10 MB.')
    if not data.startswith(b'%PDF-'):
        raise HTTPException(415, 'The uploaded file is not a PDF.')
    text, pages = pdf_text(data)
    if len(text.strip()) < 30:
        raise HTTPException(422, 'This PDF has little selectable text. Attach a text-selectable PDF or a clear JPEG/PNG document photo for OCR.')
    return await run_in_threadpool(analyze_text, Path(file.filename).name, text, pages)


def analyze_text(filename: str, text: str, pages: int) -> dict:
    try:
        model = get_model()
        label = str(model.predict([text])[0])
        scores = model.predict_proba([text])[0] if hasattr(model, 'predict_proba') else None
        score = round(float(max(scores)), 4) if scores is not None else None
    except Exception as exc:
        raise HTTPException(500, 'Model inference failed. Verify the model file and scikit-learn==1.6.1.') from exc
    return {
        'filename': filename,
        'document_type': label,
        'model_score': score,
        'score_calibrated': False,
        'pages': pages,
        'characters_extracted': len(text),
        'extracted_fields': candidate_fields(text),
        'requires_review': True,
        'status': 'needs_review',
        'message': 'Draft classification and candidate fields only. Confirm all extracted information manually. This does not determine legal compliance or permit validity.',
    }

@app.post('/api/analyze-document')
async def analyze_document(file: UploadFile = File(...)):
    return await analyze(file)

@app.post('/api/classify-document')
async def classify_document(file: UploadFile = File(...)):
    # Existing frontend code remains compatible; this response adds extracted_fields.
    return await analyze(file)


@app.post('/api/analyze-image')
async def analyze_image(file: UploadFile = File(...)):
    try:
        if not file.filename or Path(file.filename).suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'}:
            raise HTTPException(415, 'Choose a JPEG, PNG, or WebP document photo.')
        if file.content_type not in {'image/jpeg', 'image/png', 'image/webp'}:
            raise HTTPException(415, 'Choose a JPEG, PNG, or WebP document photo.')
        data = await file.read(MAX_BYTES + 1)
    finally:
        await file.close()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, 'Maximum photo size is 10 MB.')
    text = await run_in_threadpool(image_text, data)
    result = await run_in_threadpool(analyze_text, Path(file.filename).name, text, 1)
    result['extraction_method'] = 'local_ocr'
    result['ocr_limitations'] = 'Best for clear printed Latin text (English/Spanish). Hindi-script photo OCR is not supported. Verify every extracted field.'
    return result

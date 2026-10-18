
"""ClearBridge translation backend.

Run from clearbridge-backend:
    uvicorn main:app --reload --port 8001
"""

import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, OpenAIError
from pydantic import BaseModel

# Load environment variables from this backend's own .env file.
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-mini")

DEFAULT_ORIGINS = (
    "http://localhost:4000,"
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:5174,"
    "http://127.0.0.1:5174"
)

CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

LANGUAGES = {
    "es": "Spanish",
    "hi": "Hindi",
    "vi": "Vietnamese",
    "ko": "Korean",
    "zh": "Simplified Chinese",
    "fr": "French",
    "pt": "Portuguese (Brazil)",
}

logger = logging.getLogger(__name__)

app = FastAPI(
    title="ClearBridge Translation API",
    version="1.0.0",
)

# Allow requests from explicitly configured frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "openai_key_set": bool(os.getenv("OPENAI_API_KEY")),
        "model": OPENAI_MODEL,
    }


class TranslateRequest(BaseModel):
    language: str
    texts: list[str]


class TranslateResponse(BaseModel):
    translations: list[str]


# Cache translations for the lifetime of this server process.
_cache: dict[tuple[str, str], str] = {}


def ask_openai(texts: list[str], language: str) -> list[str]:
    """Translate UI strings while preserving their order and count."""

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="Translation service is not configured.",
        )

    prompt = (
        f"Translate each string in this JSON array into {language} "
        "for a small-business web application. "
        "Keep the same order and count. "
        "Keep the brand name BizBridge, URLs, numbers, and "
        "abbreviations (LLC, EIN, ID) unchanged. "
        'Reply with JSON: {"translations": [...]}\n\n'
        + json.dumps(texts, ensure_ascii=False)
    )

    try:
        response = OpenAI().chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from translation model.")

        parsed = json.loads(content)
        out = parsed["translations"]

        if not isinstance(out, list):
            raise ValueError("Translations must be a list.")

    except OpenAIError:
        logger.exception("OpenAI translation request failed")
        raise HTTPException(
            status_code=502,
            detail="Translation provider request failed.",
        )

    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        logger.exception("Invalid translation response")
        raise HTTPException(
            status_code=502,
            detail="The translation response was invalid.",
        )

    if len(out) != len(texts):
        raise HTTPException(
            status_code=502,
            detail="The translation came back incomplete.",
        )

    return [str(value) for value in out]


@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):

    if req.language not in LANGUAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Translation to '{req.language}' is not supported.",
        )

    if len(req.texts) > 100:
        raise HTTPException(
            status_code=422,
            detail="Send at most 100 strings at a time.",
        )

    missing = list(
        dict.fromkeys(
            text
            for text in req.texts
            if text.strip() and (req.language, text) not in _cache
        )
    )

    if missing:
        translated_texts = ask_openai(
            missing,
            LANGUAGES[req.language],
        )

        for original, translated in zip(missing, translated_texts):
            _cache[(req.language, original)] = translated

    return TranslateResponse(
        translations=[
            _cache.get((req.language, text), text)
            for text in req.texts
        ]
    )

"""ClearBridge backend. Run with: uvicorn main:app --reload --port 8000

Right now it does one thing: translates page text for the Language setting.
Add new features as new routes below (see README).
"""

import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, OpenAIError
from pydantic import BaseModel

load_dotenv()

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-mini")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:4000,http://localhost:5173").split(",")

LANGUAGES = {
    "es": "Spanish",
    "vi": "Vietnamese",
    "ko": "Korean",
    "zh": "Simplified Chinese",
    "fr": "French",
    "pt": "Portuguese (Brazil)",
}

app = FastAPI(title="ClearBridge API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "openai_key_set": bool(os.getenv("OPENAI_API_KEY")), "model": OPENAI_MODEL}


# ---------- Translation ----------

class TranslateRequest(BaseModel):
    language: str     # e.g. "es"
    texts: list[str]  # the strings on the page


class TranslateResponse(BaseModel):
    translations: list[str]  # same order and count as texts


# Translations are remembered while the server runs, so repeated text is free.
_cache: dict[tuple[str, str], str] = {}


def ask_openai(texts: list[str], language: str) -> list[str]:
    """Translate a list of UI strings with one OpenAI call."""
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(502, "Translation needs OPENAI_API_KEY in backend/.env.")
    prompt = (
        f"Translate each string in this JSON array into {language} for a small-business web app. "
        "Keep the same order and count. Keep the brand name ClearBridge, URLs, numbers and "
        'abbreviations (LLC, EIN, ID) unchanged. Reply with JSON: {"translations": [...]}\n\n'
        + json.dumps(texts, ensure_ascii=False)
    )
    try:
        response = OpenAI().chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        out = json.loads(response.choices[0].message.content)["translations"]
    except OpenAIError as e:
        raise HTTPException(502, f"OpenAI returned an error: {e}") from e
    except (KeyError, TypeError, ValueError) as e:
        raise HTTPException(502, "The translation came back in the wrong format. Try again.") from e
    if len(out) != len(texts):
        raise HTTPException(502, "The translation came back incomplete. Try again.")
    return [str(t) for t in out]


@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    if req.language not in LANGUAGES:
        raise HTTPException(422, f"Translation to '{req.language}' isn't supported.")
    if len(req.texts) > 100:
        raise HTTPException(422, "Send at most 100 strings at a time.")

    missing = list(dict.fromkeys(t for t in req.texts if t.strip() and (req.language, t) not in _cache))
    if missing:
        for text, translated in zip(missing, ask_openai(missing, LANGUAGES[req.language])):
            _cache[(req.language, text)] = translated

    return TranslateResponse(translations=[_cache.get((req.language, t), t) for t in req.texts])

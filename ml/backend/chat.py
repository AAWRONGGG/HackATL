
"""BizBridge AI chatbot powered by Google Gemini."""

import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

router = APIRouter(tags=["AI Assistant"])

SOURCES = [
    {
        "title": "Georgia Secretary of State - Business Forms",
        "url": "https://sos.ga.gov/page/georgia-business-forms",
        "keywords": ["business", "llc", "register", "company"],
        "summary": "Official Georgia business registration and forms directory.",
    },
    {
        "title": "Georgia Department of Public Health - Food Service",
        "url": "https://dph.georgia.gov/environmental-health/food-service",
        "keywords": ["restaurant", "food", "cafe", "kitchen", "catering"],
        "summary": "Official Georgia food-service information portal.",
    },
    {
        "title": "Georgia Department of Revenue",
        "url": "https://dor.georgia.gov/",
        "keywords": ["tax", "sales", "exemption", "revenue"],
        "summary": "Official Georgia tax information portal.",
    },
    {
        "title": "City of Atlanta - Office of Revenue",
        "url": "https://www.atlantaga.gov/government/departments/finance/office-of-revenue",
        "keywords": ["atlanta", "license", "occupation", "city"],
        "summary": "Official Atlanta business licensing information portal.",
    },
]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict[str, str]]
    requires_review: bool = True


SYSTEM_PROMPT = """
You are BizBridge, a friendly multilingual assistant for
small-business owners, including older adults.

Explain business registration, licenses, permits, and taxes
in simple language.

Rules:
- Reply in the language used by the user.
- Keep answers concise and explain steps clearly.
- Ask for the business type and location when needed.
- Use only supplied source summaries for regulatory claims.
- Source summaries are starting points, not verified
  evidence of specific legal requirements.
- Do not invent laws, fees, deadlines, or required documents.
- If a requirement is not confirmed, say it must be verified.
- Never claim you checked a website in real time.
- Never claim a business is legally compliant.
- Explain that business registration is different from
  obtaining permission to operate.
- Do not claim access to uploaded documents.
- Do not ask for passwords, SSNs, or payment details.
- Refer users to official government sources.
"""


def find_sources(message: str):
    question = message.lower()

    matches = [
        source for source in SOURCES
        if any(
            keyword in question
            for keyword in source["keywords"]
        )
    ]

    return matches[:4] if matches else SOURCES[:1]


@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured."
        )

    sources = find_sources(request.message)

    context = "\n\n".join(
        f"Source: {source['title']}\n"
        f"URL: {source['url']}\n"
        f"Description: {source['summary']}"
        for source in sources
    )

    try:
        async with genai.Client(api_key=api_key).aio as client:
            response = await client.models.generate_content(
                model=os.getenv(
                    "BIZBRIDGE_GEMINI_MODEL",
                    "gemini-3.8-flash"
                ),
                contents=(
                    f"Reference information:\n{context}\n\n"
                    f"User question:\n{request.message}"
                ),
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.2,
                    max_output_tokens=2048,
                ),
            )

        answer = (response.text or "").strip()

        if not answer:
            raise RuntimeError("Gemini returned an empty answer.")

        return ChatResponse(
            answer=answer,
            sources=[
                {
                    "title": source["title"],
                    "url": source["url"],
                }
                for source in sources
            ],
            requires_review=True,
        )

    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail="Gemini request failed. Check backend terminal."
        ) from exc
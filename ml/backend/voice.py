"""Consent-gated ElevenLabs proxies. Recordings stay in memory, never on disk."""
from io import BytesIO
from pathlib import Path
from typing import Literal
import os
import re
import subprocess
import wave

import httpx
import imageio_ffmpeg
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix='/api/voice', tags=['Voice'])
MAX_AUDIO = 12 * 1024 * 1024
MAX_SECONDS = 60
LANGUAGES = {'en', 'hi', 'es'}


def audio_wav(data: bytes, filename: str) -> tuple[bytes, float]:
    suffix = Path(filename).suffix.lower()
    signatures = {
        '.webm': data.startswith(b'\x1aE\xdf\xa3'),
        '.ogg': data.startswith(b'OggS'),
        '.wav': data.startswith(b'RIFF') and data[8:12] == b'WAVE',
        '.mp4': data[4:8] == b'ftyp',
        '.m4a': data[4:8] == b'ftyp',
        '.mp3': data.startswith(b'ID3') or (len(data) > 1 and data[0] == 255 and data[1] & 224 == 224),
    }
    if not signatures.get(suffix):
        raise HTTPException(415, 'Choose a valid WebM, Ogg, WAV, MP4/M4A, or MP3 recording.')
    try:
        process = subprocess.run(
            [imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error',
             '-protocol_whitelist', 'pipe', '-i', 'pipe:0', '-vn', '-t', '61',
             '-ac', '1', '-ar', '16000', '-f', 's16le', 'pipe:1'],
            input=data, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            timeout=20, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
        )
    except (OSError, RuntimeError, subprocess.TimeoutExpired) as exc:
        raise HTTPException(422, 'Cannot decode this recording. Try recording again.') from exc
    pcm = process.stdout
    duration = len(pcm) / 32000
    if process.returncode or duration < 0.1:
        raise HTTPException(422, 'This recording is empty or unreadable. Record at least a moment of speech.')
    if duration > MAX_SECONDS:
        raise HTTPException(413, 'Recordings must be 60 seconds or shorter.')
    output = BytesIO()
    with wave.open(output, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        wav.writeframes(pcm)
    return output.getvalue(), round(duration, 2)


async def provider_request(path: str, **kwargs) -> httpx.Response:
    # Read credentials only inside the backend; never return or log them.
    key = os.getenv('ELEVENLABS_API_KEY')
    if not key:
        raise HTTPException(503, 'Voice is not configured. Set ELEVENLABS_API_KEY on the document backend and restart it.')
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post('https://api.elevenlabs.io/v1/' + path,
                                         headers={'xi-api-key': key}, **kwargs)
    except httpx.RequestError as exc:
        raise HTTPException(502, 'The voice service could not be reached. Please try again.') from exc
    if response.status_code in {401, 403}:
        raise HTTPException(503, 'Voice credentials or permissions need attention on the backend.')
    if response.status_code == 429:
        raise HTTPException(429, 'Voice usage is temporarily limited. Please try again later.')
    if not response.is_success:
        raise HTTPException(502, 'The voice service could not process this request. Please try again.')
    return response


@router.post('/transcribe')
async def transcribe(file: UploadFile = File(...), consent: bool = Form(False), language: str = Form('en')):
    try:
        if not consent:
            raise HTTPException(422, 'Please allow sending this recording to ElevenLabs before transcribing.')
        if language not in LANGUAGES:
            raise HTTPException(422, 'Voice supports English, Hindi, and Spanish.')
        if file.content_type not in {'audio/webm', 'video/webm', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'video/mp4', 'audio/mpeg'}:
            raise HTTPException(415, 'Unsupported recording format.')
        data = await file.read(MAX_AUDIO + 1)
    finally:
        await file.close()
    if len(data) > MAX_AUDIO:
        raise HTTPException(413, 'Recordings must be smaller than 12 MB.')
    wav, duration = await run_in_threadpool(audio_wav, data, file.filename or '')
    response = await provider_request('speech-to-text', files={'file': ('recording.wav', wav, 'audio/wav')},
                                      data={'model_id': 'scribe_v2', 'language_code': language, 'tag_audio_events': 'false'})
    try:
        text = response.json()['text']
        if not isinstance(text, str) or not text.strip():
            raise ValueError('No transcript')
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(502, 'No speech was recognized. Try a clearer recording.') from exc
    return {'text': text.strip(), 'duration_seconds': duration, 'language': language}


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    consent: bool = False
    language: Literal['en', 'hi', 'es'] = 'en'


@router.post('/speak')
async def speak(request: SpeechRequest):
    if not request.consent:
        raise HTTPException(422, 'Please allow sending this answer to ElevenLabs before playback.')
    voice = os.getenv('ELEVENLABS_VOICE_ID', '')
    if not voice or not re.fullmatch(r'[A-Za-z0-9_-]{1,80}', voice):
        raise HTTPException(503, 'Playback is not configured. Set ELEVENLABS_VOICE_ID on the document backend and restart it.')
    response = await provider_request('text-to-speech/' + voice,
                                      params={'output_format': 'mp3_44100_128'},
                                      json={'text': request.text, 'model_id': 'eleven_multilingual_v2'})
    if not response.headers.get('content-type', '').startswith('audio/') or not response.content or len(response.content) > 12 * 1024 * 1024:
        raise HTTPException(502, 'The voice service returned unusable audio.')
    return Response(response.content, media_type='audio/mpeg', headers={'Cache-Control': 'no-store'})

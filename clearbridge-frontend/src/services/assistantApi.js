import { AI_API_URL } from './documentReviewApi.js';

export async function assistantRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${AI_API_URL}${path}`, {
      ...options, signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(60_000)])
        : AbortSignal.timeout(60_000),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(error.name === 'TimeoutError'
      ? 'This is taking longer than expected. Please try again.'
      : 'Cannot connect to the assistant. Check your connection and try again.');
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(typeof data?.detail === 'string' ? data.detail : `The assistant could not complete this request (${response.status}). Please try again.`);
  }
  return response;
}

export async function transcribeRecording(blob, language, signal) {
  const extension = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
  const body = new FormData();
  body.append('file', blob, `recording.${extension}`);
  body.append('consent', 'true');
  body.append('language', language);
  const response = await assistantRequest('/api/voice/transcribe', { method: 'POST', body, signal });
  const data = await response.json();
  if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('No speech was recognized. Try recording again.');
  return data.text;
}

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';
import { assistantRequest } from '../services/assistantApi.js';

export default function AnswerAudio({ text, language }) {
  const audioRef = useRef(null);
  const controller = useRef(null);
  const urlRef = useRef('');
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => () => {
    controller.current?.abort();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  async function play() {
    if (!consent || loading) return;
    setError('');
    if (playing) { audioRef.current?.pause(); return; }
    if (!audioUrl) {
      setLoading(true);
      const request = new AbortController();
      controller.current = request;
      try {
        const response = await assistantRequest('/api/voice/speak', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, consent: true, language }), signal: request.signal,
        });
        const blob = await response.blob();
        if (!blob.type.startsWith('audio/')) throw new Error('The voice service returned unusable audio.');
        if (request.signal.aborted) return;
        urlRef.current = URL.createObjectURL(blob);
        setAudioUrl(urlRef.current);
        audioRef.current.src = urlRef.current;
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
        return;
      } finally { if (!request.signal.aborted) setLoading(false); }
    }
    try { await audioRef.current?.play(); }
    catch { setError('Audio is ready. Press Play again to listen.'); }
  }

  function revokeConsent(checked) {
    setConsent(checked);
    if (!checked) {
      controller.current?.abort();
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = '';
      setAudioUrl('');
      setLoading(false);
    }
  }

  return <div className="answer-audio">
    <button type="button" aria-expanded={open} onClick={() => { if (open) { controller.current?.abort(); setLoading(false); } setOpen(value => !value); audioRef.current?.pause(); }}><Volume2 size={16} aria-hidden="true" /> Listen</button>
    {open && <div className="answer-audio-options">
      <label className="assistant-consent"><input type="checkbox" checked={consent} onChange={e => revokeConsent(e.target.checked)} /> Allow this answer to be sent to ElevenLabs for playback.</label>
      <button type="button" onClick={play} disabled={!consent || loading || text.length > 5000}>
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {loading ? 'Preparing audio…' : playing ? 'Pause answer' : 'Play answer'}
      </button>
      {text.length > 5000 && <p>Playback supports answers up to 5,000 characters.</p>}
      <span className="assistant-sr-only" role="status">{loading ? 'Preparing speech' : playing ? 'Playing answer' : ''}</span>
    </div>}
    <audio ref={audioRef} src={audioUrl || undefined} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    {error && <p role="alert" className="assistant-error">{error}</p>}
  </div>;
}

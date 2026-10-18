import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, X } from 'lucide-react';
import { transcribeRecording } from '../services/assistantApi.js';

export default function VoiceRecorder({ disabled, language, onTranscript, onBusyChange }) {
  const session = useRef(null);
  const pending = useRef(null);
  const generation = useRef(0);
  const [mode, setMode] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const micRef = useRef(null);
  const stopRef = useRef(null);
  const restoreFocus = useRef(false);
  useEffect(() => { onBusyChange?.(mode !== 'idle'); }, [mode, onBusyChange]);
  useEffect(() => {
    if (mode === 'recording') stopRef.current?.focus({ preventScroll: true });
    if (mode === 'idle' && restoreFocus.current) { restoreFocus.current = false; micRef.current?.focus({ preventScroll: true }); }
  }, [mode]);

  function release(recording) {
    if (!recording) return;
    clearInterval(recording.clock);
    clearInterval(recording.monitor);
    clearTimeout(recording.limit);
    recording.stream.getTracks().forEach(track => track.stop());
    recording.context?.close().catch(() => {});
  }
  function discard() {
    const current = session.current;
    if (current) {
      current.cancelled = true;
      if (current.recorder.state !== 'inactive') current.recorder.stop();
      release(current);
    }
    session.current = null;
  }
  useEffect(() => () => {
    generation.current += 1;
    pending.current?.abort();
    discard();
  }, []);

  function cancel() {
    restoreFocus.current = true;
    generation.current += 1;
    pending.current?.abort();
    discard();
    setMode('idle');
    setError('');
  }
  async function transcribe(blob, token, recordingLanguage) {
    const controller = new AbortController();
    pending.current = controller;
    setMode('transcribing');
    try {
      const text = await transcribeRecording(blob, recordingLanguage, controller.signal);
      if (token !== generation.current) return;
      onTranscript(text);
      setMode('idle');
    } catch (err) {
      if (token !== generation.current || err.name === 'AbortError') return;
      setError(err.message);
      setMode('idle');
    }
  }
  async function start() {
    setError('');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('Microphone recording needs HTTPS or localhost. You can still type a question.');
      return;
    }
    if (!window.MediaRecorder) { setError('This browser cannot record audio. Please type your question.'); return; }
    const token = ++generation.current;
    setMode('requesting');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (token !== generation.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('No supported recording format');
      const recorder = new MediaRecorder(stream, { mimeType });
      const current = { stream, recorder, chunks: [], cancelled: false };
      session.current = current;
      setSeconds(0);
      recorder.ondataavailable = event => { if (event.data.size) current.chunks.push(event.data); };
      recorder.onstop = () => {
        release(current);
        if (current.cancelled || token !== generation.current) return;
        session.current = null;
        const blob = new Blob(current.chunks, { type: mimeType.split(';')[0] });
        if (!blob.size) { setError('No audio was captured. Please try again.'); setMode('idle'); return; }
        // Clicking Mic explicitly starts the disclosed ElevenLabs transcription flow.
        transcribe(blob, token, language);
      };
      recorder.onerror = () => {
        current.cancelled = true;
        release(current);
        if (token !== generation.current) return;
        session.current = null;
        setError('Recording was interrupted. Please try again.');
        setMode('idle');
      };
      current.clock = setInterval(() => setSeconds(value => value + 1), 1000);
      current.limit = setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 59_000);
      recorder.start(250);
      setMode('recording');
      // Detect the end of speech locally; no audio leaves the device until recording ends.
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          current.context = new AudioContext();
          await current.context.resume();
          if (current.cancelled || token !== generation.current) return;
          const analyser = current.context.createAnalyser();
          analyser.fftSize = 2048;
          current.context.createMediaStreamSource(stream).connect(analyser);
          const samples = new Float32Array(analyser.fftSize);
          const started = Date.now();
          let lastSpeech = started;
          let heardSpeech = false;
          current.monitor = setInterval(() => {
            if (recorder.state !== 'recording') return;
            analyser.getFloatTimeDomainData(samples);
            const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
            const now = Date.now();
            if (rms > 0.012) { heardSpeech = true; lastSpeech = now; }
            if (heardSpeech && now - lastSpeech > 1600) recorder.stop();
            else if (!heardSpeech && now - started > 8000) {
              discard(); setMode('idle'); setError('No speech heard. Tap the microphone and try speaking again.');
            }
          }, 150);
        }
      } catch { /* Done remains available when automatic silence detection is unavailable. */ }
    } catch (err) {
      stream?.getTracks().forEach(track => track.stop());
      if (token !== generation.current) return;
      setMode('idle');
      setError(err.name === 'NotAllowedError'
        ? 'Microphone permission was declined. Allow it in your browser or type your question.'
        : 'No usable microphone was found. Check your device or type your question.');
    }
  }

  return <div className="voice-recorder">
    {mode === 'idle' && <button ref={micRef} type="button" className="assistant-icon-button" aria-label="Record a spoken question" aria-describedby="assistant-voice-privacy" title="Speak a question with ElevenLabs" disabled={disabled} onClick={start}>
      <Mic size={20} aria-hidden="true" />
    </button>}
    {mode !== 'idle' && <div className="voice-inline-controls" role="group" aria-label="Voice controls">
      <span className="voice-inline-status" aria-hidden="true">{mode === 'recording' ? `Listening ${seconds}s` : mode === 'transcribing' ? 'Transcribing...' : 'Connecting...'}</span>
      <span className="assistant-sr-only" role="status">{mode === 'requesting' ? 'Waiting for microphone permission...' : mode === 'recording' ? 'Listening. Pause when finished.' : 'Turning your speech into text...'}</span>
      {mode === 'recording' && <button ref={stopRef} type="button" className="assistant-icon-button" aria-label="Finish voice recording" title="Finish recording" onClick={() => { if (session.current?.recorder.state === 'recording') session.current.recorder.stop(); }}><Square size={18} aria-hidden="true" /></button>}
      <button type="button" className="assistant-icon-button" aria-label="Cancel voice input" title="Cancel voice input" onClick={cancel}><X size={18} aria-hidden="true" /></button>
    </div>}
    {error && <p className="voice-inline-error assistant-error" role="alert">{error}</p>}
  </div>;
}

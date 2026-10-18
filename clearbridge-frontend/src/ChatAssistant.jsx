import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Plus, Camera, MessageCircle, X, Paperclip } from 'lucide-react';
import VoiceRecorder from './components/VoiceRecorder.jsx';
import AnswerAudio from './components/AnswerAudio.jsx';
import { assistantRequest } from './services/assistantApi.js';
import { useAccessibility } from './accessibility/AccessibilityContext.jsx';

function safeSourceUrl(url) {
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null; }
  catch { return null; }
}

export default function ChatAssistant({ documentContext = '', onAttach, attachment, onClearAttachment, analyzing, attachmentContent, attachmentError, inputRef: suppliedInputRef }) {
  const { settings } = useAccessibility();
  const messageId = useRef(0);
  const questionRef = useRef('');
  const localInputRef = useRef(null);
  const inputRef = suppliedInputRef || localInputRef;
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const activeRequest = useRef(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState('en');
  useEffect(() => { setVoiceLanguage(['en', 'hi', 'es'].includes(settings.language) ? settings.language : 'en'); }, [settings.language]);
  useEffect(() => () => activeRequest.current?.abort(), []);

  function updateQuestion(text) { questionRef.current = text; setQuestion(text); }
  function receiveTranscript(text) {
    const combined = [questionRef.current.trim(), text.trim()].filter(Boolean).join('\n');
    if (combined.length > 2000) throw new Error('The transcript and draft are longer than 2,000 characters. Shorten your draft or record a shorter question.');
    updateQuestion(combined);
    setNotice('Transcript added. Review or edit it, then press Send.');
    inputRef.current?.focus();
  }
  async function ask(event) {
    event.preventDefault();
    const text = questionRef.current.trim();
    if (!text || loading || analyzing || voiceBusy) return;
    const id = ++messageId.current;
    const controller = new AbortController();
    activeRequest.current = controller;
    updateQuestion(''); setNotice(''); setLoading(true);
    setMessages(previous => [...previous, { id, q: text, a: '', sources: [], pending: true }]);
    try {
      const response = await assistantRequest('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, document_context: documentContext, document_consent: Boolean(documentContext), language: settings.language }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('The assistant returned no answer. Please try again.');
      const sources = (Array.isArray(data.sources) ? data.sources : []).map(source => ({ title: typeof source?.title === 'string' ? source.title : 'Official source', url: safeSourceUrl(source?.url) })).filter(source => source.url);
      if (controller.signal.aborted) return;
      setMessages(previous => previous.map(message => message.id === id ? { ...message, a: data.answer, sources, pending: false } : message));
    } catch (error) {
      if (error.name === 'AbortError') return;
      setMessages(previous => previous.map(message => message.id === id ? { ...message, a: error.message, pending: false, error: true } : message));
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }
  function pickFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onAttach(file);
  }

  return <section className="panel assistant-chat" aria-label="Business assistant">
    {!messages.length && <div className="assistant-empty">
      <MessageCircle size={28} aria-hidden="true" />
      <h2>How can we help your business?</h2>
      <p>Ask a question, attach a document, or record your voice.</p>
    </div>}
    <div className="assistant-messages" aria-label="Conversation">
      {messages.map(message => <article key={message.id} className="assistant-exchange">
        <div className="assistant-question" data-no-translate>{message.q}</div>
        <div className={`assistant-answer${message.error ? ' assistant-error' : ''}`} role={message.error ? 'alert' : undefined}>
          {message.pending ? <p role="status">Thinking?</p> : <>
            <p data-no-translate>{message.a}</p>
            {message.error ? <button type="button" onClick={() => { updateQuestion(message.q); inputRef.current?.focus(); }}>Edit and retry</button> : <>
              {message.sources.length > 0 && <div className="assistant-sources"><strong>Sources</strong>{message.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>)}</div>}
              <AnswerAudio text={message.a} language={voiceLanguage} />
            </>}
          </>}
        </div>
      </article>)}
    </div>
    {attachment && <div className="assistant-attachment">
      <Paperclip size={17} aria-hidden="true" /><span data-no-translate>{attachment.name}</span>
      <button type="button" className="assistant-icon-button" aria-label="Remove document attachment" disabled={analyzing || loading} onClick={onClearAttachment}><X size={17} aria-hidden="true" /></button>
    </div>}
    <p role="status" className={analyzing ? '' : 'assistant-sr-only'}>{analyzing ? 'Reading your document?' : attachmentContent ? 'Document ready for review.' : ''}</p>
    {attachmentError && <p className="assistant-error" role="alert">{attachmentError}</p>}
    {attachmentContent}
    <form className="assistant-composer" onSubmit={ask} aria-busy={loading || analyzing}>
      <label className="assistant-sr-only" htmlFor="assistant-question">Ask BizBridge a question</label>
      <textarea id="assistant-question" ref={inputRef} value={question} maxLength={2000} rows={3}
        onChange={e => updateQuestion(e.target.value)} placeholder="Ask about your business?"
        onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }}
        aria-describedby="assistant-privacy assistant-compose-status" />
      <div className="assistant-toolbar">
        <button type="button" className="assistant-icon-button" aria-label="Attach a PDF or document photo" title="Attach PDF or photo" disabled={loading || analyzing} onClick={() => fileRef.current?.click()}><Plus size={22} aria-hidden="true" /></button>
        <button type="button" className="assistant-icon-button" aria-label="Take a document photo" title="Take a document photo" disabled={loading || analyzing} onClick={() => cameraRef.current?.click()}><Camera size={20} aria-hidden="true" /></button>
        <label className="assistant-voice-language"><span className="assistant-sr-only">Voice language</span><select aria-label="Voice language" value={voiceLanguage} onChange={e => setVoiceLanguage(e.target.value)} data-no-translate><option value="en">English</option><option value="hi">हिन्दी</option><option value="es">Español</option></select></label>
        <div className="assistant-compose-actions">
          <VoiceRecorder disabled={loading || analyzing} language={voiceLanguage} onTranscript={receiveTranscript} onBusyChange={setVoiceBusy} />
        <button type="submit" className="assistant-send" disabled={!question.trim() || loading || analyzing || voiceBusy} aria-label={loading ? 'Sending question' : 'Send question'}>{loading ? 'Sending?' : 'Send'}<ArrowUp size={18} aria-hidden="true" /></button>
        </div>
      </div>
      <input ref={fileRef} id="workspace-file" className="assistant-sr-only" tabIndex={-1} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={loading || analyzing} onChange={pickFile} aria-label="Choose a PDF or document photo" />
      <input ref={cameraRef} className="assistant-sr-only" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={loading || analyzing} onChange={pickFile} aria-label="Capture a document photo" />
    </form>
    <p id="assistant-privacy" className="assistant-privacy">No sensitive IDs. PDFs: up to 10 MB / 20 pages. Photos: JPEG, PNG or WebP up to 10 MB. Photo OCR supports printed English/Spanish, not Hindi script. Share details only if you choose.</p>
    <p id="assistant-voice-privacy" className="assistant-sr-only">Mic uses ElevenLabs to turn your speech into text. Review it before pressing Send.</p>
    <p id="assistant-compose-status" className="assistant-sr-only" role="status">{notice}</p>
  </section>;
}

import React, { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import PageHeader from './components/PageHeader.jsx';
import ChatAssistant from './ChatAssistant.jsx';
import { reviewDocument } from './services/documentReviewApi.js';
import './AIWorkspace.css';

const FIELD_LABELS = { business_name: 'Business name', business_address: 'Business address', document_number: 'Document number', expiration_date: 'Expiration date', issue_date: 'Issue date', date_candidates: 'Other dates detected' };

export default function AIWorkspace(headerControls) {
  const requestId = useRef(0);
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareWithChat, setShareWithChat] = useState(false);

  function clearAttachment() { if (fileInputRef.current) fileInputRef.current.value = ''; requestId.current += 1; setFile(null); setResult(null); setFields({}); setShareWithChat(false); setError(''); }
  async function analyzeFile(selected) {
    const id = ++requestId.current;
    setFile(selected); setResult(null); setFields({}); setShareWithChat(false); setError(''); setLoading(true);
    try {
      const data = await reviewDocument(selected);
      if (id !== requestId.current) return;
      setResult(data);
      setFields(Object.fromEntries(Object.keys(FIELD_LABELS).map(name => {
        const field = data.extracted_fields[name];
        return [name, Array.isArray(field) ? field.join(', ') : field?.value || ''];
      })));
    } catch (err) { if (id === requestId.current) setError(err.message); }
    finally { if (id === requestId.current) setLoading(false); }
  }
  const chatContext = result && shareWithChat ? JSON.stringify({
    predicted_type: result.document_type, status: 'unverified_user_reviewed_candidates',
    fields: Object.fromEntries(Object.entries(fields).filter(([, value]) => value.trim())),
  }) : '';

  const details = result && <section key="results" className="panel document-details document-review-results" aria-labelledby="document-details-title">
    <div className="document-details-heading"><h2 id="document-details-title">Document review results</h2><span>{result.document_type.replaceAll('_', ' ')} / {result.pages} {result.pages === 1 ? 'page' : 'pages'}</span></div>
    <p className="assistant-privacy">Review and correct the detected information before sharing.</p>
    <div className="document-field-grid">
      {Object.entries(FIELD_LABELS).map(([name, label]) => <label key={name} htmlFor={`document-${name}`}>{label}<input id={`document-${name}`} value={fields[name] || ''} maxLength={name === 'date_candidates' ? 500 : 160} placeholder="Not detected" data-no-translate onChange={event => setFields(previous => ({ ...previous, [name]: event.target.value }))} /></label>)}
    </div>
    <p className="assistant-verification">AI-generated results require verification.</p>
    <details className="document-method"><summary>Analysis details</summary>
      {result.model_score != null && <p>Classification score: {(result.model_score * 100).toFixed(1)}% (not calibrated confidence)</p>}
      <p>Review status: {result.status.replaceAll('_', ' ')}</p>
      <p>{result.message}</p>{result.ocr_limitations && <p>{result.ocr_limitations}</p>}
    </details>
    <label className="assistant-consent"><input type="checkbox" checked={shareWithChat} onChange={event => {
      const checked = event.target.checked;
      setShareWithChat(checked);
      if (checked) chatInputRef.current?.focus();
    }} /> Include these reviewed details with my questions to Gemini.</label>
  </section>;

  return <div className="ai-workspace">
    <PageHeader {...headerControls} title="Your AI Business Workspace" description="Review your business documents and ask questions about paperwork, requirements, and next steps." />
    <div className={`document-review-layout${result ? ' has-results' : ''}`}>
    {details}
    <section key="upload" className="panel document-review-upload" aria-labelledby="document-review-title" aria-busy={loading}>
      <h2 id="document-review-title">Document review</h2>
      <label className="document-review-file-label" htmlFor="review-document-file"><FileUp size={20} aria-hidden="true" /> Choose a business document</label>
      <input ref={fileInputRef} id="review-document-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={loading} onChange={event => {
        const selected = event.target.files?.[0] || null;
        requestId.current += 1; setFile(selected); setResult(null); setFields({}); setShareWithChat(false); setError('');
      }} />
      {file && <p className="document-review-selected">Selected: <span data-no-translate>{file.name}</span></p>}
      <div className="document-review-actions">
        <button type="button" className="document-review-submit" disabled={!file || loading} onClick={() => analyzeFile(file)}>{loading ? 'Analyzing document...' : 'Review Document'}</button>
        {file && <button type="button" disabled={loading} onClick={clearAttachment}>Clear document</button>}
      </div>
      <p className="assistant-sr-only" role="status">{loading ? 'Reading your document...' : result ? 'Document review results are ready.' : ''}</p>
      {error && <p className="assistant-error" role="alert">{error}</p>}
    </section>
    </div>
    <section className="document-chat-section" aria-labelledby="document-chat-title">
      <h2 id="document-chat-title">Ask your assistant</h2>
      <p className="intro">Ask about business registration, paperwork, regulations, and next steps.</p>
      <ChatAssistant inputRef={chatInputRef} documentContext={chatContext} onAttach={analyzeFile} onClearAttachment={clearAttachment} analyzing={loading} />
    </section>
  </div>;
}

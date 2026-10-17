import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Download, ExternalLink,
  FileCheck2, FileClock, Info, MapPin, RotateCcw, ShieldAlert, ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { INDUSTRIES } from './data/atlantaRequirements.js';
import {
  clearDocumentAnalyses, defaultProfile, exportRequirementsPayload, getDocumentAnalyses,
  getRequirements, matchDocumentToRequirements, normalizedProfile, RULESET_VERSION,
  REQUIREMENTS_STORAGE_KEY as STORAGE_KEY,
} from './services/requirementsEngine.js';
import './Requirements.css';
import {
  getRequirementProgress,
  setRequirementCompleted
} from "./services/requirementProgress";
const STATUS_TEXT = {
  not_submitted: 'No document yet',
  document_received: 'Document received — review needed',
  needs_review: 'Evidence needs review',
  evidence_reviewed: 'Evidence reviewed (not compliance verified)',
};
const CLASS_TEXT = { required: 'Required', conditional: 'Conditional', review: 'Needs review' };
const CATEGORIES = [
  'Atlanta local', 'Atlanta application evidence', 'Business formation',
  'Ongoing registrations', 'Tax', 'Employment and tax', 'Insurance',
  'Industry permit', 'Regulated activities', 'Scope verification',
];

function getSaved() {
  try {
    const data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (data?.rulesetVersion === RULESET_VERSION && data.profile) return data;
  } catch { /* Missing, malformed, or blocked storage: start fresh. */ }
  return null;
}

function downloadJSON(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'clearbridge-atlanta-requirements.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Requirements() {
  const [initial] = useState(getSaved);
  const [profile, setProfile] = useState(() => normalizedProfile(initial?.profile || defaultProfile));
  const [generated, setGenerated] = useState(Boolean(initial?.generated));
  const [evidence, setEvidence] = useState(() => initial?.evidence || {});
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [progress, setProgress] = useState(getRequirementProgress);

  const result = useMemo(
    () => generated ? getRequirements(profile) : null,
    [generated, profile]
  );
  const requirements = result?.requirements || [];

  useEffect(() => {
    try {
      // Demo persistence only. Do not put ID images or sensitive extracted fields here.
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        rulesetVersion: RULESET_VERSION, profile, generated, evidence,
      }));
    } catch { /* Storage is optional for the hackathon demo. */ }
  }, [profile, generated, evidence]);

  useEffect(() => {
    function onAnalyzed(event) {
      const analysis = event?.detail;
      if (!analysis || !generated || !result || result.errors.length) return;
      const matches = matchDocumentToRequirements(requirements, analysis);
      if (!matches.length) {
        setAiMessage('Document received, but no expected evidence type matched. Review its classification with the document team.');
        return;
      }
      setEvidence((previous) => {
        const updated = { ...previous };
        for (const id of matches) {
          const oldDocs = Array.isArray(previous[id]?.documents) ? previous[id].documents : [];
          const reference = {
            documentId: String(analysis.documentId || 'unspecified'),
            documentType: String(analysis.documentType),
          };
          const exists = oldDocs.some((doc) =>
            doc.documentId === reference.documentId && doc.documentType === reference.documentType
          );
          updated[id] = {
            // Don't downgrade human-reviewed evidence on repeated route navigation.
            status: exists ? (previous[id]?.status || 'document_received') : 'document_received',
            documents: exists ? oldDocs : [...oldDocs, reference],
          };
        }
        return updated;
      });
      setAiMessage(`AI matched a document type to ${matches.length} checklist item(s). A human still needs to review the evidence.`);
    }
    window.addEventListener('clearbridge:document-analyzed', onAnalyzed);
    // Reconcile classifications recorded while the Documents tab was visible.
    for (const prior of getDocumentAnalyses()) onAnalyzed({ detail: prior });
    return () => window.removeEventListener('clearbridge:document-analyzed', onAnalyzed);
  }, [generated, result, requirements]);

  const counts = requirements.reduce((a, item) => {
    a[item.classification] += 1;
    if (evidence[item.id]?.status === 'evidence_reviewed') a.reviewed += 1;
    return a;
  }, { required: 0, conditional: 0, review: 0, reviewed: 0 });

  const visible = requirements.filter((item) =>
    filter === 'all' || item.classification === filter
  );
  const grouped = CATEGORIES.map((category) => ({
    category, items: visible.filter((item) => item.category === category),
  })).filter((group) => group.items.length);

  function update(field, value) {
    setProfile((previous) => ({ ...previous, [field]: value }));
    // Regeneration required whenever the profile changes. Never carry old evidence over.
    setGenerated(false);
    setEvidence({});
    clearDocumentAnalyses();
    setNotice('');
    setAiMessage('');
  }

  function generate(event) {
    event.preventDefault();
    if (!profile.withinAtlanta) {
      setNotice('Confirm that your business operates inside Atlanta CITY limits before generating this checklist.');
      return;
    }
    setGenerated(true);
    setEvidence({});
    setFilter('all');
    setNotice('Checklist generated from the Atlanta source-backed ruleset. Review conditional and unknown requirements.');
  }

  function setReview(id, status) {
    setEvidence((old) => ({
      ...old,
      [id]: { status, documents: old[id]?.documents || [] },
    }));
  }

  function exportJSON() {
    if (!result) return;
    downloadJSON(exportRequirementsPayload(result, evidence));
  }

  return (
    <div className="cb-req">
      <div className="cb-req-head">
        <div>
          <div className="cb-req-eyebrow"><MapPin size={15} /> ATLANTA, GEORGIA</div>
          <h1>Business requirements</h1>
          <p>Build a personalized, source-linked checklist for your business, then match documents against the expected evidence.</p>
        </div>
        <span className="cb-req-version">Ruleset {RULESET_VERSION}</span>
      </div>

      <div className="cb-req-alert"><ShieldAlert size={19} />
        <span>Supported jurisdiction: <strong>inside Atlanta city limits only.</strong> This is not an exhaustive legal determination. Conditional and unclear items need agency or professional confirmation. Never upload sensitive IDs into this demo.</span>
      </div>

      <form className="cb-req-form" onSubmit={generate}>
        <div className="cb-req-form-title"><ClipboardCheck size={20} /><h2>Tell us about your business</h2></div>
        <div className="cb-req-grid">
          <label className="cb-req-field">Business name (optional)
            <input value={profile.businessName} placeholder="e.g. Peachtree Coffee" maxLength={120}
              onChange={(e) => update('businessName', e.target.value)} />
          </label>
          <label className="cb-req-field">Industry
            <select value={profile.industry} onChange={(e) => update('industry', e.target.value)}>
              {INDUSTRIES.map((industry) => <option key={industry.value} value={industry.value}>{industry.label}</option>)}
            </select>
          </label>
          <label className="cb-req-field">Legal structure
            <select value={profile.structure} onChange={(e) => update('structure', e.target.value)}>
              <option value="llc">Limited Liability Company (LLC)</option>
              <option value="corporation">Corporation</option>
              <option value="sole">Sole Proprietorship</option>
            </select>
          </label>
          {profile.structure !== 'sole' && (
            <label className="cb-req-field">Where was the entity formed?
              <select value={profile.formedInGeorgia ? 'ga' : 'other'}
                onChange={(e) => update('formedInGeorgia', e.target.value === 'ga')}>
                <option value="ga">Georgia (domestic entity)</option>
                <option value="other">Outside Georgia (foreign entity)</option>
              </select>
            </label>
          )}
          <label className="cb-req-field">Regular employees, excluding LLC members / corporate officers
            <input type="number" min="0" max="100000" value={profile.regularWorkers}
              onChange={(e) => update('regularWorkers', Math.min(100000, Math.max(0, Number(e.target.value) || 0)))} />
          </label>
          {profile.structure !== 'sole' && (
            <label className="cb-req-field">LLC members / corporate officers (count separately)
              <input type="number" min="0" max="100000" value={profile.officersOrMembers}
                onChange={(e) => update('officersOrMembers', Math.min(100000, Math.max(0, Number(e.target.value) || 0)))} />
            </label>
          )}
          <label className="cb-req-field">Do you sell goods as a retailer/dealer?
            <select value={profile.dealerActivity} onChange={(e) => update('dealerActivity', e.target.value)}>
              <option value="yes">Yes</option><option value="no">No</option><option value="unsure">Not sure</option>
            </select>
          </label>
          {profile.industry === 'restaurant' && <>
            <label className="cb-req-field">Food activity
              <select value={profile.foodActivity} onChange={(e) => update('foodActivity', e.target.value)}>
                <option value="prepared">Prepare/serve meals for consumption</option>
                <option value="packaged">Primarily packaged retail food</option>
                <option value="both">Both food service and packaged retail</option>
              </select>
            </label>
            <label className="cb-req-field">Sell or serve alcohol?
              <select value={profile.alcoholSales} onChange={(e) => update('alcoholSales', e.target.value)}>
                <option value="no">No</option><option value="yes">Yes</option>
              </select>
            </label>
          </>}
        </div>
        <label className="cb-req-confirm">
          <input type="checkbox" checked={profile.withinAtlanta}
            onChange={(e) => update('withinAtlanta', e.target.checked)} />
          <span>I confirm this business will operate <strong>inside the City of Atlanta limits</strong> (not just at an Atlanta mailing address).</span>
        </label>
        <div className="cb-req-form-actions">
          <button className="cb-req-generate" type="submit" disabled={!profile.withinAtlanta}>
            Generate my checklist <ArrowRight size={17} />
          </button>
          <button className="cb-req-reset" type="button" onClick={() => {
            setProfile({ ...defaultProfile }); setGenerated(false); setEvidence({}); clearDocumentAnalyses(); setNotice(''); setAiMessage('');
          }}><RotateCcw size={16} /> Reset</button>
        </div>
        {notice && <div className="cb-req-message" role="status">{notice}</div>}
      </form>

      {result && !result.errors.length && <section className="cb-req-results" aria-live="polite">
        <div className="cb-req-results-title">
          <div><div className="cb-req-eyebrow"><BookOpen size={15} /> PERSONALIZED ROADMAP</div>
            <h2>Your requirements checklist</h2>
            <p>Government-source links are provided for every item. Evidence status is separate from legal compliance.</p>
          </div>
          <button type="button" className="cb-req-export" onClick={exportJSON}><Download size={17} /> Export JSON for document AI</button>
        </div>
        <div className="cb-req-stats">
          <div><strong>{counts.required}</strong><span>Required</span></div>
          <div><strong>{counts.conditional}</strong><span>Conditional</span></div>
          <div><strong>{counts.review}</strong><span>Need applicability review</span></div>
          <div><strong>{counts.reviewed}</strong><span>Evidence reviewed</span></div>
        </div>
        <div className="cb-req-filter" aria-label="Filter checklist">
          {['all', 'required', 'conditional', 'review'].map((f) => (
            <button type="button" key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All requirements' : CLASS_TEXT[f]}
            </button>
          ))}
        </div>
        {aiMessage && <div className="cb-req-ai-note" role="status"><UploadCloud size={18}/>{aiMessage}</div>}
        {grouped.map((group) => <div className="cb-req-group" key={group.category}>
          <h3>{group.category}</h3>
          {group.items.map((item) => {
            const status = evidence[item.id]?.status || 'not_submitted';
            return <article className="cb-req-item" key={item.id}>
              <div className="cb-req-item-main">
  <span className={`cb-req-pill cb-req-pill-${item.classification}`}>
    {CLASS_TEXT[item.classification]}
  </span>

                <label className="cb-req-completion">
                  <input
                      type="checkbox"
                      checked={progress[item.id] === true}
                      onChange={(e) => {
                        setRequirementCompleted(item.id, e.target.checked);
                        setProgress(getRequirementProgress());
                      }}
                  />
                  <span>Mark as completed</span>
                </label>

                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <div className="cb-req-meta"><ShieldCheck size={15} /> {item.agency}</div>
                <a href={item.source} target="_blank" rel="noopener noreferrer" className="cb-req-source">
                  Official source <ExternalLink size={14}/>
                </a>
                {item.evidenceTypes.length > 0 && <div className="cb-req-evidence">
                  Expected evidence: <code>{item.evidenceTypes.join(', ')}</code>
                </div>}
              </div>
              <div className="cb-req-item-side">
                <div className="cb-req-evidence-status">
                  {status === 'evidence_reviewed' ? <FileCheck2 size={17} /> : <FileClock size={17} />}
                  {STATUS_TEXT[status]}
                </div>
                {item.evidenceTypes.length > 0 ? <>
                  {(status === 'document_received' || status === 'needs_review') && <button type="button" onClick={() => setReview(item.id, 'evidence_reviewed')}>
                    <CheckCircle2 size={15} /> I reviewed the evidence
                  </button>}
                  {status === 'not_submitted' && <span className="cb-req-side-note">Classify and submit evidence from the Documents tab.</span>}
                  {status !== 'not_submitted' && <button type="button" className="cb-req-subtle" onClick={() => setReview(item.id, 'needs_review')}>
                    Flag for review
                  </button>}
                  {status !== 'not_submitted' && <button type="button" className="cb-req-subtle" onClick={() => setReview(item.id, 'not_submitted')}>
                    Reset evidence status
                  </button>}
                </> : <span className="cb-req-side-note">Applicability must be checked with agency guidance.</span>}
              </div>
            </article>;
          })}
        </div>)}
        <div className="cb-req-footer"><Info size={18}/>
          <span>Document AI can mark evidence as received, but neither the AI nor a manual checkmark verifies official licensing status. Confirm requirements, exceptions, and permit validity with the issuing agency.</span>
        </div>
      </section>}
    </div>
  );
}

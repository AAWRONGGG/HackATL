import React, { useState } from 'react';
import {
  ArrowRight, CalendarDays, ClipboardCheck, MessageCircle, UploadCloud,
  Users, ShieldCheck, AlertCircle,
} from 'lucide-react';
import {
  CLASS_TEXT, loadChecklist, saveEvidence, STATUS_TEXT, statusOf, summarize,
} from './services/checklistStore.js';
import './Readiness.css';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function getReadiness(checklist) {
  const items = checklist?.requirements || [];
  const evidence = checklist?.evidence || {};
  // Only confirmed-required items enter the denominator; conditional/review items remain visible separately.
  const required = items.filter(item => item.classification === 'required');
  const reviewed = required.filter(item => statusOf(evidence, item.id) === 'evidence_reviewed');
  const waiting = required.filter(item => ['document_received', 'needs_review'].includes(statusOf(evidence, item.id)));
  const unresolved = items.filter(item => item.classification !== 'required');
  return {
    complete: reviewed.length,
    total: required.length,
    pending: required.length - reviewed.length,
    waiting: waiting.length,
    unresolved: unresolved.length,
    percentage: required.length ? Math.round(reviewed.length / required.length * 100) : 0,
  };
}

function ReadinessHero({ checklist, navigate }) {
  const score = getReadiness(checklist);
  const circumference = 2 * Math.PI * 46;
  const offset = circumference * (1 - score.percentage / 100);
  return (
    <section className="hero bb-readiness-hero" aria-labelledby="bb-readiness-heading">
      <div className="bb-readiness-copy">
        <div className="bb-readiness-kicker"><ShieldCheck size={16} aria-hidden="true" /> YOUR BUSINESS READINESS</div>
        <h2 id="bb-readiness-heading">{checklist ? 'Your business, on track.' : 'Build your business roadmap.'}</h2>
        <p>{checklist
          ? `${score.pending} of ${score.total} required checklist items still need evidence review.${score.unresolved ? ` ${score.unresolved} other items need applicability review.` : ''}`
          : 'Answer a few questions to see your requirements and track your progress.'}</p>
        <button className="whitebutton bb-readiness-action" type="button" onClick={() => navigate('Requirements')}>
          {checklist ? 'View requirements' : 'Build my checklist'} <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="bb-readiness-visual">
        <svg className="bb-readiness-ring" viewBox="0 0 120 120" role="img"
          aria-label={checklist ? `${score.percentage}% of required items have reviewed evidence` : 'Readiness score available after setup'}>
          <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="9" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="#b2f3d6" strokeWidth="9"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            transform="rotate(-90 60 60)" />
          <text x="60" y="58" textAnchor="middle" className="bb-readiness-number">{checklist ? `${score.percentage}%` : '—'}</text>
          <text x="60" y="77" textAnchor="middle" className="bb-readiness-ring-label">{checklist ? 'reviewed' : 'not set'}</text>
        </svg>
        <div className="bb-readiness-caption">{checklist ? `${score.complete} of ${score.total} required items reviewed` : 'Start with your business profile'}</div>
      </div>
    </section>
  );
}

export default function Dashboard({ navigate }) {
  const [checklist, setChecklist] = useState(loadChecklist);
  const [recent, setRecent] = useState([]);
  const stats = summarize(checklist);
  const name = checklist?.profile.businessName;

  function toggle(item) {
    if (!checklist) return;
    const evidence = { ...checklist.evidence };
    const done = statusOf(evidence, item.id) === 'evidence_reviewed';
    evidence[item.id] = {
      status: done ? (evidence[item.id]?.documents?.length ? 'document_received' : 'not_submitted') : 'evidence_reviewed',
      documents: evidence[item.id]?.documents || [],
    };
    saveEvidence(evidence);
    setChecklist({ ...checklist, evidence });
    if (!done) setRecent(r => [...r, item.id]);
  }

  const nextSteps = checklist
    ? checklist.requirements
        .filter(item => statusOf(checklist.evidence, item.id) !== 'evidence_reviewed' || recent.includes(item.id))
        .slice(0, 5)
    : [];

  return <>
    <div className="eyebrow">YOUR BUSINESS WORKSPACE</div>
    <h1>{greeting()}, {name ? <span data-no-translate>{name}</span> : 'business owner'}.</h1>
    <p className="intro">Everything you need to stay organized, understand requirements, and keep your business moving.</p>

    <ReadinessHero checklist={checklist} navigate={navigate} />

    <div className="stats">
      <div className="stat">
        <span>Requirements done</span>
        <strong>{stats.done} <small>/ {stats.total}</small></strong>
        <div className="progress" role="progressbar" aria-label="Requirements done"
          aria-valuemin={0} aria-valuemax={stats.total || 1} aria-valuenow={stats.done}>
          <i style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }} />
        </div>
      </div>
      <div className="stat">
        <span>Still to do</span>
        <strong>{stats.open}</strong>
        <small>{checklist ? 'Required items are listed first' : 'Build your checklist to start'}</small>
      </div>
      <div className="stat">
        <span>Documents waiting for review</span>
        <strong>{stats.received}</strong>
        <small>Matched from the Documents tab</small>
      </div>
    </div>

    <div className="twocol">
      <section className="panel">
        <div className="panelhead">
          <h3>Your next steps</h3>
          <button className="link" onClick={() => navigate('Requirements')}>View all <ArrowRight size={15}/></button>
        </div>
        {!checklist && <div className="empty-steps">
          <p className="muted">Your next steps will appear here once you build your checklist.</p>
          <button className="whitebutton accent" onClick={() => navigate('Requirements')}>Build my checklist <ArrowRight size={16}/></button>
        </div>}
        {checklist && nextSteps.length === 0 && <p className="muted">All tracked checklist items have reviewed evidence. Confirm legal validity with the issuing agencies.</p>}
        {nextSteps.map(item => {
          const status = statusOf(checklist.evidence, item.id);
          const done = status === 'evidence_reviewed';
          return <label className="task" key={item.id}>
            <input type="checkbox" checked={done} onChange={() => toggle(item)}
              aria-label={`Mark ${item.title} evidence as ${done ? 'needing review' : 'reviewed'}`} />
            <span>
              <b className={done ? 'done' : ''}>{item.title}</b>
              <small>{CLASS_TEXT[item.classification]} · {STATUS_TEXT[status]}</small>
            </span>
          </label>;
        })}
      </section>

      <section className="panel">
        <div className="panelhead"><h3>Quick access</h3></div>
        {[
          ['Understand a regulation', 'AI Assistant', MessageCircle],
          ['Upload a document', 'Documents', UploadCloud],
          ["Review what's still open", 'Deadlines', CalendarDays],
          ['Find professional help', 'Find Experts', Users],
        ].map(([title, page, Icon]) => <button className="quick" onClick={() => navigate(page)} key={title}>
          <span className="quickicon"><Icon size={19}/></span>{title}<ArrowRight size={16}/>
        </button>)}
      </section>
    </div>
  </>;
}

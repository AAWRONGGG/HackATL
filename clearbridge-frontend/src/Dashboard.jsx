import React, { useState } from 'react';
import { ArrowRight, CalendarDays, ClipboardCheck, MessageCircle, UploadCloud, Users } from 'lucide-react';
import { CLASS_TEXT, loadChecklist, saveEvidence, STATUS_TEXT, statusOf, summarize } from './services/checklistStore.js';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard({ navigate, session }) {
  const [checklist, setChecklist] = useState(loadChecklist);
  // Items ticked off during this visit stay in view so they can be unticked.
  const [recent, setRecent] = useState([]);
  const stats = summarize(checklist);
  const name = checklist?.profile.businessName || session?.businessName || session?.name;

  function toggle(item) {
    const evidence = { ...checklist.evidence };
    const done = statusOf(evidence, item.id) === 'evidence_reviewed';
    evidence[item.id] = {
      status: done ? (evidence[item.id]?.documents?.length ? 'document_received' : 'not_submitted') : 'evidence_reviewed',
      documents: evidence[item.id]?.documents || [],
    };
    saveEvidence(evidence);
    setChecklist({ ...checklist, evidence });
    if (!done) setRecent((r) => [...r, item.id]);
  }

  const nextSteps = checklist
    ? checklist.requirements
        .filter((i) => statusOf(checklist.evidence, i.id) !== 'evidence_reviewed' || recent.includes(i.id))
        .slice(0, 5)
    : [];

  return <>
    <div className="eyebrow">YOUR BUSINESS WORKSPACE</div>
    <h1>{greeting()}, {name ? <span data-no-translate>{name}</span> : 'business owner'}.</h1>
    <p className="intro">Everything you need to stay organized, understand requirements, and keep your business moving.</p>

    <div className="hero">
      <div>
        <span className="heroeyebrow">YOUR COMPLIANCE OVERVIEW</span>
        <h2>Less paperwork.<br/>More time for business.</h2>
        <p>{checklist
          ? `${stats.open} of ${stats.total} requirements still need attention.`
          : 'Answer a few questions to build your Atlanta checklist.'}</p>
        <button className="whitebutton" onClick={() => navigate('Requirements')}>
          {checklist ? 'View your requirements' : 'Build my checklist'} <ArrowRight size={17}/>
        </button>
      </div>
      <div className="heroicon"><ClipboardCheck size={78} strokeWidth={1.1}/></div>
    </div>

    <div className="stats">
      <div className="stat">
        <span>Requirements done</span>
        <strong>{stats.done} <small>/ {stats.total}</small></strong>
        <div className="progress" role="progressbar" aria-label="Requirements done" aria-valuemin={0} aria-valuemax={stats.total || 1} aria-valuenow={stats.done}>
          <i style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }}/>
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
        {checklist && nextSteps.length === 0 && <p className="muted">Everything on your checklist is done. Nice work.</p>}
        {nextSteps.map((item) => {
          const status = statusOf(checklist.evidence, item.id);
          const done = status === 'evidence_reviewed';
          return <label className="task" key={item.id}>
            <input type="checkbox" checked={done} onChange={() => toggle(item)}/>
            <span>
              <b className={done ? 'done' : ''}>{item.title}</b>
              <small>{CLASS_TEXT[item.classification]} · {STATUS_TEXT[status]}</small>
            </span>
          </label>;
        })}
      </section>

      <section className="panel">
        <div className="panelhead"><h3>Quick access</h3></div>
        {[['Understand a regulation', 'AI Assistant', MessageCircle], ['Upload a document', 'Documents', UploadCloud],
          ['Review what\'s still open', 'Deadlines', CalendarDays], ['Find professional help', 'Find Experts', Users]]
          .map(([title, page, Icon]) => <button className="quick" onClick={() => navigate(page)} key={title}>
            <span className="quickicon"><Icon size={19}/></span>{title}<ArrowRight size={16}/>
          </button>)}
      </section>
    </div>
  </>;
}

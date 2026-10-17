import React, { useState } from 'react';
import { ArrowRight, Clock3 } from 'lucide-react';
import { CLASS_TEXT, loadChecklist, STATUS_TEXT, statusOf } from './services/checklistStore.js';

export default function Deadlines({ navigate }) {
  const [checklist] = useState(loadChecklist);
  const open = checklist
    ? checklist.requirements.filter((i) => statusOf(checklist.evidence, i.id) !== 'evidence_reviewed')
    : [];

  return <>
    <div className="eyebrow">STAY ON TRACK</div>
    <h1>Deadlines</h1>
    <p className="intro">Everything still open on your checklist, most important first.</p>
    <div className="notice">Official due dates aren't in the ruleset yet. Check each agency's source link for exact deadlines.</div>
    <section className="panel">
      {!checklist && <div className="empty-steps">
        <p className="muted">Build your checklist on the Requirements page to see what's open.</p>
        <button className="whitebutton accent" onClick={() => navigate('Requirements')}>Build my checklist <ArrowRight size={16}/></button>
      </div>}
      {checklist && !open.length && <p className="muted">Nothing open. Every requirement is marked done.</p>}
      {open.map((item) => <div className="deadline" key={item.id}>
        <div className="datebox"><Clock3 size={18}/>{CLASS_TEXT[item.classification]}</div>
        <div>
          <b>{item.title}</b>
          <small>{item.agency} · {STATUS_TEXT[statusOf(checklist.evidence, item.id)]}</small>
        </div>
      </div>)}
    </section>
  </>;
}

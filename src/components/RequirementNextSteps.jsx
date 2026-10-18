import React from 'react';
import { ArrowRight, ClipboardCheck, FileCheck2, FileClock } from 'lucide-react';
import { getRequirements, RULESET_VERSION } from '../services/requirementsEngine.js';

const STORAGE_KEY = 'bizbridge-atlanta-requirements-v1';

function readSavedChecklist() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved?.generated || saved.rulesetVersion !== RULESET_VERSION) return null;
    const result = getRequirements(saved.profile);
    if (result.errors?.length) return null;
    return {
      requirements: result.requirements || [],
      checklist: saved.checklist || {},
      evidence: saved.evidence || {},
    };
  } catch {
    return null;
  }
}

function readableDocumentType(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function RequirementNextSteps({ onOpenRequirements }) {
  // Dashboard remounts when returning from the Requirements tab, so it
  // rereads the latest profile/checklist from localStorage on each visit.
  const saved = readSavedChecklist();

  if (!saved) {
    return (
      <section className="panel">
        <div className="panelhead">
          <h3>Your next steps</h3>
          <button className="link" type="button" onClick={onOpenRequirements}>
            Get started <ArrowRight size={15} />
          </button>
        </div>
        <p className="muted">Create your business profile under Requirements to see your personalized document checklist here.</p>
      </section>
    );
  }

  const { requirements, checklist, evidence } = saved;
  const completed = requirements.filter((item) => checklist[item.id]?.completed).length;
  const pending = requirements
    .filter((item) => !checklist[item.id]?.completed && item.classification === 'required')
    .sort((a, b) => {
      const first = checklist[a.id]?.targetDate || '9999-12-31';
      const second = checklist[b.id]?.targetDate || '9999-12-31';
      return first.localeCompare(second);
    });
  const conditionalCount = requirements.filter((item) =>
    !checklist[item.id]?.completed && item.classification !== 'required'
  ).length;

  return (
    <section className="panel">
      <div className="panelhead">
        <h3>Your next steps</h3>
        <button className="link" type="button" onClick={onOpenRequirements}>
          View all <ArrowRight size={15} />
        </button>
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>
        {completed} of {requirements.length} tasks marked complete
      </p>
      {pending.length === 0 ? (
        <p className="muted">No outstanding required tasks in your current checklist. Review conditional requirements before assuming you are finished.</p>
      ) : pending.slice(0, 5).map((item) => {
        const types = item.evidenceTypes || [];
        const status = evidence[item.id]?.status || 'not_submitted';
        const target = displayDate(checklist[item.id]?.targetDate);
        return (
          <div className="task" key={item.id} style={{ alignItems: 'flex-start' }}>
            {status === 'evidence_reviewed'
              ? <FileCheck2 size={19} style={{ flexShrink: 0, marginTop: 2 }} />
              : types.length ? <FileClock size={19} style={{ flexShrink: 0, marginTop: 2 }} />
                : <ClipboardCheck size={19} style={{ flexShrink: 0, marginTop: 2 }} />}
            <span>
              <b>{item.title}</b>
              <small>
                {types.length ? `Expected evidence: ${types.map(readableDocumentType).join(', ')}` : 'Review the official requirement'}
              </small>
              <small>
                {status === 'document_received' ? 'Document received — awaiting review' :
                  status === 'evidence_reviewed' ? 'Evidence reviewed — not legal verification' :
                  status === 'needs_review' ? 'Evidence flagged for review' : 'Evidence not yet submitted'}
                {target ? ` · Your target: ${target}` : ''}
              </small>
            </span>
          </div>
        );
      })}
      {pending.length > 5 && (
        <p className="muted" style={{ marginTop: 12 }}>+{pending.length - 5} more required tasks in your checklist</p>
      )}
      {conditionalCount > 0 && (
        <p className="muted" style={{ marginTop: 12 }}>
          {conditionalCount} conditional or review item(s) also need an applicability check.
        </p>
      )}
    </section>
  );
}

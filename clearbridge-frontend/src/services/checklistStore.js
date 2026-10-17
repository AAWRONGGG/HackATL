// Reads the checklist the Requirements page generated, so the Dashboard and Deadlines
// pages show the same live data. Writes go back to the same saved record.

import {
  getRequirements, normalizedProfile, REQUIREMENTS_STORAGE_KEY, RULESET_VERSION,
} from './requirementsEngine.js';

export const STATUS_TEXT = {
  not_submitted: 'No document yet',
  document_received: 'Document received, review needed',
  needs_review: 'Evidence needs review',
  evidence_reviewed: 'Done (evidence reviewed)',
};

export const CLASS_TEXT = { required: 'Required', conditional: 'Conditional', review: 'Needs review' };
const CLASS_ORDER = { required: 0, conditional: 1, review: 2 };

function readSaved() {
  try {
    const data = JSON.parse(window.localStorage.getItem(REQUIREMENTS_STORAGE_KEY) || 'null');
    return data && data.rulesetVersion === RULESET_VERSION ? data : null;
  } catch {
    return null;
  }
}

// Returns null until the owner has generated a checklist on the Requirements page.
export function loadChecklist() {
  const saved = readSaved();
  if (!saved?.generated || !saved.profile) return null;
  const result = getRequirements(normalizedProfile(saved.profile));
  if (result.errors.length) return null;
  return {
    profile: result.profile,
    evidence: saved.evidence || {},
    requirements: [...result.requirements].sort(
      (a, b) => CLASS_ORDER[a.classification] - CLASS_ORDER[b.classification]
    ),
  };
}

export function saveEvidence(evidence) {
  const saved = readSaved();
  if (!saved) return;
  try {
    window.localStorage.setItem(REQUIREMENTS_STORAGE_KEY, JSON.stringify({ ...saved, evidence }));
  } catch {
    /* Storage blocked: the change still shows until the page reloads. */
  }
}

export function statusOf(evidence, id) {
  return evidence[id]?.status || 'not_submitted';
}

export function summarize(checklist) {
  const items = checklist?.requirements || [];
  const ev = checklist?.evidence || {};
  const done = items.filter((i) => statusOf(ev, i.id) === 'evidence_reviewed').length;
  const received = items.filter((i) => ['document_received', 'needs_review'].includes(statusOf(ev, i.id))).length;
  return { total: items.length, done, open: items.length - done, received };
}

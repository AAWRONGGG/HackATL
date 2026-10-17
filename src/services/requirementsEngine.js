import { REQUIREMENT_RULES } from '../data/atlantaRequirements.js';

export const RULESET_VERSION = 'ATL-2026-10-17-v1';
export const DOCUMENT_INBOX_KEY = 'clearbridge-document-analysis-v1';
// Where the Requirements page saves the profile, checklist and evidence (shared with the dashboard).
export const REQUIREMENTS_STORAGE_KEY = 'clearbridge-atlanta-requirements-v1';
export const EVIDENCE_STATUSES = [
  'not_submitted', 'document_received', 'needs_review', 'evidence_reviewed',
];

export const defaultProfile = Object.freeze({
  industry: 'restaurant', structure: 'llc', formedInGeorgia: true,
  businessName: '', withinAtlanta: false,
  regularWorkers: 0, officersOrMembers: 1,
  dealerActivity: 'yes', foodActivity: 'prepared', alcoholSales: 'no',
});

export function normalizedProfile(input = {}) {
  const profile = { ...defaultProfile, ...input };

  return {
    ...profile,

    regularWorkers: Math.max(
        0,
        Math.floor(Number(profile.regularWorkers) || 0)
    ),

    officersOrMembers: Math.max(
        0,
        Math.floor(Number(profile.officersOrMembers) || 0)
    ),

    businessName: String(profile.businessName || '')
        .trim()
        .slice(0, 120),

    withinAtlanta: profile.withinAtlanta === true,

    formedInGeorgia: profile.formedInGeorgia !== false
  };
}

export function getRequirements(input) {
  const profile = normalizedProfile(input);
  if (!profile.withinAtlanta) {
    return { rulesetVersion: RULESET_VERSION, profile, requirements: [],
      errors: ['This verified ruleset only supports operations confirmed to be inside Atlanta city limits. A mailing address or ZIP code alone is not proof of jurisdiction.'] };
  }
  const requirements = REQUIREMENT_RULES.map((rule) => {
    const classification = rule.evaluate(profile);
    return classification === 'not_applicable' ? null : {
      id: rule.id,
      title: rule.title,
      agency: rule.agency,
      category: rule.category,
      description: rule.description,
      classification,
      source: rule.source,
      evidenceTypes: [...rule.evidenceTypes],
      evidenceStatus: 'not_submitted',
      sourceReviewedOn: '2026-10-17',
    };
  }).filter(Boolean);
  return { rulesetVersion: RULESET_VERSION, profile, requirements, errors: [] };
}

// The AI may tell us WHAT document was submitted, not whether a company is compliant.
// Type matching only changes evidence status to 'document_received'.
export function matchDocumentToRequirements(requirements, analysis) {
  if (!analysis || typeof analysis.documentType !== 'string') return [];
  const type = analysis.documentType.trim().toLowerCase();
  return requirements
    .filter((item) => item.evidenceTypes.includes(type))
    .map((item) => item.id);
}

export function createDocumentEvent(analysis) {
  // Shape shared with the document-recognition team.
  return {
    documentId: String(analysis?.documentId || ''),
    documentType: String(analysis?.documentType || ''),
    confidence: typeof analysis?.confidence === 'number' ? analysis.confidence : null,
    extractedFields: analysis?.extractedFields && typeof analysis.extractedFields === 'object'
      ? analysis.extractedFields : {},
  };
}

export function exportRequirementsPayload(result, evidenceById = {}) {
  return {
    schemaVersion: '1.0', generatedAt: new Date().toISOString(),
    rulesetVersion: result.rulesetVersion,
    profile: result.profile,
    requirements: result.requirements.map((item) => ({
      ...item,
      evidenceStatus: evidenceById[item.id]?.status || 'not_submitted',
      submittedDocuments: evidenceById[item.id]?.documents || [],
    })),
    notice: 'Source-linked guidance only; not an official determination of legal compliance.',
  };
}

// Use this adapter from the Documents tab AFTER AI classification succeeds.
// Save only document metadata (not raw OCR, images, names, or sensitive fields).
// sessionStorage survives route/component switches in the same browser tab.
export function getDocumentAnalyses() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(DOCUMENT_INBOX_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function publishDocumentAnalysis(rawAnalysis) {
  const parsed = createDocumentEvent(rawAnalysis);
  if (!parsed.documentType) return false;
  if (typeof window === 'undefined') return false;
  const safe = {
    documentId: parsed.documentId || `document-${Date.now()}`,
    documentType: parsed.documentType,
    confidence: parsed.confidence,
  };
  try {
    const prior = getDocumentAnalyses();
    const remaining = prior.filter((d) => d.documentId !== safe.documentId);
    window.sessionStorage.setItem(DOCUMENT_INBOX_KEY, JSON.stringify([...remaining, safe].slice(-30)));
  } catch { /* Persistence is optional; live listener can still receive event. */ }
  window.dispatchEvent(new CustomEvent('clearbridge:document-analyzed', { detail: safe }));
  return true;
}

export function clearDocumentAnalyses() {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.removeItem(DOCUMENT_INBOX_KEY); } catch { /* optional */ }
}

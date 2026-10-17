// API client. Every page talks to the backend only through these functions.
//
// Mock mode is on by default. To use the real backend, set in .env.local:
//   NEXT_PUBLIC_USE_MOCK=false
//   NEXT_PUBLIC_API_URL=http://localhost:8000

import {
  DEMO_PROFILE,
  MOCK_ALERTS,
  MOCK_CHECKLIST,
  MOCK_FORMS,
  MOCK_REPORT,
  fillForm,
} from "./mock";
import type {
  Alert,
  BusinessProfile,
  ChecklistItem,
  Deadline,
  DocumentReport,
  FillableForm,
} from "./types";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---- Profile (kept in the browser for the demo) -------------------------

const PROFILE_KEY = "peachpermit.profile";
const STATUS_KEY = "peachpermit.status";
const REPORTS_KEY = "peachpermit.reports";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the demo still works for this page view */
  }
}

export function getProfile(): BusinessProfile | null {
  return readJSON<BusinessProfile | null>(PROFILE_KEY, null);
}

// POST /onboard
export async function onboard(profile: BusinessProfile): Promise<{ businessId: string }> {
  writeJSON(PROFILE_KEY, profile);
  if (USE_MOCK) {
    await wait(500);
    return { businessId: "demo" };
  }
  return http("/onboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}

export function loadDemoProfile(): BusinessProfile {
  writeJSON(PROFILE_KEY, DEMO_PROFILE);
  return DEMO_PROFILE;
}

// ---- Checklist -----------------------------------------------------------

function applyRules(items: ChecklistItem[], p: BusinessProfile): ChecklistItem[] {
  return items.filter((i) => {
    if (i.id === "alcohol-license") return p.sellsAlcohol;
    if (i.id === "food-service-permit" || i.id === "food-manager") return p.preparesFood;
    if (i.id === "workers-comp") return p.employees >= 3;
    if (i.id === "e-verify") return p.employees > 10;
    if (i.id === "new-hire" || i.id === "labor-posters") return p.employees > 0;
    return true;
  });
}

// GET /checklist
export async function getChecklist(): Promise<ChecklistItem[]> {
  const profile = getProfile() ?? DEMO_PROFILE;
  const statuses = readJSON<Record<string, ChecklistItem["status"]>>(STATUS_KEY, {});
  let items: ChecklistItem[];
  if (USE_MOCK) {
    await wait(300);
    items = applyRules(MOCK_CHECKLIST, profile);
  } else {
    items = await http<ChecklistItem[]>("/checklist");
  }
  return items.map((i) => ({ ...i, status: statuses[i.id] ?? i.status }));
}

export function setItemStatus(id: string, status: ChecklistItem["status"]) {
  const statuses = readJSON<Record<string, ChecklistItem["status"]>>(STATUS_KEY, {});
  statuses[id] = status;
  writeJSON(STATUS_KEY, statuses);
}

// GET /deadlines
export async function getDeadlines(): Promise<Deadline[]> {
  if (!USE_MOCK) return http<Deadline[]>("/deadlines");
  const items = await getChecklist();
  return items
    .filter((i) => i.dueDate && i.status !== "done")
    .map((i) => ({ id: `d-${i.id}`, title: i.title, dueDate: i.dueDate!, checklistItemId: i.id }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

// GET /alerts
export async function getAlerts(): Promise<Alert[]> {
  if (USE_MOCK) {
    await wait(300);
    return MOCK_ALERTS;
  }
  return http<Alert[]>("/alerts");
}

// ---- Document check --------------------------------------------------------

// POST /check-document (multipart: file)
export async function checkDocument(file: File | { name: string }): Promise<DocumentReport> {
  let report: DocumentReport;
  if (USE_MOCK) {
    await wait(2600);
    const id = `r-${Date.now().toString(36)}`;
    report = { ...MOCK_REPORT, id, fileName: file.name, checkedAt: new Date().toISOString() };
  } else {
    const body = new FormData();
    if (file instanceof File) body.append("file", file);
    report = await http<DocumentReport>("/check-document", { method: "POST", body });
  }
  const reports = readJSON<Record<string, DocumentReport>>(REPORTS_KEY, {});
  reports[report.id] = report;
  writeJSON(REPORTS_KEY, reports);
  return report;
}

// GET /reports/:id
export async function getReport(id: string): Promise<DocumentReport | null> {
  const reports = readJSON<Record<string, DocumentReport>>(REPORTS_KEY, {});
  if (reports[id]) return reports[id];
  if (USE_MOCK) return id === MOCK_REPORT.id ? MOCK_REPORT : null;
  return http<DocumentReport>(`/reports/${id}`);
}

// ---- Forms -------------------------------------------------------------------

// GET /forms
export async function getForms(): Promise<FillableForm[]> {
  if (USE_MOCK) {
    await wait(200);
    return MOCK_FORMS;
  }
  return http<FillableForm[]>("/forms");
}

// POST /forms/:id/fill
export async function fillFormById(id: string): Promise<FillableForm | null> {
  const profile = getProfile() ?? DEMO_PROFILE;
  if (USE_MOCK) {
    await wait(700);
    const form = MOCK_FORMS.find((f) => f.id === id);
    return form ? fillForm(form, profile) : null;
  }
  return http<FillableForm>(`/forms/${id}/fill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}

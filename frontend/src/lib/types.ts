// Shared types — these mirror the API contract in the build plan.
// Dev A / Dev B: if a response shape changes, change it here first.

export type BusinessType =
  | "restaurant"
  | "food_truck"
  | "cafe_bakery"
  | "bar"
  | "catering";

export interface BusinessProfile {
  name: string;
  ownerName: string;
  type: BusinessType;
  city: string; // demo supports "Atlanta"
  employees: number;
  sellsAlcohol: boolean;
  preparesFood: boolean;
  hasStorefront: boolean;
}

export type Jurisdiction = "City of Atlanta" | "State of Georgia" | "Federal";
export type ItemStatus = "todo" | "done";

export interface Citation {
  code: string; // e.g. "O.C.G.A. § 48-13-9"
  title: string;
  sourceUrl: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  summary: string; // plain-English explanation
  jurisdiction: Jurisdiction;
  citation: Citation;
  status: ItemStatus;
  dueDate?: string; // ISO date
  renewal?: string; // e.g. "Every year by April 1"
  formId?: string; // links to /forms
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: string; // ISO date
  checklistItemId: string;
}

export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  issue: string;
  severity: Severity;
  excerpt?: string; // the line in the uploaded document
  fix: string; // plain-English fix
  citation: Citation;
  confidence: number; // 0–1
  askAttorney: boolean;
}

export interface DocumentReport {
  id: string;
  fileName: string;
  documentType: string;
  checkedAt: string; // ISO datetime
  summary: string;
  findings: Finding[];
}

export interface Alert {
  id: string;
  billNumber: string;
  title: string;
  whyItMatters: string;
  status: string; // e.g. "Passed House, in Senate committee"
  sourceUrl: string;
}

export interface FormField {
  key: string;
  label: string;
  value: string;
  fromProfile: boolean; // true when autofilled from onboarding answers
}

export interface FillableForm {
  id: string;
  name: string;
  agency: string;
  description: string;
  fields: FormField[];
}

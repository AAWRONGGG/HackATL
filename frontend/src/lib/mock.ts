// Mock data for the demo vertical: an Atlanta restaurant.
//
// IMPORTANT: this is sample data for building the UI.
// - Verify every citation against the Georgia Code / GA Rules before the pitch.
// - Bills in MOCK_ALERTS are placeholders; Dev A's bills feed replaces them.
// - Dates are illustrative, not real filing deadlines.

import type {
  Alert,
  BusinessProfile,
  ChecklistItem,
  DocumentReport,
  FillableForm,
} from "./types";

const GA_CODE = "https://law.justia.com/codes/georgia/";
const GA_RULES = "https://rules.sos.ga.gov/";
const US_CODE = "https://www.law.cornell.edu/uscode/text/29";

export const DEMO_PROFILE: BusinessProfile = {
  name: "Magnolia Kitchen",
  ownerName: "Dana Brooks",
  type: "restaurant",
  city: "Atlanta",
  employees: 12,
  sellsAlcohol: true,
  preparesFood: true,
  hasStorefront: true,
};

export const MOCK_CHECKLIST: ChecklistItem[] = [
  {
    id: "atl-business-license",
    title: "City of Atlanta business license",
    summary:
      "Every business operating in Atlanta needs a city business license (occupational tax certificate), renewed each year.",
    jurisdiction: "City of Atlanta",
    citation: {
      code: "O.C.G.A. § 48-13-5 et seq.",
      title: "Local occupational tax",
      sourceUrl: GA_CODE,
    },
    status: "todo",
    dueDate: "2026-11-02",
    renewal: "Renews every year",
    formId: "atl-business-license",
  },
  {
    id: "food-service-permit",
    title: "Food service permit",
    summary:
      "Restaurants need a permit from the county health department before serving food, plus a passing inspection.",
    jurisdiction: "State of Georgia",
    citation: {
      code: "Ga. Comp. R. & Regs. 511-6-1",
      title: "Food service rules",
      sourceUrl: GA_RULES,
    },
    status: "todo",
    dueDate: "2026-10-30",
    formId: "food-service-permit",
  },
  {
    id: "food-manager",
    title: "Certified food protection manager on staff",
    summary:
      "At least one person in charge must hold an accredited food protection manager certificate.",
    jurisdiction: "State of Georgia",
    citation: {
      code: "Ga. Comp. R. & Regs. 511-6-1",
      title: "Food service rules: person in charge",
      sourceUrl: GA_RULES,
    },
    status: "done",
  },
  {
    id: "sales-tax",
    title: "Sales and use tax registration",
    summary:
      "Register with the Georgia Department of Revenue before you start collecting sales tax on meals.",
    jurisdiction: "State of Georgia",
    citation: {
      code: "O.C.G.A. § 48-8-59",
      title: "Certificate of registration",
      sourceUrl: GA_CODE,
    },
    status: "done",
  },
  {
    id: "alcohol-license",
    title: "Alcohol licenses (city and state)",
    summary:
      "Serving beer, wine or liquor needs a local license from the city and a state license from the Department of Revenue.",
    jurisdiction: "City of Atlanta",
    citation: {
      code: "O.C.G.A. § 3-3-2",
      title: "Local licensing of alcoholic beverages",
      sourceUrl: GA_CODE,
    },
    status: "todo",
    dueDate: "2026-12-15",
    renewal: "Renews every year",
  },
  {
    id: "workers-comp",
    title: "Workers' compensation insurance",
    summary:
      "Employers with three or more regular employees must carry workers' compensation coverage.",
    jurisdiction: "State of Georgia",
    citation: {
      code: "O.C.G.A. § 34-9-2",
      title: "Workers' compensation: application",
      sourceUrl: GA_CODE,
    },
    status: "done",
  },
  {
    id: "e-verify",
    title: "E-Verify affidavit",
    summary:
      "Private employers with more than 10 employees must use E-Verify and file an affidavit with their business license application.",
    jurisdiction: "State of Georgia",
    citation: {
      code: "O.C.G.A. § 36-60-6",
      title: "E-Verify requirement for private employers",
      sourceUrl: GA_CODE,
    },
    status: "todo",
    dueDate: "2026-11-02",
  },
  {
    id: "new-hire",
    title: "New hire reporting",
    summary:
      "Report every new employee to the Georgia New Hire Reporting Program shortly after hiring.",
    jurisdiction: "State of Georgia",
    citation: {
      code: "O.C.G.A. § 19-11-9.2",
      title: "New hire reporting",
      sourceUrl: GA_CODE,
    },
    status: "todo",
  },
  {
    id: "labor-posters",
    title: "Required workplace posters",
    summary:
      "Display federal minimum wage and other required notices where employees can see them.",
    jurisdiction: "Federal",
    citation: {
      code: "29 C.F.R. § 516.4",
      title: "Posting of notices",
      sourceUrl: "https://www.ecfr.gov/current/title-29/section-516.4",
    },
    status: "todo",
  },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: "alert-1",
    billNumber: "HB 101 (sample)",
    title: "Changes to restaurant inspection grading",
    whyItMatters:
      "You hold a food service permit, so new grading rules would apply to your next inspection.",
    status: "In House committee",
    sourceUrl: "https://www.legis.ga.gov/",
  },
  {
    id: "alert-2",
    billNumber: "SB 202 (sample)",
    title: "Tip pooling disclosure for employers",
    whyItMatters:
      "You have employees who earn tips, so you may need to post a new notice.",
    status: "Passed Senate",
    sourceUrl: "https://www.legis.ga.gov/",
  },
];

export const SAMPLE_DOCUMENTS = [
  { id: "handbook", name: "Employee handbook.pdf", type: "Employee handbook" },
  { id: "lease", name: "Storefront lease.docx", type: "Commercial lease" },
  { id: "permit-app", name: "Permit application.pdf", type: "Permit application" },
];

export const MOCK_REPORT: DocumentReport = {
  id: "demo-handbook",
  fileName: "Employee handbook.pdf",
  documentType: "Employee handbook",
  checkedAt: "2026-10-17T10:15:00-04:00",
  summary:
    "Your handbook covers most basics, but 2 policies conflict with current law and 2 more are missing information.",
  findings: [
    {
      id: "f1",
      issue: "Starting wage is below the federal minimum",
      severity: "high",
      excerpt: "Hourly team members start at $5.15 per hour.",
      fix: "Georgia's state minimum is $5.15, but most restaurants are covered by the federal minimum of $7.25. Update the starting wage to at least $7.25.",
      citation: {
        code: "29 U.S.C. § 206",
        title: "Federal minimum wage",
        sourceUrl: US_CODE,
      },
      confidence: 0.94,
      askAttorney: false,
    },
    {
      id: "f2",
      issue: "Managers share in the tip pool",
      severity: "high",
      excerpt: "Tips are pooled and split among servers, bussers and shift managers.",
      fix: "Employers, managers and supervisors can't keep any part of employees' tips. Remove shift managers from the tip pool.",
      citation: {
        code: "29 U.S.C. § 203(m)(2)(B)",
        title: "Tips belong to employees",
        sourceUrl: US_CODE,
      },
      confidence: 0.88,
      askAttorney: true,
    },
    {
      id: "f3",
      issue: "No policy for staff who are sick",
      severity: "medium",
      fix: "Add a rule that employees must report certain symptoms and diagnoses, and when they must stay home or be restricted from handling food.",
      citation: {
        code: "Ga. Comp. R. & Regs. 511-6-1",
        title: "Food service rules: employee health",
        sourceUrl: GA_RULES,
      },
      confidence: 0.81,
      askAttorney: false,
    },
    {
      id: "f4",
      issue: "Workers' comp doctor list isn't mentioned",
      severity: "low",
      fix: "Tell employees where the posted panel of physicians is, so they know which doctors to see after a work injury.",
      citation: {
        code: "O.C.G.A. § 34-9-201",
        title: "Panel of physicians",
        sourceUrl: GA_CODE,
      },
      confidence: 0.72,
      askAttorney: false,
    },
  ],
};

export const MOCK_FORMS: FillableForm[] = [
  {
    id: "atl-business-license",
    name: "Business license application",
    agency: "City of Atlanta, Office of Revenue",
    description: "New or renewal application for your city business license.",
    fields: [],
  },
  {
    id: "food-service-permit",
    name: "Food service permit application",
    agency: "County Board of Health",
    description: "Permit to operate a food service establishment.",
    fields: [],
  },
  {
    id: "e-verify-affidavit",
    name: "E-Verify private employer affidavit",
    agency: "City of Atlanta, Office of Revenue",
    description: "Filed with your business license if you have more than 10 employees.",
    fields: [],
  },
];

// Fills a form's fields from the business profile. Fields the profile can't
// answer stay blank for the owner to complete.
export function fillForm(form: FillableForm, p: BusinessProfile): FillableForm {
  const typeLabel: Record<BusinessProfile["type"], string> = {
    restaurant: "Restaurant",
    food_truck: "Food truck",
    cafe_bakery: "Café or bakery",
    bar: "Bar",
    catering: "Catering",
  };
  const base = [
    { key: "business_name", label: "Business name", value: p.name, fromProfile: true },
    { key: "owner_name", label: "Owner name", value: p.ownerName, fromProfile: true },
    { key: "business_type", label: "Type of business", value: typeLabel[p.type], fromProfile: true },
    { key: "city", label: "City", value: p.city, fromProfile: true },
  ];
  const byForm: Record<string, typeof base> = {
    "atl-business-license": [
      ...base,
      { key: "employees", label: "Number of employees", value: String(p.employees), fromProfile: true },
      { key: "address", label: "Business address", value: "", fromProfile: false },
      { key: "ein", label: "Federal EIN", value: "", fromProfile: false },
    ],
    "food-service-permit": [
      ...base,
      { key: "alcohol", label: "Serves alcohol", value: p.sellsAlcohol ? "Yes" : "No", fromProfile: true },
      { key: "food_prep", label: "Prepares food on site", value: p.preparesFood ? "Yes" : "No", fromProfile: true },
      { key: "manager_cert", label: "Certified food manager name", value: "", fromProfile: false },
      { key: "seating", label: "Seating capacity", value: "", fromProfile: false },
    ],
    "e-verify-affidavit": [
      ...base,
      { key: "employees", label: "Number of employees", value: String(p.employees), fromProfile: true },
      { key: "everify_id", label: "E-Verify user ID", value: "", fromProfile: false },
      { key: "everify_date", label: "Date of E-Verify authorization", value: "", fromProfile: false },
    ],
  };
  return { ...form, fields: byForm[form.id] ?? base };
}

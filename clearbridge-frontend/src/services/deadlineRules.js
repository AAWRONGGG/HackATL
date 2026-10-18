// Source-backed deadline metadata keyed to the existing requirement IDs.
// A missing calendar date is intentional when law depends on missing facts.
const source = {
  atl: 'https://www.atlantaga.gov/government/departments/finance/office-of-revenue/frequently-asked-questions',
  gaLLC: 'https://rules.sos.ga.gov/gac/590-7-22',
  gaCorp: 'https://rules.sos.ga.gov/gac/590-7-4',
  gaFood: 'https://rules.sos.ga.gov/GAC/511-6-1',
  gaRetail: 'https://rules.sos.ga.gov/GAC/40-7-1',
  gaSalon: 'https://rules.sos.ga.gov/gac/240-12',
};

export const DEADLINE_METADATA = {
  ATL_OCCUPATIONAL_CERT: {kind:'before_opening',label:'Certificate required before operating',source:source.atl,renewal:'Annual renewal submission by February 15; renewal payment by April 1. Certificate expires December 31.'},
  ATL_ZONING_REVIEW: {kind:'with_application',label:'Complete as part of occupational tax application',source:source.atl},
  ATL_SAVE_AFFIDAVIT: {kind:'with_application',label:'Provide with new occupational tax application',source:source.atl},
  ATL_EVERIFY_AFFIDAVIT: {kind:'with_application',label:'Provide with new occupational tax application',source:source.atl},
  ATL_APPLICANT_ID: {kind:'with_application',label:'Provide with new occupational tax application',source:source.atl},
  GA_FORM_LLC: {kind:'before_opening',label:'Form LLC before doing business as that LLC'},
  GA_FORM_CORPORATION: {kind:'before_opening',label:'Form corporation before doing business as that corporation'},
  GA_FOREIGN_ENTITY: {kind:'verify',label:'Confirm foreign-entity filing timing with Georgia SOS'},
  GA_LLC_ANNUAL: {kind:'annual',month:4,day:1,label:'Annual filing deadline: April 1 (if registration is due this year)',source:source.gaLLC,renewal:'Initial LLC annual registration is in the calendar year after formation; multi-year filings may affect subsequent due years.'},
  GA_CORP_ANNUAL: {kind:'annual',month:4,day:1,label:'Annual filing deadline: April 1 (if registration is due this year)',source:source.gaCorp,renewal:'Initial domestic corporate registration can be due within 90 days of incorporation; late-year incorporations have a different first deadline. Confirm incorporation date and filing history.'},
  GA_SALES_USE_TAX: {kind:'before_activity',label:'Register when beginning activities that require a dealer registration'},
  GA_PAYROLL_WITHHOLDING: {kind:'verify',label:'Determine registration and filing timing from payroll/tax account'},
  GA_UNEMPLOYMENT: {kind:'verify',label:'Check employer liability and reporting schedule with Georgia DOL'},
  GA_WORKERS_COMP: {kind:'before_activity',label:'Obtain required coverage when the legal worker threshold is met'},
  GA_RESTAURANT_FOOD_SERVICE: {kind:'business_days_before',days:10,label:'Submit application at least 10 business days before opening; obtain permit before serving',source:source.gaFood},
  GA_GROCERY_FOOD_ESTABLISHMENT: {kind:'days_before',days:30,label:'Submit application at least 30 calendar days before opening; license required before operating',source:source.gaRetail,renewal:'Retail food license term is July 1–June 30; confirm renewal with agency.'},
  GA_MIXED_FOOD_SCOPE: {kind:'verify',label:'Confirm applicable food license(s) before opening'},
  GA_SALON_SHOP_LICENSE: {kind:'before_opening',label:'Must be licensed before opening or performing services',source:source.gaSalon},
  GA_SALON_INDIVIDUALS: {kind:'before_activity',label:'Each provider needs an active license before performing regulated services',source:source.gaSalon},
  ATL_ALCOHOL_LICENSE: {kind:'before_activity',label:'Obtain required authorization before selling or serving alcohol'},
  ATL_ADDITIONAL_PERMITS: {kind:'verify',label:'Verify applicable approvals before operating'},
  GA_SPECIALIZED_PROFESSION: {kind:'verify',label:'Check professional licensing before offering regulated services'},
};

function parseISO(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
  const [y,m,d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear()===y && date.getUTCMonth()===m-1 && date.getUTCDate()===d ? date : null;
}
const isoDate = date => date.toISOString().slice(0,10);
function subtractBusinessDays(date,count) {
  const result = new Date(date);
  let remaining=count;
  while (remaining>0) {
    result.setUTCDate(result.getUTCDate()-1);
    const weekday=result.getUTCDay();
    if (weekday!==0 && weekday!==6) remaining--;
  }
  return result;
}
export function getDeadline(item, settings={}) {
  const rule=DEADLINE_METADATA[item.id] || {kind:'verify',label:'Confirm deadline with issuing agency'};
  const opening=parseISO(settings.openingDate);
  const formed=parseISO(settings.formationDate);
  const currentYear=new Date().getFullYear();
  const out={...rule,date:null,type:rule.kind,warning:null};
  if(rule.kind==='days_before' && opening){
    const d=new Date(opening);d.setUTCDate(d.getUTCDate()-rule.days);out.date=isoDate(d);
  }
  if(rule.kind==='business_days_before' && opening){
    out.date=isoDate(subtractBusinessDays(opening,rule.days));
    out.warning='Weekend-only calculation; public holidays and agency instructions may require an earlier date.';
  }
  if(rule.kind==='before_opening' && opening) {
    out.date=isoDate(opening);
    out.warning='Latest operational boundary, not a filing deadline. Submit early enough for approval.';
  }
  if(rule.kind==='annual') {
    if (!formed) out.warning='Enter formation date and check annual registration history before relying on a calendar deadline.';
    else if(item.id==='GA_LLC_ANNUAL') {
      const firstYear=formed.getUTCFullYear()+1;
      const year=Math.max(currentYear,firstYear);
      out.date=`${year}-04-01`;
      out.warning='Potential annual registration deadline; confirm whether multi-year registration already covers this period.';
    } else {
      // Initial corporation annual registrations have special timing; do not guess.
      out.warning='Corporation initial annual registration timing depends on incorporation date. Review the SOS source; subsequent annual registrations usually close April 1.';
    }
  }
  if(rule.kind==='with_application' && opening){out.date=isoDate(opening);out.warning='Must accompany the new occupational tax application; this is not a standalone submission due date.';}
  return out;
}

export function getOccupationalRenewal(referenceYear = new Date().getFullYear()) {
  return [{title:'Atlanta Occupational Tax Certificate renewal application',date:`${referenceYear}-02-15`,source:source.atl},
    {title:'Atlanta Occupational Tax Certificate renewal payment',date:`${referenceYear}-04-01`,source:source.atl}];
}

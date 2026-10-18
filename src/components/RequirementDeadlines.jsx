import React, {useEffect, useMemo, useState} from 'react';
import {CalendarClock, ArrowRight, ExternalLink, Info, AlertCircle} from 'lucide-react';
import {getRequirements, RULESET_VERSION, REQUIREMENTS_STORAGE_KEY} from '../services/requirementsEngine.js';
import {loadChecklist, statusOf} from '../services/checklistStore.js';
import {getRequirementProgress} from '../services/requirementProgress.js';
import {getDeadline, getOccupationalRenewal} from '../services/deadlineRules.js';
import './RequirementDeadlines.css';

const STORE = REQUIREMENTS_STORAGE_KEY;
const SETTINGS='bizbridge-deadline-settings-v1';
function load(key){try{return JSON.parse(window.localStorage.getItem(key)||'null')}catch{return null}}
const pretty = iso => iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}) : '';
const today = () => new Date().toISOString().slice(0,10);

export default function RequirementDeadlines({onOpenRequirements=()=>{}}) {
  const [stored,setStored]=useState(()=>load(STORE));
  const [checklist,setChecklist]=useState(loadChecklist);
  const [progress,setProgress]=useState(getRequirementProgress);
  const [settings,setSettings]=useState(()=>load(SETTINGS)||{openingDate:'',formationDate:'',includeRenewals:false});
  const [tab,setTab]=useState('all');
  useEffect(()=>{
    const refresh=()=>{
      setStored(load(STORE));
      setChecklist(loadChecklist());
      setProgress(getRequirementProgress());
    };
    window.addEventListener('storage',refresh);
    window.addEventListener('focus',refresh);
    window.addEventListener('bizbridge:checklist-updated',refresh);
    window.addEventListener('bizbridge:progress-updated',refresh);
    return()=>{
      window.removeEventListener('storage',refresh);
      window.removeEventListener('focus',refresh);
      window.removeEventListener('bizbridge:checklist-updated',refresh);
      window.removeEventListener('bizbridge:progress-updated',refresh);
    };
  },[]);
  useEffect(()=>{try{localStorage.setItem(SETTINGS,JSON.stringify(settings))}catch{}},[settings]);
  const valid=stored?.generated && stored?.rulesetVersion===RULESET_VERSION && stored?.profile?.withinAtlanta;
  const requirements=useMemo(()=>valid?getRequirements(stored.profile).requirements:[],[stored,valid]);
  const rows = requirements.map(item => ({
    item,
    deadline: getDeadline(item, settings),
    // The Requirements checkbox store takes priority. Dashboard evidence review
    // is the fallback until the team consolidates both completion mechanisms.
    done: typeof progress[item.id] === 'boolean'
        ? progress[item.id]
        : statusOf(checklist?.evidence || {}, item.id) === 'evidence_reviewed',
    planned: stored?.checklist?.[item.id]?.targetDate || '',
  }));
  const ordered=rows.sort((a,b)=>{
    const aDate=a.deadline.date||a.planned;
    const bDate=b.deadline.date||b.planned;
    return Number(!aDate)-Number(!bDate)||String(aDate).localeCompare(String(bDate));
  });
  const visible=ordered.filter(x=>tab==='all'||(tab==='dated'?Boolean(x.deadline.date):!x.deadline.date));
  const futureRenewalYear=new Date().getFullYear() + (new Date().getMonth()>=3 ? 1 : 0);
  const renewals=settings.includeRenewals?getOccupationalRenewal(futureRenewalYear):[];
  const update=(key,value)=>setSettings(s=>({...s,[key]:value}));
  return <div className="cb-deadlines">
    <div className="cb-d-head"><div><span className="cb-d-kicker"><CalendarClock size={16}/> COMPLIANCE CALENDAR</span><h1>Deadlines & key dates</h1><p>Know what must be filed before opening, what renews annually, and what still requires confirmation.</p></div></div>
    <div className="cb-d-note"><Info size={18}/><span>Deadlines come from official rules where possible. A permit needed <b>before opening</b> is not the same as an application submission deadline. AI-identified documents do not prove compliance.</span></div>
    {!valid?<div className="cb-d-empty"><CalendarClock size={30}/><h2>Generate a checklist first</h2><p>Tell BizBridge about your Atlanta business to display applicable dates.</p><button onClick={onOpenRequirements}>Set up requirements <ArrowRight size={16}/></button></div>:<>
      <div className="cb-d-settings"><div className="cb-d-title"><h2>Set your business timeline</h2><p>These dates allow us to calculate filing windows that depend on your circumstances.</p></div><div className="cb-d-inputs"><label>Planned opening date<input type="date" value={settings.openingDate} onChange={e=>update('openingDate',e.target.value)}/></label><label>Legal entity formation date<input type="date" value={settings.formationDate} onChange={e=>update('formationDate',e.target.value)}/></label></div><label className="cb-d-renew"><input type="checkbox" checked={settings.includeRenewals} onChange={e=>update('includeRenewals',e.target.checked)}/> Include Atlanta Occupational Tax Certificate renewal reminders (only if already issued)</label></div>
      <div className="cb-d-summary"><div><strong>{rows.filter(x=>x.deadline.date).length}</strong><span>Dates calculable</span></div><div><strong>{rows.filter(x=>!x.deadline.date).length}</strong><span>Event-based / confirm</span></div><div><strong>{rows.filter(x=>x.deadline.date&&x.deadline.date<today()&&!x.done).length}</strong><span>Past-dated items to review</span></div></div>
      <div className="cb-d-list-head"><h2>Requirements timeline</h2><button onClick={onOpenRequirements}>View checklist <ArrowRight size={16}/></button></div><div className="cb-d-tabs">{[['all','All requirements'],['dated','Calculated dates'],['review','Needs timing input']].map(([v,t])=><button key={v} className={tab===v?'active':''} onClick={()=>setTab(v)}>{t}</button>)}</div>
      <div className="cb-d-list">{visible.map(({item,deadline,planned,done})=><article className="cb-d-row" key={item.id}><div className="cb-d-date">{deadline.date?<><strong>{pretty(deadline.date)}</strong><small>{deadline.kind==='annual'?'Annual filing':deadline.kind==='with_application'?'Application package':deadline.kind==='before_opening'?'Opening boundary':'Latest submission'}</small></>:<><strong>Event-based</strong><small>Check timing</small></>}</div><div className="cb-d-info"><div className="cb-d-row-top"><h3>{item.title}</h3><span className={'cb-d-chip '+item.classification}>{item.classification==='review'?'Needs review':item.classification}</span></div><p>{deadline.label}</p>{deadline.warning&&<div className="cb-d-warning"><AlertCircle size={14}/>{deadline.warning}</div>}{deadline.renewal&&<p className="cb-d-extra">{deadline.renewal}</p>}{planned&&<p className="cb-d-target">Your target: {pretty(planned)}</p>}<div className="cb-d-bottom"><span style={{display:'inline-flex',alignItems:'center',gap:8}}><input type="checkbox" checked={done} readOnly aria-label={`${item.title}: ${done ? 'marked complete' : 'not complete'}`} style={{width:17,height:17,accentColor:'#176b55'}} />{done?'Marked complete':'Not marked complete'}</span><a href={deadline.source||item.source} target="_blank" rel="noreferrer">Government source <ExternalLink size={13}/></a></div></div></article>)}</div>
      {renewals.length>0&&<section className="cb-d-renew-section"><h2>Renewal reminders</h2><p>Separate from initial registration requirements. Confirm certificate status and payment instructions.</p>{renewals.map(r=><div key={r.title} className="cb-d-renew-row"><strong>{pretty(r.date)}</strong><span>{r.title}</span><a href={r.source} target="_blank" rel="noreferrer">Source <ExternalLink size={13}/></a></div>)}</section>}
      <p className="cb-d-disclaimer">This tool is not an exhaustive legal calendar. Georgia tax returns, payroll reports, permit renewals and profession-specific deadlines require additional questions or agency verification. Dates may change; check official guidance before filing.</p>
    </>}
  </div>;
}
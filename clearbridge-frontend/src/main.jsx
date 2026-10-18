import React, {useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard,ClipboardCheck,Files,MessageCircle,CalendarDays,Users,Clock3,ArrowRight,UploadCloud,Menu,X,ShieldCheck,Accessibility,LogOut} from 'lucide-react';
import './style.css';
import FindExperts from "./FindExperts.jsx";
import Requirements from "./Requirements.jsx";
import Dashboard from "./Dashboard.jsx";
import RequirementDeadlines from "./components/RequirementDeadlines.jsx";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import { AccessibilityProvider } from "./accessibility/AccessibilityContext.jsx";
import AccessibilityPanel from "./accessibility/AccessibilityPanel.jsx";
import Login from "./auth/Login.jsx";
import { getSession, initials, signOut } from "./auth/auth.js";
import "./auth/login.css";
import "./accessibility/accessibility.css";
import AIWorkspace from "./AIWorkspace.jsx";
import ChatAssistant from "./ChatAssistant.jsx";
const sections=[['Dashboard',LayoutDashboard],['Requirements',ClipboardCheck],['AI Assistant',MessageCircle],['Deadlines',CalendarDays],['Find Experts',Users]];
function App({session,onSignOut}){const [account,setAccount]=useState(false),[page,setPage]=useState('Dashboard'),[files,setFiles]=useState([]),[menu,setMenu]=useState(false),[question,setQuestion]=useState(''),[messages,setMessages]=useState([]);function navigate(p){setAccount(false);setPage(p);setMenu(false)}function ask(e){e.preventDefault();if(!question.trim())return;setMessages(m=>[...m,{q:question,a:'This starter website does not yet connect to an AI service. Once the FastAPI backend is connected, answers will cite official sources and explain requirements in plain language.'}]);setQuestion('')}
const accountRef = useRef(null);
const avatarRef = useRef(null);
const closeAccessibility = useCallback(() => setAccount(false), []);
useEffect(() => {
  if (account !== 'profile') return undefined;
  accountRef.current?.querySelector('.account-menu button')?.focus();
  function dismiss(event) {
    if (event.type === 'keydown') {
      if (event.key !== 'Escape') return;
      setAccount(false);
      avatarRef.current?.focus();
    } else if (!accountRef.current?.contains(event.target)) setAccount(false);
  }
  document.addEventListener('pointerdown', dismiss);
  document.addEventListener('focusin', dismiss);
  document.addEventListener('keydown', dismiss);
  return () => {
    document.removeEventListener('pointerdown', dismiss);
    document.removeEventListener('focusin', dismiss);
    document.removeEventListener('keydown', dismiss);
  };
}, [account, page]);
const accountControl = (
<div className="account" ref={accountRef}>
  <button ref={avatarRef} type="button" className="avatar" aria-label={`Account: ${session.name||session.email}`} aria-expanded={Boolean(account)} aria-controls={account === 'accessibility' ? 'a11y-panel' : 'account-dropdown'} onClick={()=>setAccount(a=>a ? false : 'profile')}>{initials(session)}</button>
  {account === 'profile' && <div id="account-dropdown" className="account-menu">
    <p><strong>{session.name||"Your account"}</strong><span>{session.email}</span></p>
    <button type="button" aria-haspopup="dialog" aria-controls="a11y-panel" onClick={()=>setAccount('accessibility')}><Accessibility size={16} aria-hidden="true"/><span>Accessibility settings</span></button>
    <button type="button" onClick={onSignOut}><LogOut size={16} aria-hidden="true"/><span>Sign out</span></button>
  </div>}
  <AccessibilityPanel open={account === 'accessibility'} onClose={closeAccessibility} returnFocusRef={avatarRef}/>
</div>
);
const headerControls = { accountControl, onOpenNavigation: () => setMenu(true) };
return <div className="app"><aside className={'sidebar '+(menu?'open':'')}><div className="brand"><img
    src="/bizbridge-logo.png"
    alt=""
    className="bizbridge-logo"
    aria-hidden="true"
/><span>BizBridge<small>Business made simpler</small></span><button className="close" onClick={()=>setMenu(false)}><X size={20}/></button></div><div className="navlabel">WORKSPACE</div><nav>{sections.map(([name,Icon])=><button key={name} className={'nav '+(page===name?'active':'')} onClick={()=>navigate(name)}><Icon size={19}/>{name}</button>)}</nav><div className="sidebarbottom"><ShieldCheck size={18}/> Helping local businesses move forward.</div></aside><main className="main"><div className="content">{page==='Dashboard'?<Dashboard navigate={navigate} session={session} {...headerControls}/>:null}
{page === 'Requirements' ? <Requirements {...headerControls} /> : null}
{page === "AI Assistant" ? <AIWorkspace {...headerControls} /> : null}
  {page === "Deadlines" ? (
      <RequirementDeadlines
          {...headerControls}
          onOpenRequirements={() => navigate("Requirements")}
      />
  ) : null}
    {page === "Find Experts" ? <FindExperts {...headerControls} /> : null}

</div>
</main>
</div>;
}

function Root(){
  const [session,setSession]=useState(getSession);
  if(!session) return <Login onSignedIn={setSession}/>;
  return <App session={session} onSignOut={()=>{signOut();setSession(null);}}/>;
}

createRoot(document.getElementById("root")).render(<AccessibilityProvider><Root /></AccessibilityProvider>);
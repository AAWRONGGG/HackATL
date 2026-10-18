import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard,ClipboardCheck,Files,MessageCircle,CalendarDays,Users,Clock3,ArrowRight,UploadCloud,Menu,X,ShieldCheck,Languages,LogOut} from 'lucide-react';
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
function App({session,onSignOut}){const [account,setAccount]=useState(false),[page,setPage]=useState('Dashboard'),[files,setFiles]=useState([]),[menu,setMenu]=useState(false),[question,setQuestion]=useState(''),[messages,setMessages]=useState([]);function navigate(p){setPage(p);setMenu(false)}function ask(e){e.preventDefault();if(!question.trim())return;setMessages(m=>[...m,{q:question,a:'This starter website does not yet connect to an AI service. Once the FastAPI backend is connected, answers will cite official sources and explain requirements in plain language.'}]);setQuestion('')}
return <div className="app"><aside className={'sidebar '+(menu?'open':'')}><div className="brand"><img
    src="/bizbridge-logo.png"
    alt=""
    className="bizbridge-logo"
    aria-hidden="true"
/><span>BizBridge<small>Business made simpler</small></span><button className="close" onClick={()=>setMenu(false)}><X size={20}/></button></div><div className="navlabel">WORKSPACE</div><nav>{sections.map(([name,Icon])=><button key={name} className={'nav '+(page===name?'active':'')} onClick={()=>navigate(name)}><Icon size={19}/>{name}</button>)}</nav><div className="sidebarbottom"><ShieldCheck size={18}/> Helping local businesses move forward.</div></aside><main className="main"><header><button className="hamburger" onClick={()=>setMenu(true)}><Menu/></button><div className="crumb">Workspace <span>/</span> {page}</div><AccessibilityPanel/><div className="account"><button type="button" className="avatar" aria-label={`Account: ${session.name||session.email}`} aria-expanded={account} onClick={()=>setAccount(a=>!a)}>{initials(session)}</button>{account&&<div className="account-menu"><p><strong>{session.name||"Your account"}</strong><span>{session.email}</span></p><button type="button" onClick={onSignOut}><LogOut size={16} aria-hidden="true"/>Sign out</button></div>}</div></header><div className="content">{page==='Dashboard'?<Dashboard navigate={navigate} session={session}/>:null}
{page === 'Requirements' ? <Requirements /> : null}
{page === "AI Assistant" ? <AIWorkspace /> : null}
  {page === "Deadlines" ? (
      <RequirementDeadlines
          onOpenRequirements={() => navigate("Requirements")}
      />
  ) : null}
    {page === "Find Experts" ? <FindExperts /> : null}

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
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard,ClipboardCheck,Files,MessageCircle,CalendarDays,Users,ArrowRight,UploadCloud,Menu,X,ShieldCheck,Languages} from 'lucide-react';
import './style.css';
import FindExperts from "./FindExperts.jsx";
import Requirements from "./Requirements.jsx";
import Dashboard from "./Dashboard.jsx";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import { AccessibilityProvider } from "./accessibility/AccessibilityContext.jsx";
import AccessibilityPanel from "./accessibility/AccessibilityPanel.jsx";
import "./accessibility/accessibility.css";
import RequirementDeadlines from "./components/RequirementDeadlines.jsx";
const sections=[['Dashboard',LayoutDashboard],['Requirements',ClipboardCheck],['Documents',Files],['AI Assistant',MessageCircle],['Deadlines',CalendarDays],['Find Experts',Users]];
function App(){const [page,setPage]=useState('Dashboard'),[files,setFiles]=useState([]),[menu,setMenu]=useState(false),[question,setQuestion]=useState(''),[messages,setMessages]=useState([]);function navigate(p){setPage(p);setMenu(false)}function ask(e){e.preventDefault();if(!question.trim())return;setMessages(m=>[...m,{q:question,a:'This starter website does not yet connect to an AI service. Once the FastAPI backend is connected, answers will cite official sources and explain requirements in plain language.'}]);setQuestion('')}
return <div className="app"><aside className={'sidebar '+(menu?'open':'')}><div className="brand"><span className="brandmark">C</span><span>BizBridge<small>Business made simpler</small></span><button className="close" onClick={()=>setMenu(false)}><X size={20}/></button></div><div className="navlabel">WORKSPACE</div><nav>{sections.map(([name,Icon])=><button key={name} className={'nav '+(page===name?'active':'')} onClick={()=>navigate(name)}><Icon size={19}/>{name}</button>)}</nav><div className="sidebarbottom"><ShieldCheck size={18}/> Helping local businesses move forward.</div></aside><main className="main"><header><button className="hamburger" onClick={()=>setMenu(true)}><Menu/></button><div className="crumb">Workspace <span>/</span> {page}</div><AccessibilityPanel/><div className="avatar" title="Demo account">SB</div></header><div className="content">{page==='Dashboard'?<Dashboard navigate={navigate}/>:null}
{page === 'Requirements' ? <Requirements /> : null}
{page==='Documents'?<><div className="eyebrow">DOCUMENT CENTER</div><h1>Your documents</h1><p className="intro">Keep important files in one place. Files are kept in this browser session for this demo and are not uploaded.</p><label className="upload"><UploadCloud size={32}/><strong>Choose files to add</strong><span>PDFs and images accepted</span><input type="file" multiple accept=".pdf,image/*" onChange={e=>setFiles(a=>[...a,...Array.from(e.target.files).map(f=>({name:f.name,size:Math.round(f.size/1024)}))])}/></label><section className="panel"><h3>Selected files</h3>{files.length?files.map((f,i)=><div className="file" key={i}><Files size={18}/>{f.name}<small>{f.size} KB</small></div>):<p className="muted">No documents selected yet.</p>}</section></>:null}
{page==='AI Assistant'?<><div className="eyebrow">GUIDANCE MADE SIMPLE</div><h1>Ask your assistant</h1><p className="intro">Ask about paperwork, regulations, or next steps. Live AI answers will be available once your backend is connected.</p><section className="panel chat"><div className="chatintro"><Languages size={27}/><h3>How can we help?</h3><p>Try asking: “What permits might a small restaurant need?”</p></div>{messages.map((m,i)=><div key={i}><div className="bubble userbubble">{m.q}</div><div className="bubble botbubble">{m.a}</div></div>)}<form onSubmit={ask} className="chatinput"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask a question..."/><button type="submit">Send <ArrowRight size={16}/></button></form></section></>:null}
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

createRoot(document.getElementById("root")).render(<AccessibilityProvider><App /></AccessibilityProvider>);
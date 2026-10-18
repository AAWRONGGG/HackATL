import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  ClipboardCheck,
  Files,
  MessageCircle,
  CalendarDays,
  Users,
  ArrowRight,
  UploadCloud,
  Menu,
  X,
  ShieldCheck,
  Languages,
} from "lucide-react";

import "./style.css";
import FindExperts from "./FindExperts.jsx";
import Requirements from "./Requirements.jsx";
import Dashboard from "./Dashboard.jsx";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import { AccessibilityProvider } from "./accessibility/AccessibilityContext.jsx";
import AccessibilityPanel from "./accessibility/AccessibilityPanel.jsx";
import "./accessibility/accessibility.css";
import RequirementDeadlines from "./components/RequirementDeadlines.jsx";

const API_URL = (import.meta.env.VITE_BIZBRIDGE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const sections = [
  ["Dashboard", LayoutDashboard],
  ["Requirements", ClipboardCheck],
  ["Documents", Files],
  ["AI Assistant", MessageCircle],
  ["Deadlines", CalendarDays],
  ["Find Experts", Users],
];

function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function App() {
  const [page, setPage] = useState("Dashboard");
  const [files, setFiles] = useState([]);
  const [menu, setMenu] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  function navigate(nextPage) {
    setPage(nextPage);
    setMenu(false);
  }

  async function ask(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || loading) return;

    const id = crypto.randomUUID();
    setQuestion("");
    setLoading(true);
    setMessages((previous) => [
      ...previous,
      { id, q: text, a: "Thinking...", sources: [] },
    ]);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!response.ok) throw new Error(`Chat API returned ${response.status}`);
      const data = await response.json();
      const sources = Array.isArray(data.sources)
        ? data.sources
            .map((source) => ({
              title: typeof source?.title === "string" ? source.title : "Source",
              url: safeSourceUrl(source?.url),
            }))
            .filter((source) => source.url)
        : [];

      setMessages((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                a: typeof data.answer === "string" && data.answer.trim()
                  ? data.answer
                  : "No answer was returned.",
                sources,
              }
            : item
        )
      );
    } catch (error) {
      console.error("BizBridge chat request failed:", error);
      setMessages((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                a: "The AI assistant is unavailable right now. Check that the backend is running and try again.",
                sources: [],
              }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function selectFiles(event) {
    const selected = Array.from(event.target.files || []);
    setFiles((previous) => [
      ...previous,
      ...selected.map((file) => ({
        name: file.name,
        size: Math.round(file.size / 1024),
      })),
    ]);
    event.target.value = "";
  }

  return (
    <div className="app">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="brand">
          <span className="brandmark">B</span>
          <span>
            BizBridge<small>Business made simpler</small>
          </span>
          <button className="close" type="button" onClick={() => setMenu(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>
        <div className="navlabel">WORKSPACE</div>
        <nav>
          {sections.map(([name, Icon]) => (
            <button key={name} type="button" className={`nav ${page === name ? "active" : ""}`} onClick={() => navigate(name)}>
              <Icon size={19} />{name}
            </button>
          ))}
        </nav>
        <div className="sidebarbottom"><ShieldCheck size={18} /> Helping local businesses move forward.</div>
      </aside>

      <main className="main">
        <header>
          <button className="hamburger" type="button" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu /></button>
          <div className="crumb">Workspace <span>/</span> {page}</div>
          <AccessibilityPanel />
          <div className="avatar" title="Demo account">SB</div>
        </header>

        <div className="content">
          {page === "Dashboard" ? <Dashboard navigate={navigate} /> : null}
          {page === "Requirements" ? <Requirements /> : null}

          {page === "Documents" ? (
            <>
              <div className="eyebrow">DOCUMENT CENTER</div>
              <h1>Your documents</h1>
              <p className="intro">Keep important files in one place. Files are kept in this browser session for this demo and are not uploaded.</p>
              <label className="upload">
                <UploadCloud size={32} />
                <strong>Choose files to add</strong>
                <span>PDFs and images accepted</span>
                <input type="file" multiple accept=".pdf,image/*" onChange={selectFiles} />
              </label>
              <section className="panel">
                <h3>Selected files</h3>
                {files.length ? files.map((file, index) => (
                  <div className="file" key={`${file.name}-${index}`}>
                    <Files size={18} />{file.name}<small>{file.size} KB</small>
                  </div>
                )) : <p className="muted">No documents selected yet.</p>}
              </section>
            </>
          ) : null}

          {page === "AI Assistant" ? (
            <>
              <div className="eyebrow">GUIDANCE MADE SIMPLE</div>
              <h1>Ask your assistant</h1>
              <p className="intro">Ask about business registration, paperwork, regulations, and next steps. Source links appear when the backend supplies them.</p>
              <section className="panel chat">
                <div className="chatintro">
                  <Languages size={27} />
                  <h3>How can we help?</h3>
                  <p>Try asking: “What permits might a small restaurant need?”</p>
                </div>
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className="bubble userbubble">{message.q}</div>
                    <div className="bubble botbubble" aria-live="polite">
                      {message.a}
                      {message.sources.length > 0 && (
                        <div className="ai-sources">
                          <strong>Sources:</strong>
                          {message.sources.map((source, index) => (
                            <p key={`${source.url}-${index}`}>
                              <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <form onSubmit={ask} className="chatinput">
                  <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question..." aria-label="Ask BizBridge a question" />
                  <button type="submit" disabled={loading || !question.trim()}>
                    {loading ? "Thinking..." : "Send"}{!loading && <ArrowRight size={16} />}
                  </button>
                </form>
              </section>
            </>
          ) : null}

          {page === "Deadlines" ? (
            <RequirementDeadlines onOpenRequirements={() => navigate("Requirements")} />
          ) : null}
          {page === "Find Experts" ? <FindExperts /> : null}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <AccessibilityProvider><App /></AccessibilityProvider>
);


import React, { useState } from "react";
import { ArrowRight, Languages } from "lucide-react";

const API_URL =
    import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:8000";

function safeSourceUrl(url) {
    if (typeof url !== "string") return null;

    try {
        const parsed = new URL(url);
        return ["https:", "http:"].includes(parsed.protocol)
            ? parsed.href
            : null;
    } catch {
        return null;
    }
}

export default function ChatAssistant() {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

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
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: text }),
            });

            if (!response.ok) {
                throw new Error(`Chat API returned ${response.status}`);
            }

            const data = await response.json();

            const sources = Array.isArray(data.sources)
                ? data.sources
                    .map((source) => ({
                        title:
                            typeof source?.title === "string"
                                ? source.title
                                : "Source",
                        url: safeSourceUrl(source?.url),
                    }))
                    .filter((source) => source.url)
                : [];

            setMessages((previous) =>
                previous.map((message) =>
                    message.id === id
                        ? {
                            ...message,
                            a:
                                typeof data.answer === "string" && data.answer.trim()
                                    ? data.answer
                                    : "No answer was returned.",
                            sources,
                        }
                        : message
                )
            );
        } catch (error) {
            console.error("BizBridge chat request failed:", error);

            setMessages((previous) =>
                previous.map((message) =>
                    message.id === id
                        ? {
                            ...message,
                            a:
                                "The AI assistant is unavailable right now. " +
                                "Check that the backend is running and try again.",
                            sources: [],
                        }
                        : message
                )
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="eyebrow">GUIDANCE MADE SIMPLE</div>

            <h1>Ask your assistant</h1>

            <p className="intro">
                Ask about business registration, paperwork, regulations,
                and next steps. Sources appear when available.
            </p>

            <section className="panel chat">
                <div className="chatintro">
                    <Languages size={27} />

                    <h3>How can we help?</h3>

                    <p>
                        Try asking: "What permits might a small restaurant need?"
                    </p>
                </div>

                {messages.map((message) => (
                    <div key={message.id}>
                        <div className="bubble userbubble">
                            {message.q}
                        </div>

                        <div
                            className="bubble botbubble"
                            aria-live="polite"
                            style={{ whiteSpace: "pre-wrap" }}
                        >
                            {message.a}

                            {message.sources.length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                    <strong>Sources:</strong>

                                    {message.sources.map((source, index) => (
                                        <p key={`${source.url}-${index}`}>
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {source.title}
                                            </a>
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <form onSubmit={ask} className="chatinput">
                    <input
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder="Ask a question..."
                        aria-label="Ask BizBridge a question"
                    />

                    <button
                        type="submit"
                        disabled={loading || !question.trim()}
                    >
                        {loading ? "Thinking..." : "Send"}

                        {!loading && <ArrowRight size={16} />}
                    </button>
                </form>
            </section>
        </>
    );
}

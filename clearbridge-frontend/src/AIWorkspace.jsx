
import React, { useState } from "react";
import { FileUp, FileCheck2, AlertCircle } from "lucide-react";
import ChatAssistant from "./ChatAssistant.jsx";

const API_URL =
    import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:8000";

function prettyLabel(name) {
    return name.replaceAll("_", " ");
}

export default function AIWorkspace() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [shareWithChat, setShareWithChat] = useState(false);

    async function analyzeFile() {
        if (!file || loading) return;

        setLoading(true);
        setError("");
        setResult(null);

        try {
            if (!file.name.toLowerCase().endsWith(".pdf")) {
                throw new Error("Please select a PDF document.");
            }

            if (file.size > 10 * 1024 * 1024) {
                throw new Error("Maximum document size is 10 MB.");
            }

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(
                `${API_URL}/api/analyze-document`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    typeof data.detail === "string"
                        ? data.detail
                        : "Document analysis failed."
                );
            }

            setResult(data);
        } catch (err) {
            setError(err.message || "Unable to analyze the document.");
        } finally {
            setLoading(false);
        }
    }

    const extractedFields = Object.entries(
        result?.extracted_fields || {}
    );

    // Only share extracted candidates when the user opts in.
    // This may include personal or business information.
    const chatContext =
        result && shareWithChat
            ? [
                "The user uploaded a document for review.",
                `Predicted document type: ${result.document_type}`,
                "Candidate extracted fields (unverified):",
                ...extractedFields.map(([name, field]) => {
                    const value = Array.isArray(field)
                        ? field.join(", ")
                        : field?.value || "Not detected";

                    return `${prettyLabel(name)}: ${value}`;
                }),
                "Do not claim this document is legally valid or approved.",
                "Explain possible issues and recommend manual verification."
            ].join("\n")
            : "";

    return (
        <div className="ai-workspace">
            <div className="eyebrow">BIZBRIDGE INTELLIGENCE</div>
            <h1>Your AI Business Workspace</h1>
            <p className="intro">
                Review your business documents and ask questions about
                paperwork, requirements, and next steps.
            </p>

            <section className="panel" style={{ marginBottom: 24 }}>
                <h2>Document review</h2>
                <p>
                    Upload a PDF to identify its likely type and extract
                    information for review.
                </p>

                <label
                    htmlFor="workspace-file"
                    style={{
                        display: "block",
                        marginTop: 18,
                        marginBottom: 10
                    }}
                >
                    <FileUp size={20} aria-hidden="true" />
                    {" "}Choose a business document
                </label>

                <input
                    id="workspace-file"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(event) => {
                        setFile(event.target.files?.[0] || null);
                        setResult(null);
                        setShareWithChat(false);
                        setError("");
                    }}
                />

                <button
                    type="button"
                    onClick={analyzeFile}
                    disabled={!file || loading}
                    style={{
                        display: "block",
                        marginTop: 16,
                        padding: "12px 18px",
                        background: "#176b55",
                        borderRadius: 10,
                        color: "white",
                        cursor: loading ? "wait" : "pointer"
                    }}
                >
                    {loading ? "Analyzing document..." : "Review Document"}
                </button>

                {error && (
                    <p role="alert" style={{ color: "#d9534f" }}>
                        <AlertCircle size={16} aria-hidden="true" />
                        {" "}{error}
                    </p>
                )}
            </section>

            {result && (
                <section
                    className="panel"
                    style={{ marginBottom: 24 }}
                    aria-live="polite"
                >
                    <h2>
                        <FileCheck2 size={22} aria-hidden="true" />
                        {" "}Document review results
                    </h2>

                    <p><strong>Filename:</strong> {result.filename}</p>
                    <p>
                        <strong>Predicted type:</strong>{" "}
                        {prettyLabel(result.document_type)}
                    </p>
                    <p><strong>Pages:</strong> {result.pages}</p>

                    {result.model_score != null && (
                        <p>
                            <strong>Classification score:</strong>{" "}
                            {(result.model_score * 100).toFixed(1)}%
                            {" "}(not calibrated confidence)
                        </p>
                    )}

                    <h3>Information detected</h3>

                    {extractedFields.map(([name, field]) => (
                        <div key={name} style={{ marginBottom: 12 }}>
                            <strong>{prettyLabel(name)}: </strong>
                            <span>
                {Array.isArray(field)
                    ? field.join(", ") || "None detected"
                    : field?.value || "Not detected"}
              </span>
                        </div>
                    ))}

                    <p>
                        <strong>Review status:</strong>{" "}
                        {prettyLabel(result.status)}
                    </p>

                    <p className="muted">{result.message}</p>

                    <label style={{ display: "flex", gap: 10 }}>
                        <input
                            type="checkbox"
                            checked={shareWithChat}
                            onChange={(event) =>
                                setShareWithChat(event.target.checked)
                            }
                        />
                        <span>
              Allow the AI chat to use these extracted details.
              They will be sent to the Gemini backend with
              my questions.
            </span>
                    </label>
                </section>
            )}

            <div style={{ marginTop: 30 }}>
                <ChatAssistant documentContext={chatContext} />
            </div>
        </div>
    );
}

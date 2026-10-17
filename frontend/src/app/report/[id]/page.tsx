"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CitationTag, Loading, SeverityBadge, buttonClass } from "@/components/ui";
import { getReport } from "@/lib/api";
import type { DocumentReport, Finding, Severity } from "@/lib/types";

const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

function confidenceLabel(c: number) {
  if (c >= 0.85) return "High confidence";
  if (c >= 0.7) return "Medium confidence";
  return "Lower confidence: double-check this one";
}

function FindingCard({ f, n }: { f: Finding; n: number }) {
  const edge = f.severity === "high" ? "border-l-bad" : f.severity === "medium" ? "border-l-warn" : "border-l-civic";
  return (
    <li className={`rounded-xl border border-line border-l-4 ${edge} bg-surface p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center gap-3">
        <SeverityBadge severity={f.severity} />
        <span className="text-sm text-ink-soft">Issue {n}</span>
      </div>
      <h3 className="mt-3 text-xl font-bold leading-snug">{f.issue}</h3>

      {f.excerpt ? (
        <blockquote className="mt-4 rounded-lg bg-paper px-4 py-3 text-[15px] leading-relaxed">
          <span className="block text-sm font-semibold text-ink-soft">Your document says</span>
          <mark className="mt-1 inline rounded bg-peach-tint px-1 text-ink underline decoration-peach decoration-2 underline-offset-4">
            {f.excerpt}
          </mark>
        </blockquote>
      ) : (
        <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-[15px] text-ink-soft">
          Missing from your document.
        </p>
      )}

      <div className="mt-4">
        <p className="text-sm font-semibold text-ink-soft">How to fix it</p>
        <p className="mt-1 max-w-2xl leading-relaxed text-ink">{f.fix}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <CitationTag citation={f.citation} />
        <span className="text-sm text-ink-soft">{confidenceLabel(f.confidence)}</span>
      </div>

      {f.askAttorney && (
        <p className="mt-4 rounded-lg bg-warn-tint px-4 py-3 text-[15px] leading-relaxed text-ink">
          <strong>Ask an attorney before changing this.</strong> The fix depends on details of your pay setup that a
          document check can&apos;t see.
        </p>
      )}
    </li>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<Loading label="Loading your report…" />}>
      <ReportInner />
    </Suspense>
  );
}

function ReportInner() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<DocumentReport | null | undefined>(undefined);

  useEffect(() => {
    getReport(id).then(setReport).catch(() => setReport(null));
  }, [id]);

  if (report === undefined) return <Loading label="Loading your report…" />;
  if (report === null)
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold">This report isn&apos;t available</h1>
        <p className="mt-2 text-ink-soft">
          Reports are kept in this browser for the demo. Check the document again to create a new report.
        </p>
        <Link href="/check" className={`${buttonClass()} mt-6`}>
          Check a document
        </Link>
      </div>
    );

  const findings = [...report.findings].sort((a, b) => rank[a.severity] - rank[b.severity]);
  const count = (s: Severity) => findings.filter((f) => f.severity === s).length;

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold text-ink-soft">
        {report.documentType}, checked{" "}
        {new Date(report.checkedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-[2.25rem]">{report.fileName}</h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">{report.summary}</p>

      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-line py-4">
        {(
          [
            ["high", "Fix now", "text-bad"],
            ["medium", "Fix soon", "text-warn"],
            ["low", "Good to fix", "text-civic"],
          ] as const
        ).map(([s, label, cls]) => (
          <div key={s} className="flex items-baseline gap-2">
            <dt className="text-ink-soft">{label}</dt>
            <dd className={`text-2xl font-bold ${cls}`}>{count(s)}</dd>
          </div>
        ))}
      </dl>

      <div className="no-print mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => window.print()} className={buttonClass("secondary")}>
          Print or save as PDF
        </button>
        <Link href="/check" className={buttonClass("secondary")}>
          Check another document
        </Link>
      </div>

      <ol className="mt-8 space-y-5">
        {findings.map((f, i) => (
          <FindingCard key={f.id} f={f} n={i + 1} />
        ))}
      </ol>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageTitle } from "@/components/ui";
import { checkDocument } from "@/lib/api";
import { SAMPLE_DOCUMENTS } from "@/lib/mock";

const stages = [
  "Reading your document",
  "Finding the Georgia laws that apply",
  "Comparing each section against the law",
  "Writing your report",
];

const ACCEPT = ".pdf,.docx,.txt";
const MAX_MB = 15;

export default function CheckPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stage < 0 || stage >= stages.length - 1) return;
    const t = setTimeout(() => setStage((s) => s + 1), 750);
    return () => clearTimeout(t);
  }, [stage]);

  async function run(file: File | { name: string }) {
    if (file instanceof File) {
      const ok = /\.(pdf|docx|txt)$/i.test(file.name);
      if (!ok) return setError("That file type isn't supported. Upload a PDF, Word (.docx) or text file.");
      if (file.size > MAX_MB * 1024 * 1024) return setError(`That file is over ${MAX_MB} MB. Upload a smaller file.`);
    }
    setError(null);
    setFileName(file.name);
    setStage(0);
    try {
      const report = await checkDocument(file);
      router.push(`/report/${report.id}`);
    } catch (e) {
      setStage(-1);
      setError(e instanceof Error ? e.message : "The check didn't finish. Try again.");
    }
  }

  const busy = stage >= 0;

  return (
    <div className="max-w-3xl">
      <PageTitle
        title="Check a document"
        intro="Upload an employee handbook, lease, contract or permit application. We'll compare it with current Georgia law and show you what to fix."
      />

      {busy ? (
        <section aria-live="polite" className="rounded-xl border border-line bg-surface p-8">
          <p className="text-sm font-semibold text-ink-soft">Checking</p>
          <p className="mt-1 text-xl font-bold">{fileName}</p>
          <ol className="mt-6 space-y-3">
            {stages.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`grid size-6 place-items-center rounded-full text-xs font-bold ${
                    i < stage
                      ? "bg-ok text-white"
                      : i === stage
                        ? "animate-pulse bg-civic-tint text-civic-deep ring-2 ring-civic"
                        : "bg-line text-ink-soft"
                  }`}
                >
                  {i < stage ? "✓" : i + 1}
                </span>
                <span className={i <= stage ? "font-medium text-ink" : "text-ink-soft"}>{s}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) run(f);
            }}
            className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? "border-civic bg-civic-tint" : "border-line bg-surface"
            }`}
          >
            <svg viewBox="0 0 48 48" className="mx-auto size-12 text-civic" aria-hidden>
              <path d="M14 6h14l10 10v26H14z" fill="var(--civic-tint)" stroke="currentColor" strokeWidth="2" />
              <path d="M28 6v10h10" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M26 36V23m-5 5 5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            </svg>
            <p className="mt-4 text-lg font-semibold">Drag a file here</p>
            <p className="mt-1 text-ink-soft">PDF, Word or text, up to {MAX_MB} MB</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-lg bg-civic px-5 py-2.5 font-semibold text-white hover:bg-civic-deep"
            >
              Choose a file
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) run(f);
                e.target.value = "";
              }}
            />
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-bad-tint px-4 py-3 font-medium text-bad">
              {error}
            </p>
          )}

          <section className="mt-10" aria-labelledby="samples">
            <h2 id="samples" className="text-lg font-bold">
              No file handy? Try a sample
            </h2>
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
              {SAMPLE_DOCUMENTS.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-sm text-ink-soft">{d.type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => run({ name: d.name })}
                    className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-civic hover:text-civic-deep"
                  >
                    Check this sample
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-8 text-sm leading-relaxed text-ink-soft">
            Your file is used only to run this check. Don&apos;t upload documents containing Social Security numbers
            or bank details.
          </p>
        </>
      )}
    </div>
  );
}

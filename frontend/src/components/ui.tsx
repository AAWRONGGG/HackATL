import Link from "next/link";
import type { Citation, Severity } from "@/lib/types";

export function formatDate(iso: string) {
  return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(iso: string) {
  const due = new Date(iso + "T12:00:00").getTime();
  return Math.ceil((due - Date.now()) / 86_400_000);
}

export function CitationTag({ citation }: { citation: Citation }) {
  return (
    <a
      href={citation.sourceUrl}
      target="_blank"
      rel="noreferrer"
      title={`${citation.title} (opens the source)`}
      className="inline-flex items-center gap-1.5 rounded-md border border-civic/30 bg-civic-tint px-2 py-0.5 text-[13px] font-medium text-civic-deep hover:border-civic hover:underline"
    >
      {citation.code}
    </a>
  );
}

const severityStyle: Record<Severity, { label: string; cls: string }> = {
  high: { label: "Fix now", cls: "bg-bad-tint text-bad border-bad/25" },
  medium: { label: "Fix soon", cls: "bg-warn-tint text-warn border-warn/25" },
  low: { label: "Good to fix", cls: "bg-civic-tint text-civic-deep border-civic/20" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = severityStyle[severity];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[13px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link href={href} className={buttonClass(variant)}>
      {children}
    </Link>
  );
}

export function buttonClass(variant: "primary" | "secondary" = "primary") {
  return variant === "primary"
    ? "inline-flex items-center justify-center rounded-lg bg-civic px-5 py-2.5 font-semibold text-white hover:bg-civic-deep disabled:opacity-60"
    : "inline-flex items-center justify-center rounded-lg border border-line bg-surface px-5 py-2.5 font-semibold text-ink hover:border-civic hover:text-civic-deep disabled:opacity-60";
}

export function PageTitle({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-[2.25rem] sm:leading-tight">{title}</h1>
      {intro && <p className="mt-3 text-lg leading-relaxed text-ink-soft">{intro}</p>}
    </div>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <p role="status" className="py-12 text-ink-soft">
      {label}
    </p>
  );
}

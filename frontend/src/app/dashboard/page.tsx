"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CitationTag, Loading, buttonClass, daysUntil, formatDate } from "@/components/ui";
import { getAlerts, getChecklist, getDeadlines, getProfile, setItemStatus } from "@/lib/api";
import { DEMO_PROFILE } from "@/lib/mock";
import type { Alert, BusinessProfile, ChecklistItem, Deadline, Jurisdiction } from "@/lib/types";

const order: Jurisdiction[] = ["City of Atlanta", "State of Georgia", "Federal"];

function ChecklistRow({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  const done = item.status === "done";
  const days = item.dueDate ? daysUntil(item.dueDate) : null;
  return (
    <li className="flex gap-4 border-t border-line py-5 first:border-t-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
        onClick={onToggle}
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors ${
          done ? "border-ok bg-ok text-white" : "border-line bg-surface hover:border-civic"
        }`}
      >
        {done && (
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="2.2" fill="none" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className={`text-[17px] font-semibold ${done ? "text-ink-soft line-through decoration-ink-soft/40" : "text-ink"}`}>
            {item.title}
          </h3>
          {item.dueDate && !done && (
            <span
              className={`text-sm font-semibold ${
                days !== null && days <= 14 ? "text-bad" : "text-ink-soft"
              }`}
            >
              Due {formatDate(item.dueDate)}
              {days !== null && days >= 0 && ` (${days === 0 ? "today" : `${days} days`})`}
              {days !== null && days < 0 && " (overdue)"}
            </span>
          )}
        </div>
        {!done && <p className="mt-1 max-w-2xl leading-relaxed text-ink-soft">{item.summary}</p>}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <CitationTag citation={item.citation} />
          {item.renewal && <span className="text-sm text-ink-soft">{item.renewal}</span>}
          {item.formId && !done && (
            <Link
              href={`/forms?form=${item.formId}`}
              className="text-sm font-semibold text-civic underline-offset-4 hover:underline"
            >
              Fill out the form
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getChecklist(), getDeadlines(), getAlerts()])
      .then(([c, d, a]) => {
        setProfile(getProfile() ?? DEMO_PROFILE);
        setItems(c);
        setDeadlines(d);
        setAlerts(a);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load your checklist."));
  }, []);

  const grouped = useMemo(() => {
    const g = new Map<Jurisdiction, ChecklistItem[]>();
    for (const j of order) g.set(j, []);
    for (const i of items ?? []) g.get(i.jurisdiction)?.push(i);
    return g;
  }, [items]);

  async function toggle(item: ChecklistItem) {
    const status = item.status === "done" ? "todo" : "done";
    setItemStatus(item.id, status);
    setItems((xs) => xs?.map((x) => (x.id === item.id ? { ...x, status } : x)) ?? null);
    setDeadlines(await getDeadlines());
  }

  if (error)
    return (
      <p role="alert" className="rounded-lg bg-bad-tint px-4 py-3 font-medium text-bad">
        {error} Check that the backend is running, or turn demo mode back on.
      </p>
    );
  if (!items || !profile) return <Loading label="Loading your checklist…" />;

  const done = items.filter((i) => i.status === "done").length;
  const pct = Math.round((done / Math.max(items.length, 1)) * 100);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-[2.25rem]">{profile.name}</h1>
          <p className="mt-1 text-ink-soft">
            {profile.city}, Georgia. {profile.employees} employees.{" "}
            <Link href="/onboard" className="font-semibold text-civic underline-offset-4 hover:underline">
              Edit answers
            </Link>
          </p>
        </div>
        <div className="w-full max-w-xs">
          <p className="mb-2 text-sm font-semibold text-ink">
            {done} of {items.length} requirements done
          </p>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Checklist progress"
          >
            <div className="h-full rounded-full bg-ok transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {order.map((j) => {
            const list = grouped.get(j) ?? [];
            if (!list.length) return null;
            return (
              <section key={j} aria-labelledby={`h-${j}`} className="rounded-xl border border-line bg-surface px-5 sm:px-6">
                <h2 id={`h-${j}`} className="flex items-baseline justify-between border-b border-line py-4 text-lg font-bold">
                  {j}
                  <span className="text-sm font-medium text-ink-soft">
                    {list.filter((i) => i.status === "done").length} of {list.length} done
                  </span>
                </h2>
                <ul>
                  {list.map((i) => (
                    <ChecklistRow key={i.id} item={i} onToggle={() => toggle(i)} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <aside className="space-y-8">
          <section aria-labelledby="deadlines">
            <h2 id="deadlines" className="text-lg font-bold">
              Coming up
            </h2>
            {deadlines.length ? (
              <ul className="mt-3 space-y-3">
                {deadlines.slice(0, 4).map((d) => {
                  const days = daysUntil(d.dueDate);
                  return (
                    <li key={d.id} className="flex items-start gap-3">
                      <div className="w-14 shrink-0 rounded-md border border-line bg-surface py-1 text-center">
                        <div className="text-[11px] font-semibold text-ink-soft">
                          {new Date(d.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="text-lg font-bold leading-tight">{new Date(d.dueDate + "T12:00:00").getDate()}</div>
                      </div>
                      <div>
                        <p className="font-semibold leading-snug">{d.title}</p>
                        <p className={`text-sm ${days <= 14 ? "font-semibold text-bad" : "text-ink-soft"}`}>
                          {days < 0 ? "Overdue" : days === 0 ? "Due today" : `In ${days} days`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-ink-soft">No upcoming deadlines. Everything with a due date is done.</p>
            )}
          </section>

          <section aria-labelledby="alerts">
            <h2 id="alerts" className="text-lg font-bold">
              New laws that affect you
            </h2>
            <ul className="mt-3 space-y-3">
              {alerts.map((a) => (
                <li key={a.id} className="rounded-lg border border-peach/60 bg-peach-tint/60 p-4">
                  <p className="text-sm font-semibold text-ink-soft">
                    {a.billNumber}. {a.status}
                  </p>
                  <p className="mt-1 font-semibold leading-snug">{a.title}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{a.whyItMatters}</p>
                  <a
                    href={a.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-civic underline-offset-4 hover:underline"
                  >
                    Read the bill
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-civic-deep p-5 text-white">
            <h2 className="text-lg font-bold">Is your paperwork up to date?</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-white/85">
              Upload a handbook, lease or application and we&apos;ll flag anything that conflicts with current law.
            </p>
            <Link href="/check" className={`${buttonClass("secondary")} mt-4 border-white/0`}>
              Check a document
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loading, PageTitle, buttonClass } from "@/components/ui";
import { fillFormById, getForms } from "@/lib/api";
import type { FillableForm } from "@/lib/types";

function FormsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("form");
  const [forms, setForms] = useState<FillableForm[] | null>(null);
  const [filled, setFilled] = useState<FillableForm | null>(null);
  const filling = !!selectedId && filled?.id !== selectedId;

  useEffect(() => {
    getForms().then(setForms);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fillFormById(selectedId).then((f) => {
      if (!cancelled) setFilled(f);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (!forms) return <Loading label="Loading forms…" />;

  const missing = filled?.fields.filter((f) => !f.value.trim()).length ?? 0;
  const active = selectedId ? filled : null;

  function update(key: string, value: string) {
    setFilled((f) => (f ? { ...f, fields: f.fields.map((x) => (x.key === key ? { ...x, value } : x)) } : f));
  }

  return (
    <div>
      <div className="no-print">
        <PageTitle
          title="Forms"
          intro="Pick a form and we'll fill in everything we already know from your answers. You finish the rest."
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <nav aria-label="Forms" className="no-print">
          <ul className="space-y-2">
            {forms.map((f) => {
              const on = f.id === selectedId;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    aria-current={on ? "true" : undefined}
                    onClick={() => router.replace(`/forms?form=${f.id}`, { scroll: false })}
                    className={`w-full rounded-lg border px-4 py-3 text-left ${
                      on ? "border-civic bg-civic-tint" : "border-line bg-surface hover:border-civic/50"
                    }`}
                  >
                    <span className="block font-semibold text-ink">{f.name}</span>
                    <span className="block text-sm text-ink-soft">{f.agency}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-live="polite">
          {!selectedId && (
            <div className="rounded-xl border border-dashed border-line p-10 text-center text-ink-soft">
              Choose a form on the left to fill it in.
            </div>
          )}
          {selectedId && (filling || !active) && <Loading label="Filling in your form…" />}
          {active && !filling && (
            <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
              <p className="text-sm font-semibold text-ink-soft">{active.agency}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{active.name}</h2>
              <p className="mt-2 text-ink-soft">{active.description}</p>

              <p
                className={`no-print mt-5 rounded-lg px-4 py-3 font-medium ${
                  missing ? "bg-warn-tint text-ink" : "bg-civic-tint text-civic-deep"
                }`}
              >
                {missing
                  ? `${active.fields.length - missing} of ${active.fields.length} fields filled from your answers. Fill in the ${missing} remaining.`
                  : "Every field is filled in. Review it, then print or save it."}
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {active.fields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink">{f.label}</span>
                      {f.fromProfile && <span className="no-print text-xs font-semibold text-ok">From your answers</span>}
                    </span>
                    <input
                      value={f.value}
                      onChange={(e) => update(f.key, e.target.value)}
                      placeholder="Needs your answer"
                      className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 focus:border-civic focus:outline-none ${
                        f.value.trim() ? "border-line bg-surface" : "border-warn/50 bg-warn-tint/50 placeholder:text-warn"
                      }`}
                    />
                  </label>
                ))}
              </div>

              <div className="no-print mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => window.print()} className={buttonClass()}>
                  Print or save as PDF
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function FormsPage() {
  return (
    <Suspense fallback={<Loading label="Loading forms…" />}>
      <FormsInner />
    </Suspense>
  );
}

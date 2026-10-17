"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageTitle, buttonClass } from "@/components/ui";
import { loadDemoProfile, onboard } from "@/lib/api";
import type { BusinessProfile, BusinessType } from "@/lib/types";

const types: { value: BusinessType; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe_bakery", label: "Café or bakery" },
  { value: "food_truck", label: "Food truck" },
  { value: "bar", label: "Bar" },
  { value: "catering", label: "Catering" },
];

const input =
  "mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-soft/60 focus:border-civic focus:outline-none";

function YesNo({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4">
      <legend className="sr-only">{label}</legend>
      <div>
        <p className="font-semibold text-ink">{label}</p>
        <p className="text-sm text-ink-soft">{hint}</p>
      </div>
      <div className="flex rounded-lg border border-line bg-surface p-1">
        {[true, false].map((v) => (
          <label
            key={String(v)}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-civic ${
              value === v ? "bg-civic text-white" : "text-ink-soft"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              name={label}
              checked={value === v}
              onChange={() => onChange(v)}
            />
            {v ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function OnboardPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [p, setP] = useState<BusinessProfile>({
    name: "",
    ownerName: "",
    type: "restaurant",
    city: "Atlanta",
    employees: 0,
    sellsAlcohol: false,
    preparesFood: true,
    hasStorefront: true,
  });
  const set = <K extends keyof BusinessProfile>(k: K, v: BusinessProfile[K]) => setP((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!p.name.trim()) {
      setError("Enter your business name to build your checklist.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onboard(p);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your answers. Try again.");
      setSaving(false);
    }
  }

  function useSample() {
    loadDemoProfile();
    router.push("/dashboard");
  }

  return (
    <div className="max-w-2xl">
      <PageTitle
        title="Tell us about your business"
        intro="We use these answers to work out which licenses, permits and rules apply to you. It takes about a minute."
      />

      <form onSubmit={submit} noValidate className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="font-semibold text-ink">Business name</span>
            <input
              className={input}
              value={p.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (e.target.value.trim()) setError(null);
              }}
              placeholder="Magnolia Kitchen"
              aria-invalid={!!error && !p.name.trim()}
            />
          </label>
          <label className="block">
            <span className="font-semibold text-ink">Your name</span>
            <input
              className={input}
              value={p.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
              placeholder="Dana Brooks"
            />
          </label>
        </div>

        <fieldset>
          <legend className="font-semibold text-ink">What kind of business is it?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {types.map((t) => (
              <label
                key={t.value}
                className={`cursor-pointer rounded-lg border px-4 py-2 font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-civic ${
                  p.type === t.value
                    ? "border-civic bg-civic-tint text-civic-deep"
                    : "border-line bg-surface text-ink-soft hover:border-civic/50"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  className="sr-only"
                  checked={p.type === t.value}
                  onChange={() => set("type", t.value)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="font-semibold text-ink">City</span>
            <select className={input} value={p.city} onChange={(e) => set("city", e.target.value)}>
              <option value="Atlanta">Atlanta</option>
              <option disabled>More Georgia cities coming soon</option>
            </select>
          </label>
          <label className="block">
            <span className="font-semibold text-ink">Number of employees</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className={input}
              value={p.employees}
              onChange={(e) => set("employees", Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
        </div>

        <div className="border-b border-line">
          <YesNo
            label="Do you prepare or serve food?"
            hint="Includes reheating or packaging food for sale."
            value={p.preparesFood}
            onChange={(v) => set("preparesFood", v)}
          />
          <YesNo
            label="Do you sell beer, wine or liquor?"
            hint="On-site or to go."
            value={p.sellsAlcohol}
            onChange={(v) => set("sellsAlcohol", v)}
          />
          <YesNo
            label="Do you have a storefront?"
            hint="A fixed location customers visit."
            value={p.hasStorefront}
            onChange={(v) => set("hasStorefront", v)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-bad-tint px-4 py-3 font-medium text-bad">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={buttonClass()} disabled={saving}>
            {saving ? "Building your checklist…" : "Build my checklist"}
          </button>
          <button type="button" onClick={useSample} className="font-semibold text-civic underline-offset-4 hover:underline">
            Use the sample restaurant instead
          </button>
        </div>
      </form>
    </div>
  );
}

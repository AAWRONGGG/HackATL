import { ButtonLink, CitationTag } from "@/components/ui";

const steps = [
  {
    title: "Tell us about your business",
    body: "Six questions: what you do, where you are, how many people you employ.",
  },
  {
    title: "Get your checklist",
    body: "Every city, state and federal requirement that applies to you, with due dates and the law behind each one.",
  },
  {
    title: "Check your paperwork",
    body: "Upload a handbook, lease or application. We flag what conflicts with current Georgia law and how to fix it.",
  },
];

function DocumentPreview() {
  return (
    <figure
      aria-label="Example: a line in an employee handbook flagged against the law"
      className="relative rounded-xl border border-line bg-surface p-6 shadow-[0_1px_0_var(--line),0_12px_32px_-18px_rgba(23,35,31,.35)]"
    >
      <figcaption className="mb-4 flex items-center justify-between text-sm text-ink-soft">
        <span className="font-semibold text-ink">Employee handbook.pdf</span>
        <span>Page 4 of 18</span>
      </figcaption>
      <div className="space-y-3 text-[15px] leading-7 text-ink-soft">
        <p>
          <strong className="text-ink">3.2 Pay.</strong> Team members are paid every other Friday by direct
          deposit.
        </p>
        <p>
          <mark className="rounded bg-peach-tint px-1 py-0.5 text-ink underline decoration-peach decoration-2 underline-offset-4">
            Hourly team members start at $5.15 per hour.
          </mark>{" "}
          Raises are reviewed after 90 days.
        </p>
        <p className="opacity-60">3.3 Tips. Tips are pooled and split among front-of-house staff at the end of each shift.</p>
      </div>
      <div className="mt-5 rounded-lg border-l-4 border-bad bg-bad-tint/60 p-4">
        <p className="font-semibold text-ink">Starting wage is below the federal minimum</p>
        <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">
          Most restaurants must pay at least $7.25 per hour. Update this line.
        </p>
        <div className="mt-3">
          <CitationTag
            citation={{
              code: "29 U.S.C. § 206",
              title: "Federal minimum wage",
              sourceUrl: "https://www.law.cornell.edu/uscode/text/29/206",
            }}
          />
        </div>
      </div>
    </figure>
  );
}

export default function Home() {
  return (
    <div className="space-y-20 pb-6">
      <section className="grid items-center gap-12 pt-4 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            The permits, licenses and rules your Georgia business needs, in plain English.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            Get a checklist built for your business, then upload your documents to see what&apos;s out of date,
            with a link to the exact law behind every flag.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/onboard">Get my checklist</ButtonLink>
            <ButtonLink href="/check" variant="secondary">
              Check a document
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-ink-soft">Free. No account needed for the demo. Atlanta restaurants first.</p>
        </div>
        <DocumentPreview />
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="text-2xl font-bold tracking-tight">
          How it works
        </h2>
        <ol className="mt-6 grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="border-t-2 border-civic pt-4">
              <span className="text-sm font-semibold text-civic">Step {i + 1}</span>
              <h3 className="mt-1 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl bg-civic-deep px-6 py-10 text-white sm:px-10">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight">Built from Georgia law, not guesswork</h2>
          <p className="mt-3 leading-relaxed text-white/85">
            Every item comes from the Official Code of Georgia, the Rules and Regulations of the State of Georgia,
            or Atlanta&apos;s ordinances. When the General Assembly takes up a bill that affects you, you&apos;ll see
            it on your checklist.
          </p>
        </div>
      </section>
    </div>
  );
}

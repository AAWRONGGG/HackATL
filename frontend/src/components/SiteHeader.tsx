"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { USE_MOCK } from "@/lib/api";

const links = [
  { href: "/dashboard", label: "Checklist" },
  { href: "/check", label: "Check a document" },
  { href: "/forms", label: "Forms" },
];

export function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="18" r="12" fill="var(--peach)" />
      <path d="M16 6c0 6 0 18 0 24" stroke="#e48a5f" strokeWidth="1.5" fill="none" opacity=".55" />
      <path d="M16 7c3-5 9-5 11-3-3 4-7 5-11 3Z" fill="var(--civic)" />
    </svg>
  );
}

function ActiveNav() {
  return <NavLinks path={usePathname()} />;
}

function NavLinks({ path }: { path: string }) {
  return (
    <nav aria-label="Main" className="flex flex-wrap gap-1 text-[15px]">
      {links.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 font-medium ${
              active ? "bg-civic-tint text-civic-deep" : "text-ink-soft hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="no-print border-b border-line bg-surface">
      {USE_MOCK && (
        <div className="bg-civic-deep px-4 py-1.5 text-center text-[13px] text-white/90">
          Demo mode: showing sample data. Set NEXT_PUBLIC_USE_MOCK=false to use the live API.
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
          <Logo />
          PeachPermit
        </Link>
        <Suspense fallback={<NavLinks path="" />}>
          <ActiveNav />
        </Suspense>
      </div>
    </header>
  );
}

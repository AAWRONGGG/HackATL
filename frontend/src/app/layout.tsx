import type { Metadata } from "next";
import "@fontsource-variable/public-sans";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "PeachPermit",
  description:
    "Know which licenses, permits and rules apply to your Georgia small business, and check your documents against current law.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>
        <footer className="no-print border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm leading-relaxed text-ink-soft sm:px-6">
            PeachPermit explains rules in plain language and links to the official source for each one.
            It isn&apos;t legal advice. For anything flagged &ldquo;ask an attorney&rdquo;, talk to a licensed
            Georgia attorney before acting.
          </div>
        </footer>
      </body>
    </html>
  );
}

import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";
import { LegalFooter } from "./LegalFooter";
import { OPERATOR, POLICY_UPDATED } from "@/lib/policies";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6 sm:px-6">
        <Link to="/"><Logo /></Link>
        <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-6 sm:px-6">
        <article className="rounded-[2rem] border bg-card p-6 shadow-soft sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-deep">Last updated {POLICY_UPDATED}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{intro}</p>
          <div className="mt-8 space-y-8">{children}</div>
          <Section title="Who we are">
            <p>
              {OPERATOR.tradingName} is operated by {OPERATOR.ownerName}, {OPERATOR.status}. Address: {OPERATOR.address}.
              Contact: {OPERATOR.email}.
            </p>
          </Section>
        </article>
      </main>
      <LegalFooter />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 space-y-3 text-sm leading-relaxed text-foreground/90 first:mt-0">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

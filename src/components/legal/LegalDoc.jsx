import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { POLICY_UPDATED } from '@/lib/legal';
import OperatorDetails from '@/components/legal/OperatorDetails';

const siblingPolicies = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Refund & Cancellation Policy', href: '/refunds' },
];

export default function LegalDoc({ eyebrow, title, intro, highlight, sections, current }) {
  useEffect(() => {
    if (!window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[210px_1fr] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              On this page
            </p>
            <ul className="mt-4 space-y-2.5 border-l hairline pl-4">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block text-[13px] leading-snug text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Last updated {POLICY_UPDATED}
          </p>
          <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">{intro}</p>

          {highlight && (
            <div className="mt-8 rounded-lg border border-primary/25 bg-primary/[0.05] p-5">
              <p className="text-sm leading-relaxed text-foreground/85">{highlight}</p>
            </div>
          )}

          <OperatorDetails />

          <div className="mt-12 space-y-10">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-[17px] font-medium tracking-tight">
                  {index + 1}. {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/80">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="list-disc space-y-2 pl-5 marker:text-primary/60">
                      {section.bullets.map((bullet) => (
                        <li key={bullet.slice(0, 40)}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-14 border-t hairline pt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Other policies
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {siblingPolicies
                .filter((policy) => policy.href !== current)
                .map((policy) => (
                  <Link
                    key={policy.href}
                    to={policy.href}
                    className="text-sm text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    {policy.label}
                  </Link>
                ))}
              <Link
                to="/app/account"
                className="text-sm text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
              >
                Manage my data
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
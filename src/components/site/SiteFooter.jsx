import { Link } from 'react-router-dom';
import { CREDIT_PACKS, formatCredits } from '@/lib/packs';

export const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Refund & Cancellation Policy', href: '/refunds' },
];

export default function SiteFooter({ compact = false }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t hairline bg-background">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">
                <span className="font-display text-[15px] leading-none">i</span>
              </span>
              <span className="text-[15px] font-medium tracking-tight">InboxHero</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI lead scouting for people who write their own emails. Credits are
              one-time purchases — {formatCredits(CREDIT_PACKS[1].credits)} on Pro.
            </p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { label: 'How it works', href: '/#how-it-works' },
              { label: 'Pricing & checkout', href: '/pricing' },
              { label: 'Workspace', href: '/app' },
            ]}
          />

          <FooterColumn title="Legal" links={LEGAL_LINKS} />

          <FooterColumn
            title="Your data"
            links={[
              { label: 'Account & data settings', href: '/app/account' },
              { label: 'GDPR rights', href: '/privacy#your-rights' },
              { label: 'EU withdrawal waiver', href: '/refunds#withdrawal-right' },
            ]}
          />
        </div>

        {!compact && (
          <div className="mt-12 flex flex-col gap-3 border-t hairline pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>
              © {year} InboxHero. Operated as an online software service. All
              prices shown in EUR.
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]">
              As-is service · Credits delivered instantly
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              to={link.href}
              className="text-sm text-foreground/75 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
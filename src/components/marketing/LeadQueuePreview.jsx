const leads = [
  {
    name: 'Maya Okafor',
    company: 'Okafor Studio',
    score: 94,
    signal: 'Asked about annual pricing twice this week',
    draft: 'Reply drafted · 48 words',
  },
  {
    name: 'Tomás Reyes',
    company: 'Northwind Labs',
    score: 88,
    signal: 'Went quiet for three weeks, then replied',
    draft: 'Reply drafted · 61 words',
  },
  {
    name: 'Priya Raman',
    company: 'Loom & Ledger',
    score: 81,
    signal: 'Forwarded your deck to their CTO',
    draft: 'Reply drafted · 39 words',
  },
];

export default function LeadQueuePreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-xl border hairline bg-card shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between border-b hairline px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Scout queue
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            5 scored · live
          </p>
        </div>

        <ul className="divide-y hairline">
          {leads.map((lead) => (
            <li key={lead.name} className="group px-4 py-4 transition-colors hover:bg-secondary/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium tracking-tight">
                    {lead.name}
                    <span className="ml-1.5 text-muted-foreground">· {lead.company}</span>
                  </p>
                  <p className="mt-1 truncate text-[13px] leading-snug text-muted-foreground">
                    {lead.signal}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-primary/25 bg-primary/8 px-2 py-1 font-mono text-[11px] text-primary">
                  {lead.score}
                </span>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
                {lead.draft}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t hairline bg-secondary/50 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Run cost · 5 scrapes
          </p>
          <span className="rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background">
            Send all
          </span>
        </div>
      </div>
    </div>
  );
}
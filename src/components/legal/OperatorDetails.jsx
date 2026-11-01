import { OPERATOR, OPERATOR_INCOMPLETE } from '@/lib/legal';

const rows = [
  { label: 'Registered name', value: OPERATOR.legalName },
  { label: 'Registered address', value: OPERATOR.address },
  { label: 'Support', value: OPERATOR.supportEmail, email: true },
];

export default function OperatorDetails() {
  return (
    <div className="mt-10 rounded-lg border hairline bg-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Operator details
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-[150px_1fr] sm:gap-x-6">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-[13px] text-muted-foreground">{row.label}</dt>
            <dd className="text-[13px] leading-relaxed text-foreground/85">
              {row.email && !row.value.includes('[') ? (
                <a
                  href={`mailto:${row.value}`}
                  className="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      {OPERATOR_INCOMPLETE && (
        <p className="mt-4 text-xs leading-relaxed text-primary">
          Placeholder — replace these with your registered company details before publishing.
        </p>
      )}
    </div>
  );
}
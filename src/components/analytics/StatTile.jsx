export default function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-lg border hairline bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl leading-none tracking-tight">{value}</p>
      {hint && <p className="mt-2 text-[12px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}
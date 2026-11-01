import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { LEADS_PER_RUN, SCRAPE_COST_PER_LEAD, MAX_BRIEFS } from '@/lib/packs';

const EXAMPLE_BRIEF =
  'Founders of 5–40 person design studios in the UK and Ireland who sell retainers and have recently been hiring their first account manager.';

export default function ScoutForm({ onSubmit, busy, scrapes }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const briefs = text
    .split(/\n\s*\n/)
    .map((brief) => brief.trim())
    .filter(Boolean);
  const runs = Math.min(briefs.length, MAX_BRIEFS);
  const scrapesNeeded = runs * LEADS_PER_RUN * SCRAPE_COST_PER_LEAD;
  const affordable = scrapesNeeded > 0 && scrapes >= scrapesNeeded;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (briefs.length === 0) {
      setError('Give the engine a little more to work with — who are you trying to reach?');
      return;
    }
    if (briefs.some((brief) => brief.length < 12)) {
      setError('Every brief needs at least 12 characters.');
      return;
    }
    if (briefs.length > MAX_BRIEFS) {
      setError(`Up to ${MAX_BRIEFS} briefs per bulk run.`);
      return;
    }
    setError('');
    const message = await onSubmit(briefs);
    if (message) setError(message);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border hairline bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          New scouting run
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {runs > 0 ? `${runs} brief${runs > 1 ? 's' : ''} · ${scrapesNeeded} scrapes` : `${LEADS_PER_RUN} customers per brief`}
        </p>
      </div>

      <label htmlFor="brief" className="mt-5 block text-[15px] font-medium tracking-tight">
        Who are you looking for?
      </label>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        One paragraph per buyer. Separate briefs with a blank line to scout them in bulk.
      </p>

      <textarea
        id="brief"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        maxLength={6000}
        placeholder={EXAMPLE_BRIEF}
        className="mt-4 w-full resize-none rounded-lg border hairline bg-background/70 p-4 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setText(EXAMPLE_BRIEF)}
          className="self-start font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
        >
          Use example brief
        </button>

        <button
          type="submit"
          disabled={busy || !affordable}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-foreground/25 disabled:text-background/60"
        >
          <Sparkles className="h-4 w-4" />
          {busy
            ? 'Scouting…'
            : affordable
              ? `Scout ${runs * LEADS_PER_RUN} customers · ${scrapesNeeded} scrape${scrapesNeeded === 1 ? '' : 's'}`
              : scrapesNeeded > 0
                ? 'Not enough scrapes'
                : 'Add a brief to scout'}
        </button>
      </div>

      {scrapesNeeded > 0 && !affordable && (
        <p className="mt-3 text-[12px] text-destructive">
          This run needs {scrapesNeeded} customer scrapes and you have {scrapes}. Top up to keep
          scouting.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
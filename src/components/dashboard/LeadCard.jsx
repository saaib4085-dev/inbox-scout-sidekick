import { useState } from 'react';
import { Check, Copy, ChevronDown, Sparkles, Mail } from 'lucide-react';
import { COST_SAMPLE_DRAFT } from '@/lib/packs';

export default function LeadCard({ lead, onStatusChange, onRegenerate }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState('');

  let sourceHost = '';
  try {
    sourceHost = new URL(lead.source_url).hostname.replace(/^www\./, '');
  } catch {
    sourceHost = '';
  }

  const contactLine = [lead.name !== lead.company ? lead.name : '', lead.role]
    .filter(Boolean)
    .join(' · ');

  const copyDraft = async () => {
    await navigator.clipboard.writeText(`Subject: ${lead.draft_subject}\n\n${lead.draft_body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(lead.email);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 1800);
  };

  const regenerate = async () => {
    if (drafting || !onRegenerate) return;
    setDrafting(true);
    setError('');
    const message = await onRegenerate(lead.id);
    if (message) setError(message);
    setDrafting(false);
  };

  return (
    <li className="rounded-lg border hairline bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium tracking-tight">
            {lead.company || lead.name}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {contactLine || 'Company'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-primary/25 bg-primary/[0.07] px-2 py-1 font-mono text-[11px] text-primary">
            {lead.intent_score}
          </span>
          {lead.status === 'contacted' || lead.status === 'qualified' ? (
            <span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {lead.status}
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">{lead.signal}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {lead.email ? (
          <button
            type="button"
            onClick={copyEmail}
            title="Copy this address"
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-mono text-[11px]">{lead.email}</span>
            {emailCopied ? <Check className="h-3 w-3 shrink-0" /> : <Copy className="h-3 w-3 shrink-0" />}
          </button>
        ) : (
          <span className="rounded-full bg-secondary px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
            No email published
          </span>
        )}
        {sourceHost && (
          <a
            href={lead.source_url}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Scraped from {sourceHost}
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-4 flex w-full items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-left transition-colors hover:bg-secondary"
      >
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {lead.draft_subject || 'Draft reply'}
        </span>
        <ChevronDown
          className={
            open
              ? 'h-3.5 w-3.5 shrink-0 rotate-180 text-muted-foreground transition-transform'
              : 'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform'
          }
        />
      </button>

      {open && (
        <div className="mt-3 rounded-md border hairline bg-background/60 p-4">
          <p className="text-[13px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
            {lead.draft_body}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyDraft}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3 text-[12px] font-medium text-background transition-opacity hover:opacity-85"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy reply'}
            </button>
            <button
              type="button"
              onClick={regenerate}
              disabled={drafting}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border hairline px-3 text-[12px] text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {drafting ? 'Writing…' : `New draft · ${COST_SAMPLE_DRAFT} credits`}
            </button>
            {lead.status === 'new' && (
              <button
                type="button"
                onClick={() => onStatusChange(lead.id, 'contacted')}
                className="inline-flex h-8 items-center rounded-full border hairline px-3 text-[12px] text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                Mark contacted
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-[11px] leading-relaxed text-destructive">{error}</p>}
        </div>
      )}
    </li>
  );
}
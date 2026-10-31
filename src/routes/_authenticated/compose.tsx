import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Check, Copy, Inbox, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateDrafts, refineDraft, type DraftOption } from "@/lib/ai.functions";
import { CREDIT_COSTS } from "@/lib/credits";
import { useLeads, useProfile } from "@/hooks/use-app-data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/compose")({
  validateSearch: z.object({ lead: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Compose — InboxHero" },
      { name: "description", content: "Paste an email, pick a tone, and get three polished AI replies." },
      { property: "og:title", content: "Compose — InboxHero" },
      { property: "og:description", content: "Three AI reply drafts in seconds." },
    ],
  }),
  component: ComposePage,
});

const TONES = ["Polite / Formal", "Assertive / Sales", "Friendly / Casual", "De-escalate / Apology", "Custom Voice"];
const STRATEGIES = ["Accept & Schedule", "Polite Decline", "Ask for Clarification", "Send Quote / Pricing", "Custom Prompt"];
const OUTREACH_STRATEGIES = ["Offer a website build", "Book a short intro call", "Share a quick audit", "Custom Prompt"];
const REFINES = ["shorten", "more formal", "friendlier", "add call to action"] as const;

function ComposePage() {
  const search = Route.useSearch();
  const leads = useLeads();
  const profile = useProfile();
  const qc = useQueryClient();
  const gen = useServerFn(generateDrafts);
  const refine = useServerFn(refineDraft);

  const [mode, setMode] = useState<"reply" | "outreach">(search.lead ? "outreach" : "reply");
  const [leadId, setLeadId] = useState<string | undefined>(search.lead);
  const [incoming, setIncoming] = useState("");
  const [sender, setSender] = useState("");
  const [details, setDetails] = useState("");
  const [tone, setTone] = useState<string>(TONES[0]!);
  const [strategy, setStrategy] = useState<string>(STRATEGIES[0]!);
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<DraftOption[]>([]);
  const [active, setActive] = useState(0);
  const [refining, setRefining] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    if (search.lead) {
      setMode("outreach");
      setLeadId(search.lead);
      setStrategy(OUTREACH_STRATEGIES[0]!);
    }
  }, [search.lead]);

  const lead = leads.data?.find((l) => l.id === leadId);
  useEffect(() => {
    if (mode === "outreach" && lead?.email) setRecipient(lead.email);
  }, [lead?.email, mode]);

  async function run() {
    setBusy(true);
    try {
      const res = await gen({
        data: {
          mode,
          incomingEmail: incoming,
          sender,
          details,
          tone: tone === "Custom Voice" ? `custom voice: ${profile.data?.brand_voice || "my brand voice"}` : tone,
          strategy: strategy === "Custom Prompt" ? customPrompt || "custom" : strategy,
          leadId: mode === "outreach" ? leadId : undefined,
        },
      });
      if (res) {
        setDrafts(res.drafts);
        setActive(0);
        toast.success(`3 drafts ready · ${CREDIT_COSTS.emailGeneration} credits used`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["ledger"] });
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    }
  }

  async function doRefine(i: number, action: (typeof REFINES)[number]) {
    setRefining(`${i}-${action}`);
    try {
      const d = drafts[i];
      if (!d) return;
      const res = await refine({ data: { subject: d.subject, body: d.body, action } });
      if (res) setDrafts(drafts.map((x, j) => (j === i ? { ...x, ...res } : x)));
      toast.success("Draft refined");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRefining(null);
      qc.invalidateQueries({ queryKey: ["wallet"] });
    }
  }

  async function toOutbox(d: DraftOption) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("outbox").insert({
      user_id: u.user.id,
      lead_id: mode === "outreach" ? leadId ?? null : null,
      to_email: recipient,
      subject: d.subject,
      body: d.body,
    });
    if (error) { toast.error("Could not add to outbox"); return; }
    qc.invalidateQueries({ queryKey: ["outbox"] });
    toast.success("Added to outbox for review", {
      action: { label: "Open outbox", onClick: () => (window.location.href = "/outbox") },
    });
  }

  const strategies = mode === "outreach" ? OUTREACH_STRATEGIES : STRATEGIES;

  return (
    <div>
      <PageHeader title="Compose" subtitle={`Each generation returns 3 distinct options for ${CREDIT_COSTS.emailGeneration} credits.`} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="rounded-[1.75rem] border bg-card p-6 shadow-soft">
          <div className="mb-5 inline-flex rounded-full bg-muted p-1">
            {(["reply", "outreach"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setStrategy((m === "outreach" ? OUTREACH_STRATEGIES[0] : STRATEGIES[0])!);
                }}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground",
                )}
              >
                {m === "reply" ? "Smart reply" : "Lead outreach"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "reply" ? (
              <>
                <div className="space-y-1.5">
                  <Label>Incoming email</Label>
                  <Textarea
                    rows={8}
                    className="rounded-2xl"
                    placeholder="Paste the email you received…"
                    value={incoming}
                    onChange={(e) => setIncoming(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sender name / company</Label>
                  <Input className="rounded-xl" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="e.g. Sarah at Acme Ltd" />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label>Lead</Label>
                {leads.data?.length ? (
                  <Select value={leadId ?? ""} onValueChange={setLeadId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose a lead" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 rounded-2xl">
                      {leads.data.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} {l.city ? `· ${l.city}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                    No leads yet. <Link to="/leads" className="font-semibold text-primary-deep">Add or find leads</Link>.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Key details to include</Label>
              <Input className="rounded-xl" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. Available Tuesday 2pm, price €450" />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      tone === t ? "border-primary bg-primary-soft font-semibold text-primary-deep" : "hover:bg-muted",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Response strategy</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {strategies.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {strategy === "Custom Prompt" && (
                <Input className="mt-2 rounded-xl" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Describe what the reply should do" />
              )}
            </div>
            <Button onClick={run} disabled={busy || (mode === "outreach" && !leadId)} className="h-12 w-full rounded-full bg-gradient-primary text-base shadow-lift">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {busy ? "Writing your drafts…" : `Generate 3 drafts · ${CREDIT_COSTS.emailGeneration} credits`}
            </Button>
          </div>
        </section>

        <section className="min-w-0">
          {drafts.length === 0 ? (
            <div className="grid h-full min-h-[420px] place-items-center rounded-[1.75rem] border border-dashed bg-card/60 p-8 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary-soft text-primary-deep">
                  {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <Wand2 className="h-7 w-7" />}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{busy ? "Crafting three options…" : "Your drafts appear here"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Direct & concise · Warm & relationship-focused · Strategic & detailed</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {drafts.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setActive(i)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      active === i ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Option {i + 1}: {d.type}
                  </button>
                ))}
              </div>
              {drafts.map((d, i) =>
                i !== active ? null : (
                  <article key={d.id} className="rounded-[1.75rem] border bg-card p-6 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-deep">{d.type}</p>
                    <Input
                      className="mt-2 rounded-xl text-base font-semibold"
                      value={d.subject}
                      onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)))}
                    />
                    <Textarea
                      rows={12}
                      className="mt-3 rounded-2xl leading-relaxed"
                      value={d.body}
                      onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      {REFINES.map((r) => (
                        <button
                          key={r}
                          disabled={!!refining}
                          onClick={() => doRefine(i, r)}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize hover:bg-primary-soft hover:text-primary-deep disabled:opacity-50"
                        >
                          {refining === `${i}-${r}` && <Loader2 className="h-3 w-3 animate-spin" />} {r}
                        </button>
                      ))}
                      <span className="self-center text-xs text-muted-foreground">({CREDIT_COSTS.aiQuestion} credits each)</span>
                    </div>
                    <div className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <Input className="rounded-full" placeholder="Recipient email" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
                      <CopyButton text={`Subject: ${d.subject}\n\n${d.body}`} />
                      <Button className="rounded-full" onClick={() => toOutbox(d)}>
                        <Inbox className="h-4 w-4" /> Add to outbox
                      </Button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="outline"
      className="rounded-full"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy
    </Button>
  );
}

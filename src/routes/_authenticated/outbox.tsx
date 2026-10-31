import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MailboxConnections, PROVIDER_LABEL, useMailboxStatus, type MailProvider } from "@/components/app/MailboxConnections";
import { useOutbox } from "@/hooks/use-app-data";
import { supabase } from "@/integrations/supabase/client";
import { sendOutboxEmail } from "@/lib/mail.functions";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/outbox")({
  head: () => ({
    meta: [
      { title: "Outbox — InboxHero" },
      { name: "description", content: "Review every email individually before it's sent from your own mailbox." },
      { property: "og:title", content: "Outbox — InboxHero" },
      { property: "og:description", content: "Review and send emails one by one." },
    ],
  }),
  component: OutboxPage,
});

function OutboxPage() {
  const outbox = useOutbox();
  const pending = (outbox.data ?? []).filter((o) => o.status !== "sent");
  const sent = (outbox.data ?? []).filter((o) => o.status === "sent");
  return (
    <div>
      <PageHeader title="Outbox" subtitle="Nothing sends automatically — review and send each email yourself." />
      <section className="mb-6 rounded-[1.75rem] border bg-card p-5 shadow-soft">
        <h2 className="mb-3 font-semibold">Your mailboxes</h2>
        <MailboxConnections />
      </section>
      <Tabs defaultValue="review">
        <TabsList className="rounded-full bg-card p-1 shadow-soft">
          <TabsTrigger value="review" className="rounded-full px-4">Needs review ({pending.length})</TabsTrigger>
          <TabsTrigger value="sent" className="rounded-full px-4">Sent ({sent.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="review" className="mt-5 space-y-4">
          {pending.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed bg-card/60 p-10 text-center text-sm text-muted-foreground">
              Nothing to review. Generate drafts in <Link to="/compose" className="font-semibold text-primary-deep">Compose</Link> and add them here.
            </div>
          ) : (
            pending.map((o) => <ReviewCard key={o.id} row={o} />)
          )}
        </TabsContent>
        <TabsContent value="sent" className="mt-5 space-y-3">
          {sent.map((o) => (
            <div key={o.id} className="flex items-center gap-3 rounded-3xl border bg-card p-4 shadow-soft">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{o.subject}</p>
                <p className="truncate text-xs text-muted-foreground">
                  To {o.to_email} · via {o.provider ? PROVIDER_LABEL[o.provider as MailProvider] : "mailbox"} ·{" "}
                  {o.sent_at ? format(new Date(o.sent_at), "d MMM, HH:mm") : ""}
                </p>
              </div>
            </div>
          ))}
          {sent.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No sent emails yet.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewCard({ row }: { row: Tables<"outbox"> }) {
  const qc = useQueryClient();
  const status = useMailboxStatus();
  const send = useServerFn(sendOutboxEmail);
  const connected = (Object.keys(PROVIDER_LABEL) as MailProvider[]).filter((p) => status.data?.[p]?.connected);
  const [to, setTo] = useState(row.to_email);
  const [subject, setSubject] = useState(row.subject);
  const [body, setBody] = useState(row.body);
  const [reviewed, setReviewed] = useState(false);
  const [provider, setProvider] = useState<MailProvider | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const chosen = provider ?? connected[0];

  async function doSend() {
    if (!chosen) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("outbox")
        .update({ to_email: to, subject, body, status: "pending_review" })
        .eq("id", row.id);
      if (error) throw new Error("Couldn't save your edits");
      const r = await send({ data: { id: row.id, provider: chosen, confirmReviewed: true } });
      if (r && "reconnectRequired" in r && r.reconnectRequired) {
        toast.error(`Your ${PROVIDER_LABEL[chosen]} access needs to be renewed — reconnect it above.`);
      } else toast.success("Email sent");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ["outbox"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    }
  }

  async function remove() {
    await supabase.from("outbox").delete().eq("id", row.id);
    qc.invalidateQueries({ queryKey: ["outbox"] });
  }

  return (
    <article className="rounded-[1.75rem] border bg-card p-5 shadow-soft">
      {row.status === "failed" && <p className="mb-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{row.error ?? "Last send failed"}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <Input className="rounded-full" placeholder="Recipient email" value={to} onChange={(e) => { setTo(e.target.value); setReviewed(false); }} />
        <Input className="rounded-full font-semibold" value={subject} onChange={(e) => { setSubject(e.target.value); setReviewed(false); }} />
      </div>
      <Textarea rows={8} className="mt-3 rounded-2xl" value={body} onChange={(e) => { setBody(e.target.value); setReviewed(false); }} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={reviewed} onCheckedChange={(v) => setReviewed(v === true)} />
          I've reviewed this email
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {connected.length > 1 && (
            <Select value={chosen} onValueChange={(v) => setProvider(v as MailProvider)}>
              <SelectTrigger className="h-9 w-32 rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                {connected.map((p) => <SelectItem key={p} value={p}>{PROVIDER_LABEL[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="sm" className="rounded-full" onClick={remove}><Trash2 className="h-4 w-4" /> Discard</Button>
          <Button className="rounded-full" disabled={!reviewed || !chosen || busy} onClick={doSend}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {chosen ? `Send via ${PROVIDER_LABEL[chosen]}` : "Connect a mailbox to send"}
          </Button>
        </div>
      </div>
    </article>
  );
}

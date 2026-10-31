import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { MailboxConnections } from "@/components/app/MailboxConnections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/use-app-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — InboxHero" },
      { name: "description", content: "Your signature, brand voice and connected mailboxes." },
      { property: "og:title", content: "Settings — InboxHero" },
      { property: "og:description", content: "Signature, brand voice and mailboxes." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const profile = useProfile();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [signature, setSignature] = useState("");
  const [voice, setVoice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.display_name ?? "");
      setSignature(profile.data.signature);
      setVoice(profile.data.brand_voice);
    }
  }, [profile.data]);

  async function save() {
    if (!profile.data) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name, signature, brand_voice: voice, updated_at: new Date().toISOString() })
      .eq("id", profile.data.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Settings saved");
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="These details are added to every AI request." />
      <section className="space-y-5 rounded-[1.75rem] border bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label>Display name</Label>
          <Input className="rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Personal signature</Label>
          <Textarea rows={4} className="rounded-2xl" placeholder={"Jane Doe\nFounder, Studio North\ncalendly.com/jane"} value={signature} onChange={(e) => setSignature(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Brand voice context</Label>
          <Textarea
            rows={4}
            className="rounded-2xl"
            placeholder="e.g. Keep replies under 150 words, use British English spelling, and sign off with 'Kind regards'."
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
          />
        </div>
        <Button className="rounded-full" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
      </section>
      <section className="mt-6 rounded-[1.75rem] border bg-card p-6 shadow-soft">
        <h2 className="mb-1 font-semibold">Connected mailboxes</h2>
        <p className="mb-4 text-sm text-muted-foreground">Connect your own Gmail or Outlook. Every email still needs your review before it sends.</p>
        <MailboxConnections />
      </section>
    </div>
  );
}

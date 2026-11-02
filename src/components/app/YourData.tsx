import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteMyAccount, exportMyData } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

export function YourData() {
  const exportFn = useServerFn(exportMyData);
  const deleteFn = useServerFn(deleteMyAccount);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function download() {
    setExporting(true);
    try {
      const json = await exportFn();
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `inboxhero-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await deleteFn({ data: { confirm: "DELETE" } });
      await supabase.auth.signOut();
      qc.clear();
      toast.success("Your account and data have been deleted.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
      setDeleting(false);
    }
  }

  return (
    <section className="mt-6 rounded-[1.75rem] border bg-card p-6 shadow-soft">
      <h2 className="mb-1 font-semibold">Your data</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Under GDPR you can get a copy of everything we store about you, or delete your account. See our{" "}
        <Link to="/privacy" className="font-semibold text-primary-deep">Privacy Policy</Link>.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="rounded-full" onClick={download} disabled={exporting}>
          <Download className="h-4 w-4" /> {exporting ? "Preparing…" : "Download my data"}
        </Button>
        <Button variant="outline" className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setOpen(true)}>
          <Trash2 className="h-4 w-4" /> Delete account
        </Button>
      </div>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); setTyped(""); }}>
        <DialogContent className="max-w-md rounded-[1.75rem]">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This cancels any subscription and permanently deletes your drafts, leads, outbox, mailbox connections and
              remaining credits. Basic payment records are kept for 6 years as tax law requires. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <Input className="rounded-xl" placeholder="Type DELETE to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} />
          <Button variant="destructive" className="h-11 rounded-full" disabled={typed !== "DELETE" || deleting} onClick={remove}>
            {deleting ? "Deleting…" : "Permanently delete my account"}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

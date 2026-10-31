import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Papa from "papaparse";
import { FileUp, Loader2, MapPin, PenLine, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeads } from "@/hooks/use-app-data";
import { supabase } from "@/integrations/supabase/client";
import { searchLeads } from "@/lib/leads.functions";
import { CREDIT_COSTS } from "@/lib/credits";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Leads — InboxHero" },
      { name: "description", content: "Find local businesses without websites, import lists and add contacts." },
      { property: "og:title", content: "Leads — InboxHero" },
      { property: "og:description", content: "Lead search, CSV import and manual contacts." },
    ],
  }),
  component: LeadsPage,
});

const STATUS_STYLE: Record<string, string> = {
  new: "bg-primary-soft text-primary-deep",
  drafted: "bg-muted text-foreground",
  sent: "bg-success-soft text-success",
};

function LeadsPage() {
  const leads = useLeads();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["leads"] });

  async function remove(id: string) {
    await supabase.from("leads").delete().eq("id", id);
    refresh();
  }

  const rows = (leads.data ?? []).filter((l) =>
    `${l.name} ${l.city} ${l.category} ${l.email}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div>
      <PageHeader title="Leads" subtitle="Find, import or add contacts — then write outreach for each one." />
      <Tabs defaultValue="search" className="space-y-5">
        <TabsList className="h-auto flex-wrap rounded-full bg-card p-1 shadow-soft">
          <TabsTrigger value="search" className="rounded-full px-4 py-2"><Search className="mr-1.5 h-4 w-4" />Find businesses</TabsTrigger>
          <TabsTrigger value="csv" className="rounded-full px-4 py-2"><FileUp className="mr-1.5 h-4 w-4" />Import CSV</TabsTrigger>
          <TabsTrigger value="manual" className="rounded-full px-4 py-2"><Plus className="mr-1.5 h-4 w-4" />Add manually</TabsTrigger>
        </TabsList>
        <TabsContent value="search"><SearchPanel onDone={refresh} /></TabsContent>
        <TabsContent value="csv"><CsvPanel onDone={refresh} /></TabsContent>
        <TabsContent value="manual"><ManualPanel onDone={refresh} /></TabsContent>
      </Tabs>

      <section className="mt-6 rounded-[1.75rem] border bg-card p-5 shadow-soft">
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="truncate text-lg font-semibold">Your leads ({leads.data?.length ?? 0})</h2>
          <Input className="w-44 rounded-full sm:w-64" placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        {leads.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No leads yet — search, import, or add one above.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((l) => (
              <div key={l.id} className="rounded-3xl border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{[l.category, l.city].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[l.status] ?? ""}`}>{l.status}</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p className="truncate">{l.email || "No email yet"}{l.phone ? ` · ${l.phone}` : ""}</p>
                  {l.address && <p className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{l.address}</p>}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button asChild size="sm" className="rounded-full">
                    <Link to="/compose" search={{ lead: l.id }}><PenLine className="h-3.5 w-3.5" /> Write outreach</Link>
                  </Button>
                  <span className="text-[11px] text-muted-foreground">via {l.source}</span>
                  <button onClick={() => remove(l.id)} aria-label="Delete lead" className="ml-auto grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[1.75rem] border bg-card p-6 shadow-soft">{children}</div>;
}

function SearchPanel({ onDone }: { onDone: () => void }) {
  const search = useServerFn(searchLeads);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState(20);
  const [busy, setBusy] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await search({ data: { query, location, limit } });
      if (r) toast.success(`Saved ${r.saved} businesses without a website (${r.skippedWithWebsite} skipped that already have one)`);
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["ledger"] });
    }
  }

  return (
    <Panel>
      <form onSubmit={run} className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_120px_auto] md:items-end">
        <div className="space-y-1.5">
          <Label>Business type</Label>
          <Input required className="rounded-xl" placeholder="e.g. plumbers, hair salons" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input required className="rounded-xl" placeholder="e.g. Dublin, Ireland" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Max results</Label>
          <Input type="number" min={5} max={50} className="rounded-xl" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
        </div>
        <Button type="submit" disabled={busy} className="h-10 rounded-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {busy ? "Searching… (up to a few minutes)" : `Search · ${CREDIT_COSTS.leadScrape} credits`}
        </Button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Listings that already have a website are filtered out automatically. If the search fails, your credits are restored.</p>
    </Panel>
  );
}

function CsvPanel({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function handle(file: File) {
    setBusy(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        const pick = (r: Record<string, string>, keys: string[]) => {
          const k = Object.keys(r).find((h) => keys.includes(h.trim().toLowerCase()));
          return k ? String(r[k] ?? "").trim() : "";
        };
        const all = res.data.map((r) => ({
          user_id: u.user!.id,
          name: pick(r, ["name", "business", "business name", "company", "title"]) || pick(r, ["email"]) || "Unnamed",
          email: pick(r, ["email", "e-mail", "email address"]),
          phone: pick(r, ["phone", "phone number", "telephone"]),
          company: pick(r, ["company", "business", "business name"]),
          category: pick(r, ["category", "industry", "type"]),
          city: pick(r, ["city", "town", "location"]),
          address: pick(r, ["address", "street"]),
          notes: pick(r, ["notes", "note"]),
          website: pick(r, ["website", "url", "site", "web"]),
          source: "csv",
        }));
        const keep = all.filter((r) => !r.website).map(({ website: _w, ...rest }) => rest).slice(0, 2000);
        if (keep.length) {
          const { error } = await supabase.from("leads").insert(keep);
          if (error) toast.error("Import failed: " + error.message);
          else toast.success(`Imported ${keep.length} leads (${all.length - keep.length} skipped with a website)`);
        } else toast.info("No rows to import — every row had a website or the file was empty.");
        setBusy(false);
        onDone();
      },
      error: () => {
        toast.error("Couldn't read that file");
        setBusy(false);
      },
    });
  }
  return (
    <Panel>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed p-10 text-center transition hover:border-primary hover:bg-primary-soft/40">
        {busy ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : <FileUp className="h-7 w-7 text-primary" />}
        <span className="font-semibold">{busy ? "Importing…" : "Drop or choose a CSV file"}</span>
        <span className="text-xs text-muted-foreground">Columns: name, email, phone, company, category, city, address, notes, website. Free — no credits used.</span>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
      </label>
    </Panel>
  );
}

function ManualPanel({ onDone }: { onDone: () => void }) {
  const empty = { name: "", email: "", phone: "", company: "", category: "", city: "", notes: "" };
  const [f, setF] = useState(empty);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("leads").insert({ ...f, user_id: u.user.id, source: "manual" });
    if (error) { toast.error(error.message); return; }
    toast.success("Contact added");
    setF(empty);
    onDone();
  }
  const field = (k: keyof typeof f, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} required={k === "name"} className="rounded-xl" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </div>
  );
  return (
    <Panel>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-3">
        {field("name", "Name *")}
        {field("email", "Email", "email")}
        {field("phone", "Phone")}
        {field("company", "Company")}
        {field("category", "Category")}
        {field("city", "City")}
        <div className="space-y-1.5 md:col-span-3">
          <Label>Notes</Label>
          <Textarea className="rounded-2xl" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </div>
        <Button type="submit" className="rounded-full md:w-fit"><Plus className="h-4 w-4" /> Add contact</Button>
      </form>
    </Panel>
  );
}

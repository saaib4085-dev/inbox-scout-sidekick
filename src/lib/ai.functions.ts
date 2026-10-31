import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runClaude, extractJson, AiError } from "./ai.server";
import { withCredits, CreditError } from "./billing.server";
import { CREDIT_COSTS } from "./credits";

export interface DraftOption {
  id: number;
  type: string;
  subject: string;
  body: string;
}

const draftInput = z.object({
  mode: z.enum(["reply", "outreach"]).default("reply"),
  incomingEmail: z.string().max(12000).default(""),
  sender: z.string().max(300).default(""),
  details: z.string().max(3000).default(""),
  tone: z.string().max(100),
  strategy: z.string().max(500),
  leadId: z.string().uuid().optional(),
});

function friendly(e: unknown): never {
  if (e instanceof CreditError || e instanceof AiError) throw new Error(e.message);
  console.error(e);
  throw new Error("Something went wrong. Your credits were restored.");
}

async function loadProfile(supabase: any, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, signature, brand_voice")
    .eq("id", userId)
    .maybeSingle();
  return data ?? { display_name: "", signature: "", brand_voice: "" };
}

export const generateDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => draftInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let lead: any = null;
    if (data.mode === "outreach") {
      if (!data.leadId) throw new Error("Pick a lead first.");
      const { data: l } = await supabase.from("leads").select("*").eq("id", data.leadId).maybeSingle();
      if (!l) throw new Error("Lead not found.");
      lead = l;
    } else if (data.incomingEmail.trim().length < 10) {
      throw new Error("Paste the email you want to reply to.");
    }
    const profile = await loadProfile(supabase, userId);

    try {
      return await withCredits(context, CREDIT_COSTS.emailGeneration, "Email generation (3 drafts)", async () => {
        const system = `You are an elite executive communications assistant. Draft 3 distinct ${
          data.mode === "outreach" ? "cold outreach emails" : "response emails"
        } based on the requested tone (${data.tone}) and strategy (${data.strategy}).
Incorporate the user's brand voice: ${profile.brand_voice || "clear, warm and professional"}.
Sign off using this signature when provided:
${profile.signature || profile.display_name || ""}
Option 1 must be "Direct & Concise", option 2 "Warm & Relationship-focused", option 3 "Strategic / Detailed".
Return ONLY JSON: {"drafts":[{"id":1,"type":"Direct & Concise","subject":"...","body":"..."}, ...]} with exactly 3 objects. Use \\n\\n between paragraphs in body.`;
        const userMsg =
          data.mode === "outreach"
            ? `Write outreach to this local business that has no website yet. Offer value relevant to them.
Business: ${lead.name}
Category: ${lead.category}
City: ${lead.city}
Notes: ${lead.notes}
Extra details to include: ${data.details || "none"}`
            : `Incoming email from ${data.sender || "unknown sender"}:
"""
${data.incomingEmail}
"""
Key details to include in the reply: ${data.details || "none"}`;
        const text = await runClaude({ system, messages: [{ role: "user", content: userMsg }], maxOutputTokens: 3000 });
        const parsed = extractJson<{ drafts: DraftOption[] }>(text);
        const drafts = (parsed.drafts ?? []).slice(0, 3).map((d, i) => ({
          id: i + 1,
          type: String(d.type ?? `Option ${i + 1}`),
          subject: String(d.subject ?? ""),
          body: String(d.body ?? ""),
        }));
        if (drafts.length !== 3) throw new AiError("The AI returned an incomplete set of drafts.");
        const { data: row } = await supabase
          .from("drafts")
          .insert({
            user_id: userId,
            mode: data.mode,
            incoming_email: data.incomingEmail,
            sender: data.sender,
            tone: data.tone,
            strategy: data.strategy,
            lead_id: data.leadId ?? null,
            options: drafts as any,
          })
          .select("id")
          .single();
        if (lead) await supabase.from("leads").update({ status: "drafted" }).eq("id", lead.id);
        return { draftId: row?.id ?? null, drafts };
      });
    } catch (e) {
      friendly(e);
    }
  });

const askInput = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .min(1)
    .max(20),
});

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => askInput.parse(d))
  .handler(async ({ data, context }) => {
    const last = data.messages[data.messages.length - 1];
    if (last.role !== "user" || !last.content.trim()) throw new Error("Type a question first.");
    const profile = await loadProfile(context.supabase, context.userId);
    try {
      const answer = await withCredits(context, CREDIT_COSTS.aiQuestion, "AI assistant question", () =>
        runClaude({
          system: `You are Hero, the assistant inside InboxHero, an AI email drafting and outreach app.
Help the user write emails, improve drafts, plan outreach and use the app. When asked to draft an email, write a ready-to-send email with a subject line.
Brand voice: ${profile.brand_voice || "clear, warm and professional"}.
Signature: ${profile.signature || profile.display_name || ""}
Keep answers concise and use plain text with short paragraphs.`,
          messages: data.messages,
          maxOutputTokens: 1500,
        }),
      );
      return { answer };
    } catch (e) {
      friendly(e);
    }
  });

const refineInput = z.object({
  subject: z.string().max(500),
  body: z.string().max(10000),
  action: z.enum(["shorten", "more formal", "friendlier", "add call to action"]),
});

export const refineDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => refineInput.parse(d))
  .handler(async ({ data, context }) => {
    try {
      return await withCredits(context, CREDIT_COSTS.aiQuestion, `Refine draft: ${data.action}`, async () => {
        const text = await runClaude({
          system: `Rewrite the email as requested: ${data.action}. Keep the meaning and signature. Return ONLY JSON {"subject":"...","body":"..."}.`,
          messages: [{ role: "user", content: `Subject: ${data.subject}\n\n${data.body}` }],
          maxOutputTokens: 1500,
        });
        const out = extractJson<{ subject: string; body: string }>(text);
        return { subject: String(out.subject ?? data.subject), body: String(out.body ?? "") };
      });
    } catch (e) {
      friendly(e);
    }
  });

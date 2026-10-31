import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withCredits, CreditError } from "./billing.server";
import { CREDIT_COSTS } from "./credits";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/apify";
// Google Maps business scraper actor (username~actor-name)
const ACTOR_ID = "compass~crawler-google-places";

const searchInput = z.object({
  query: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  limit: z.number().int().min(5).max(50).default(20),
});

export const searchLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => searchInput.parse(d))
  .handler(async ({ data, context }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const apifyKey = process.env["APIFY_API_KEY"];
    if (!lovableKey || !apifyKey) {
      throw new Error("Business search isn't connected yet. Ask the app owner to connect Apify.");
    }
    try {
      return await withCredits(context, CREDIT_COSTS.leadScrape, `Lead search: ${data.query} in ${data.location}`, async () => {
        const res = await fetch(
          `${GATEWAY_URL}/acts/${ACTOR_ID}/run-sync-get-dataset-items?limit=${data.limit}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": apifyKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              searchStringsArray: [data.query],
              locationQuery: data.location,
              maxCrawledPlacesPerSearch: data.limit,
              language: "en",
              skipClosedPlaces: true,
            }),
          },
        );
        if (!res.ok) {
          const body = await res.text();
          console.error(`Apify search failed [${res.status}]: ${body.slice(0, 500)}`);
          throw new Error(`Business search failed (${res.status}). Your credits were restored.`);
        }
        const items = (await res.json()) as any[];
        // Only keep businesses with no existing website
        const noSite = items.filter((i) => !String(i.website ?? "").trim());
        const rows = noSite.map((i) => ({
          user_id: context.userId,
          name: String(i.title ?? i.name ?? "Unnamed business").slice(0, 200),
          email: String(i.email ?? (Array.isArray(i.emails) ? i.emails[0] ?? "" : "")).slice(0, 200),
          phone: String(i.phone ?? i.phoneUnformatted ?? "").slice(0, 60),
          company: String(i.title ?? "").slice(0, 200),
          category: String(i.categoryName ?? (i.categories?.[0] ?? "")).slice(0, 120),
          city: String(i.city ?? data.location).slice(0, 120),
          address: String(i.address ?? "").slice(0, 300),
          notes: [i.totalScore ? `Rating ${i.totalScore}` : "", i.reviewsCount ? `${i.reviewsCount} reviews` : ""]
            .filter(Boolean)
            .join(" · "),
          source: "search",
        }));
        if (rows.length) {
          const { error } = await context.supabase.from("leads").insert(rows);
          if (error) throw new Error("Could not save leads.");
        }
        return { found: items.length, saved: rows.length, skippedWithWebsite: items.length - rows.length };
      });
    } catch (e) {
      if (e instanceof CreditError || e instanceof Error) throw new Error(e.message);
      throw e;
    }
  });

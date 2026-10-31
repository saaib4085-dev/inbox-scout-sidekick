import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  appUserReconnectRequired,
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
  exchangeAppUserOAuthCode,
} from "./appUserConnector.server";
import {
  deleteConnectionForUser,
  getConnectionKeyForUser,
  saveConnectionKeyForUser,
} from "./appUserConnections.server";

const GATEWAY = "https://connector-gateway.lovable.dev";

const PROVIDERS = {
  google_mail: {
    label: "Gmail",
    clientEnv: "GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY",
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    extra: {} as Record<string, unknown>,
  },
  microsoft_outlook: {
    label: "Outlook",
    clientEnv: "MICROSOFT_OUTLOOK_APP_USER_CONNECTOR_CLIENT_API_KEY",
    scopes: ["openid", "profile", "email", "offline_access", "Mail.Send", "User.Read"],
    extra: { domain_hint: "none", prompt: "select_account" } as Record<string, unknown>,
  },
} as const;

type ProviderId = keyof typeof PROVIDERS;
const providerSchema = z.enum(["google_mail", "microsoft_outlook"]);

export const getMailboxStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const out: Record<string, { available: boolean; connected: boolean }> = {};
    for (const id of Object.keys(PROVIDERS) as ProviderId[]) {
      const available = Boolean(process.env[PROVIDERS[id].clientEnv]);
      let connected = false;
      if (available && process.env["APP_USER_CONNECTION_KEY_SECRET"]) {
        connected = Boolean(await getConnectionKeyForUser(context.userId, id).catch(() => null));
      }
      out[id] = { available, connected };
    }
    return out as Record<ProviderId, { available: boolean; connected: boolean }>;
  });

export const startMailboxConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ provider: providerSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const p = PROVIDERS[data.provider];
    const clientKey = process.env[p.clientEnv];
    if (!clientKey) throw new Error(`${p.label} connection isn't set up for this app yet.`);
    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const url = new URL(request.url);
    const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL("/api/oauth/mail/return", sandboxHost ? `https://${sandboxHost}` : url.origin).toString();
    const existing = await getConnectionKeyForUser(context.userId, data.provider).catch(() => null);
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY,
      connectorId: data.provider,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl,
      ...(existing ? { connectionAPIKey: existing } : {}),
      credentialsConfiguration: { scopes: [...p.scopes], ...p.extra },
    });
    return { authorizationUrl };
  });

export const completeMailboxConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(1).max(2000), provider: providerSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY, data.code);
    if (connectorId !== data.provider) throw new Error("OAuth completion returned the wrong mailbox.");
    await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);
    return { ok: true };
  });

export const disconnectMailbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ provider: providerSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const key = await getConnectionKeyForUser(context.userId, data.provider);
    if (key) await disconnectAppUser({ gatewayBaseUrl: GATEWAY, connectionAPIKey: key, connectorId: data.provider });
    await deleteConnectionForUser(context.userId, data.provider);
    return { ok: true };
  });

const b64 = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const header = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

/** Sends ONE reviewed outbox email. Each email must be approved and sent individually. */
export const sendOutboxEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), provider: providerSchema, confirmReviewed: z.literal(true) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase.from("outbox").select("*").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Email not found.");
    if (row.status === "sent") throw new Error("This email was already sent.");
    const to = row.to_email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Add a valid recipient email first.");
    const key = await getConnectionKeyForUser(userId, data.provider);
    if (!key) throw new Error(`Connect your ${PROVIDERS[data.provider].label} mailbox first.`);

    let res: Response;
    if (data.provider === "google_mail") {
      const raw = b64(
        [`To: ${to}`, `Subject: ${header(row.subject)}`, "MIME-Version: 1.0", 'Content-Type: text/plain; charset="UTF-8"', "", row.body].join("\r\n"),
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      res = await callAsAppUser({
        gatewayBaseUrl: GATEWAY,
        connectionAPIKey: key,
        connectorId: "google_mail",
        path: "/gmail/v1/users/me/messages/send",
        requiredScopes: [...PROVIDERS.google_mail.scopes],
        init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raw }) },
      });
    } else {
      res = await callAsAppUser({
        gatewayBaseUrl: GATEWAY,
        connectionAPIKey: key,
        connectorId: "microsoft_outlook",
        path: "/me/sendMail",
        requiredScopes: [...PROVIDERS.microsoft_outlook.scopes],
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: {
              subject: row.subject,
              body: { contentType: "Text", content: row.body },
              toRecipients: [{ emailAddress: { address: to } }],
            },
          }),
        },
      });
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (await appUserReconnectRequired(res)) {
      return { ok: false, reconnectRequired: true };
    }
    if (!res.ok) {
      const body = await res.text();
      console.error(`Mail send failed [${res.status}]: ${body.slice(0, 500)}`);
      await supabaseAdmin.from("outbox").update({ status: "failed", error: `Send failed (${res.status})` }).eq("id", row.id).eq("user_id", userId);
      throw new Error(`Your mailbox rejected the email (${res.status}).`);
    }
    await supabaseAdmin
      .from("outbox")
      .update({ status: "sent", provider: data.provider, sent_at: new Date().toISOString(), error: null })
      .eq("id", row.id)
      .eq("user_id", userId);
    if (row.lead_id) await supabase.from("leads").update({ status: "sent" }).eq("id", row.lead_id);
    return { ok: true };
  });

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  completeMailboxConnect,
  disconnectMailbox,
  getMailboxStatus,
  startMailboxConnect,
} from "@/lib/mail.functions";

export type MailProvider = "google_mail" | "microsoft_outlook";
export const PROVIDER_LABEL: Record<MailProvider, string> = {
  google_mail: "Gmail",
  microsoft_outlook: "Outlook",
};

export function useMailboxStatus() {
  const fn = useServerFn(getMailboxStatus);
  return useQuery({ queryKey: ["mailbox-status"], queryFn: () => fn() });
}

function waitForOAuth(popup: Window, connectorId: string) {
  return new Promise<string | null>((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const type = event.data?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        event.data?.connectorId !== connectorId ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      )
        return;
      cleanup();
      if (type === "appUserConnectorOAuthComplete") resolve(typeof event.data?.code === "string" ? event.data.code : null);
      else {
        popup.close();
        reject(new Error("Connection failed."));
      }
    };
    window.addEventListener("message", onMessage);
    const poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The window closed before the connection finished."));
    }, 500);
  });
}

export function MailboxConnections() {
  const status = useMailboxStatus();
  const start = useServerFn(startMailboxConnect);
  const complete = useServerFn(completeMailboxConnect);
  const disconnect = useServerFn(disconnectMailbox);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<MailProvider | null>(null);

  async function connect(provider: MailProvider) {
    const popup = window.open("", "inboxhero-oauth", "width=600,height=720");
    if (!popup) return toast.error("Allow popups to connect your mailbox.");
    setBusy(provider);
    try {
      const { authorizationUrl } = await start({ data: { provider } });
      const done = waitForOAuth(popup, provider);
      popup.location.href = authorizationUrl;
      const code = await done;
      if (code) await complete({ data: { code, provider } });
      await qc.invalidateQueries({ queryKey: ["mailbox-status"] });
      toast.success(`${PROVIDER_LABEL[provider]} connected`);
    } catch (e) {
      popup.close();
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(provider: MailProvider) {
    setBusy(provider);
    try {
      await disconnect({ data: { provider } });
      await qc.invalidateQueries({ queryKey: ["mailbox-status"] });
      toast.success(`${PROVIDER_LABEL[provider]} disconnected`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(PROVIDER_LABEL) as MailProvider[]).map((p) => {
        const s = status.data?.[p];
        return (
          <div key={p} className="flex items-center gap-3 rounded-2xl border bg-background p-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{PROVIDER_LABEL[p]}</p>
              <p className="truncate text-xs text-muted-foreground">
                {status.isLoading
                  ? "Checking…"
                  : !s?.available
                    ? "Not available yet — the app owner needs to finish setup"
                    : s.connected
                      ? "Connected — emails send from your own mailbox"
                      : "Send reviewed emails from your own address"}
              </p>
            </div>
            {s?.connected ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <Button size="sm" variant="ghost" className="rounded-full" disabled={busy === p} onClick={() => remove(p)}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button size="sm" className="rounded-full" disabled={!s?.available || busy === p} onClick={() => connect(p)}>
                {busy === p ? "Connecting…" : "Connect"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

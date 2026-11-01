<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Credit rules live in `src/lib/credits.ts` (UI + tests) and are enforced in Postgres functions `reserve_credits` / `refund_credits` / `apply_subscription` / `add_topup`; change both together — the DB is the source of truth for spending.
- Every paid AI or scraper call goes through `withCredits()` in `src/lib/billing.server.ts` so credits are reserved before the call and refunded on failure.
- Refund/grant DB functions are executable by service_role only, so users cannot mint or refund credits from the browser.
- AI calls go through `runClaude()` in `src/lib/ai.server.ts` (Lovable AI Gateway, native Messages API, streamed server-side).
- Per-user Gmail/Outlook sending uses App User Connectors; connection keys are stored encrypted in `app_user_connections` (server-only table). Emails are only sent one at a time from the Outbox after explicit review.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate, `ssr: false`).

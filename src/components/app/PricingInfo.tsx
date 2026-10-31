import { CalendarClock, Infinity as InfinityIcon, Mail, MessageSquare, RefreshCw, Search, Gift } from "lucide-react";
import { CREDIT_COSTS, SIGNUP_BONUS, formatCredits } from "@/lib/credits";

export const CREDIT_POINTS = [
  { icon: Mail, title: `${CREDIT_COSTS.emailGeneration} credits per email generation`, text: "Each request returns three distinct reply options — you pay once, not per option." },
  { icon: MessageSquare, title: `${CREDIT_COSTS.aiQuestion} credits per AI question`, text: "Questions to the assistant and draft refinements (shorten, friendlier…)." },
  { icon: Search, title: `${CREDIT_COSTS.leadScrape} credits per lead search`, text: "One in-app business search. CSV import and manual contacts are free." },
  { icon: Gift, title: `${formatCredits(SIGNUP_BONUS)} free sign-up credits`, text: "One-time bonus that never expires. There's no monthly refill on Free." },
  { icon: CalendarClock, title: "Plan credits reset monthly", text: "Pro and Business credits refresh each billing month. Unused plan credits don't roll over." },
  { icon: InfinityIcon, title: "Top-up credits carry over", text: "Purchased top-ups never expire and stay in your balance month after month." },
  { icon: RefreshCw, title: "Failed requests are refunded", text: "Credits are reserved before each request and restored automatically if it fails." },
];

export function CreditPoints({ columns = 2 }: { columns?: 2 | 3 }) {
  return (
    <ul className={`grid gap-3 ${columns === 3 ? "md:grid-cols-3" : "sm:grid-cols-2"}`}>
      {CREDIT_POINTS.map((p) => (
        <li key={p.title} className="flex gap-3 rounded-2xl bg-primary-soft/60 p-3.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-card text-primary-deep">
            <p.icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{p.title}</span>
            <span className="block text-xs text-muted-foreground">{p.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

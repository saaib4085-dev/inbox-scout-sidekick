import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 7.5 12 13l8-5.5" />
          <rect x="3" y="5" width="18" height="14" rx="4" />
          <path d="M15.5 2.5 17 4l-1.5 1.5" opacity=".9" />
        </svg>
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        Inbox<span className="text-primary">Hero</span>
      </span>
    </span>
  );
}

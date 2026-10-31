import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-app-data";
import { formatCredits } from "@/lib/credits";
import { Logo } from "./Logo";
import { AssistantWidget } from "./AssistantWidget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/compose", label: "Compose" },
  { to: "/leads", label: "Leads" },
  { to: "/outbox", label: "Outbox" },
  { to: "/credits", label: "Credits" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppShell() {
  const { user } = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const initial = (user?.user_metadata?.full_name || user?.email || "?").slice(0, 1).toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="shrink-0">
            <Logo />
          </Link>
          <div className="hidden h-6 w-px bg-border md:block" />
          <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-primary-soft font-semibold text-primary-deep" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              to="/credits"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary-deep transition hover:shadow-soft"
            >
              <Coins className="h-4 w-4" />
              {wallet.data ? formatCredits(wallet.data.total) : "…"}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                {initial}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground"
              activeProps={{ className: "bg-primary-soft font-semibold text-primary-deep" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6">
        <Outlet />
      </main>
      <AssistantWidget />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

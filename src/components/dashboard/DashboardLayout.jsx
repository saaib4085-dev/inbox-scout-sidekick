import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatCredits } from '@/lib/packs';

const navItem = ({ isActive }) =>
  isActive
    ? 'rounded-full bg-foreground px-3.5 py-1.5 text-[13px] font-medium text-background'
    : 'rounded-full px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground';

export default function DashboardLayout() {
  const { user, isAuthenticated, isLoadingAuth, authChecked, navigateToLogin, logout } = useAuth();
  const [account, setAccount] = useState(null);
  const [accountError, setAccountError] = useState('');

  const refreshAccount = useCallback(async () => {
    const response = await base44.functions.invoke('account', { action: 'ensure' });
    if (response.data?.error) {
      setAccountError(response.data.error);
      return null;
    }
    setAccount(response.data?.account ?? null);
    setAccountError('');
    return response.data?.account ?? null;
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshAccount().catch(() => setAccountError('Could not load your balance.'));
  }, [isAuthenticated, refreshAccount]);

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center px-5">
        <div className="max-w-sm text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Workspace</p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight">
            Sign in to open your scout queue.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your leads, drafts and credit balance are tied to your account.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => navigateToLogin()}
              className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Sign in or create an account
            </button>
            <Link to="/" className="text-[13px] text-muted-foreground underline underline-offset-4">
              Back to the homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b hairline bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">
                <span className="font-display text-[15px] leading-none">i</span>
              </span>
              <span className="hidden text-[15px] font-medium tracking-tight sm:block">InboxHero</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to="/app" end className={navItem}>
                Scout
              </NavLink>
              <NavLink to="/app/analytics" className={navItem}>
                Analytics
              </NavLink>
              <NavLink to="/app/account" className={navItem}>
                Account
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/pricing"
              className="hidden items-center gap-1.5 rounded-full border hairline px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/75 transition-colors hover:border-foreground/30 hover:text-foreground sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {formatCredits(account?.balance ?? 0)} credits ·{' '}
              {formatCredits(account?.scrape_balance ?? 0)} scrapes
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              title="Sign out"
              className="grid h-9 w-9 place-items-center rounded-full border hairline text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {accountError && (
          <div className="mx-auto max-w-6xl px-5 pt-6 md:px-8">
            <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
              {accountError}
            </p>
          </div>
        )}
        <Outlet context={{ account, refreshAccount, user }} />
      </main>

      <div className="border-t hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>InboxHero · operated as an online software service</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link to="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/refunds" className="hover:text-foreground">
              Refund &amp; Cancellation Policy
            </Link>
            <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-3 w-3" />
              Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
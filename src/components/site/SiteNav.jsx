import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const links = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Legal', href: '/terms' },
];

export default function SiteNav() {
  const { user, isAuthenticated, navigateToLogin } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">
            <span className="font-display text-[15px] leading-none">i</span>
          </span>
          <span className="text-[15px] font-medium tracking-tight">InboxHero</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/app"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Workspace
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigateToLogin()}
                className="hidden h-9 items-center rounded-full px-4 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Sign in
              </button>
              <Link
                to="/pricing"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-85"
              >
                Start free
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
      {location.pathname === '/' && user === null && <div className="h-px w-full" />}
    </header>
  );
}
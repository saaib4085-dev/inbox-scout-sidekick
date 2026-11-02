import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
      <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
      <Link to="/refunds" className="hover:text-foreground">Refund Policy</Link>
    </nav>
  );
}

export function LegalFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:px-6">
      {!compact && <Logo />}
      <LegalLinks />
      <p>© {new Date().getFullYear()} InboxHero. Every email is reviewed by you before it sends.</p>
    </footer>
  );
}

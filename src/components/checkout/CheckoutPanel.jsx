import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, LogIn, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatCredits, formatPrice } from '@/lib/packs';
import { CONSENT_VERSION, POLICY_UPDATED } from '@/lib/legal';

export default function CheckoutPanel({ pack }) {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  if (pack.contact || pack.price === null) {
    return (
      <div className="rounded-xl border hairline bg-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Enterprise
        </p>
        <p className="mt-4 font-display text-3xl leading-none">
          {formatCredits(pack.credits)} credits
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          plus {formatCredits(pack.scrapes)} customer scrapes, invoiced once.
        </p>
        <p className="mt-4 border-t hairline pt-4 text-[12px] leading-relaxed text-muted-foreground">
          Enterprise is arranged directly with our team instead of self-serve checkout. Reply to your
          InboxHero onboarding email and we will enable it on your workspace.
        </p>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!consent || submitting || !isAuthenticated) return;

    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open('', '_blank') : null;
    if (isFramed && !checkoutTab) {
      setError('Allow pop-ups for this page to continue to checkout.');
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;

    setSubmitting(true);
    setError('');

    try {
      const response = await base44.functions.invoke('startCheckout', {
        packId: pack.id,
        consentTerms: true,
        consentVersion: CONSENT_VERSION,
      });

      if (response.data?.error || !response.data?.url) {
        checkoutTab?.close();
        setError(response.data?.error || 'Payment could not be started. Please try again.');
        return;
      }

      setRedirecting(true);
      if (checkoutTab) {
        checkoutTab.location.replace(response.data.url);
      } else {
        window.location.assign(response.data.url);
      }
    } catch (err) {
      checkoutTab?.close();
      setError(
        err?.response?.data?.error || 'Payment could not be started. Please try again in a moment.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border hairline bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Order summary
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {formatCredits(pack.credits)} credits
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between border-b hairline pb-5">
        <div>
          <p className="text-lg font-medium tracking-tight">{pack.name} pack</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {formatCredits(pack.scrapes)} customer scrapes · delivered instantly
          </p>
        </div>
        <p className="font-display text-4xl leading-none">{formatPrice(pack)}</p>
      </div>

      <div className="mt-4 space-y-1.5 text-[12px] text-muted-foreground">
        <p>One-time payment. No subscription, no auto-renewal.</p>
        <p>Credits never expire and stay with your account.</p>
      </div>

      <label
        htmlFor="checkout-consent"
        className={
          consent
            ? 'mt-6 flex cursor-pointer gap-3 rounded-lg border border-primary/40 bg-primary/[0.04] p-4 transition-colors'
            : 'mt-6 flex cursor-pointer gap-3 rounded-lg border hairline bg-background/60 p-4 transition-colors hover:border-foreground/25'
        }
      >
        <input
          id="checkout-consent"
          name="checkout-consent"
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[hsl(var(--primary))]"
        />
        <span className="text-[12px] leading-relaxed text-foreground/80">
          I agree to the{' '}
          <Link
            to="/terms"
            onClick={(event) => event.stopPropagation()}
            className="underline decoration-border underline-offset-2 hover:decoration-foreground"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            to="/privacy"
            onClick={(event) => event.stopPropagation()}
            className="underline decoration-border underline-offset-2 hover:decoration-foreground"
          >
            Privacy Policy
          </Link>
          . I explicitly consent to immediate delivery of my digital credit balance upon payment
          and acknowledge that I forfeit my statutory 14-day EU right of withdrawal once credits are
          added to my account.
        </span>
      </label>

      <p className="mt-2 pl-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        Consent v{CONSENT_VERSION} · policies updated {POLICY_UPDATED}
      </p>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      )}

      {!isAuthenticated ? (
        <>
          <button
            type="button"
            onClick={() => navigateToLogin()}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-85"
          >
            <LogIn className="h-4 w-4" />
            Sign in to buy {formatCredits(pack.credits)} credits
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            Credits are added to your workspace, so you need an account before paying.
          </p>
        </>
      ) : (
        <>
          <button
            type="submit"
            disabled={!consent || submitting}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-foreground/25 disabled:text-background/60 disabled:hover:opacity-100"
          >
            {submitting || redirecting ? (
              'Opening secure checkout…'
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Pay {formatPrice(pack)} and add {formatCredits(pack.credits)} credits
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            {consent
              ? 'You will complete the payment on Stripe’s secure checkout page.'
              : 'Tick the consent box to enable payment.'}
          </p>
        </>
      )}

      <div className="mt-4 flex items-start gap-1.5 border-t hairline pt-4">
        <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Card details never touch our servers. Credits are non-refundable once delivered — see the{' '}
          <Link
            to="/refunds"
            className="underline decoration-border underline-offset-2 hover:decoration-foreground"
          >
            Refund &amp; Cancellation Policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
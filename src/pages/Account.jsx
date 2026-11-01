import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { AlertTriangle, Download, ShieldCheck, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatCredits } from '@/lib/packs';

export default function Account() {
  const { account, user } = useOutletContext();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exported, setExported] = useState(false);
  const [deleted, setDeleted] = useState(null);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const response = await base44.functions.invoke('account', { action: 'export' });
      if (response.data?.error) {
        setError(response.data.error);
        return;
      }
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inboxhero-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExported(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'The export could not be generated.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const response = await base44.functions.invoke('account', { action: 'delete' });
      if (response.data?.error) {
        setError(response.data.error);
        return;
      }
      setDeleted(response.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Your data could not be erased. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (deleted) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
          Account erased
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight">
          Your workspace has been erased.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We removed your leads, your credit balance, your order consents and your account
          profile. This cannot be undone.
          {deleted.profile_deleted === false
            ? ' Your sign-in profile could not be removed automatically — contact us from the link below and we will finish the erasure.'
            : ''}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
          >
            Back to homepage
          </Link>
          <Link
            to="/privacy#your-rights"
            className="inline-flex h-10 items-center rounded-full border hairline px-5 text-sm text-foreground/80"
          >
            Your GDPR rights
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
        Data & account
      </p>
      <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight md:text-[2.9rem]">
        Your data, your call.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Everything InboxHero stores about you lives in this workspace. You can take a copy of it,
        or erase all of it, without asking anyone.
      </p>

      <div className="mt-9 grid gap-3 sm:grid-cols-3">
        {[
          ['Email', user?.email ?? '—'],
          ['Plan', account?.plan === 'free' ? 'Free credits' : (account?.plan ?? '—')],
          ['Credits', formatCredits(account?.balance ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border hairline bg-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 truncate text-[14px] font-medium tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      )}

      <section className="mt-9 rounded-xl border hairline bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary">
            <Download className="h-4 w-4 text-foreground/70" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-medium tracking-tight">Download my data</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              A machine-readable export of your profile, credit balance, leads and order history —
              the portability right under Article 20 GDPR.
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border hairline px-5 text-[13px] font-medium text-foreground transition-colors hover:border-foreground/35 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? 'Preparing export…' : 'Export everything as JSON'}
            </button>
            {exported && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Export downloaded.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-destructive/25 bg-destructive/[0.03] p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-medium tracking-tight">Delete my account &amp; data</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Permanently erases your leads, your remaining credit balance, your order records and
              your sign-in profile. Any unused credits are forfeited. This is the right to erasure
              under Article 17 GDPR and it cannot be reversed.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-destructive px-5 text-[13px] font-medium text-destructive-foreground transition-opacity hover:opacity-90"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete My Account &amp; Data
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Erase everything, permanently?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your leads, drafts, credit balance ({formatCredits(account?.balance ?? 0)}{' '}
                    credits), order consents and account profile will be deleted. Unused credits
                    are forfeited and this action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep my account</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Erasing…' : 'Yes, erase everything'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>

      <section className="mt-6 flex items-start gap-2.5 rounded-lg border hairline bg-secondary/40 p-4">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Purchase records required by tax law are retained in reduced form after deletion. Read
          how we handle this in the{' '}
          <Link to="/privacy#account-deletion" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
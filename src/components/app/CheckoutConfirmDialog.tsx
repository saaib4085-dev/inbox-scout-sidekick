import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AGE_CONSENT_TEXT, WITHDRAWAL_WAIVER_TEXT, checkoutSummary, type Product } from "@/lib/policies";

export function CheckoutConfirmDialog({
  product,
  onClose,
  onConfirm,
}: {
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product) => Promise<void> | void;
}) {
  const [waive, setWaive] = useState(false);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setWaive(false);
    setAdult(false);
  }, [product]);
  if (!product) return null;
  const s = checkoutSummary(product);
  const eur = (n: number) => `€${n.toFixed(2)}`;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-[1.75rem]">
        <DialogHeader>
          <DialogTitle>Confirm your purchase</DialogTitle>
          <DialogDescription>Check the price and confirm the points below before paying.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-2xl bg-primary-soft p-4 text-sm">
          <div className="flex justify-between gap-3"><span>{s.name}</span><span className="font-medium">{eur(s.priceEur)}</span></div>
          <div className="flex justify-between gap-3 text-muted-foreground"><span>Transaction fees</span><span>{eur(s.feesEur)}</span></div>
          <div className="flex justify-between gap-3 border-t border-primary/20 pt-2 font-semibold">
            <span>Total {s.recurring ? "per month" : "today"}</span><span>{eur(s.totalEur)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {s.recurring ? "Renews monthly until you cancel. Cancel any time from Manage billing." : "One-time payment. No subscription."}
          </p>
        </div>
        <label className="flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm">
          <Checkbox checked={waive} onCheckedChange={(v) => setWaive(v === true)} className="mt-0.5" aria-label="Immediate delivery and withdrawal waiver" />
          <span>{WITHDRAWAL_WAIVER_TEXT}</span>
        </label>
        <label className="flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm">
          <Checkbox checked={adult} onCheckedChange={(v) => setAdult(v === true)} className="mt-0.5" aria-label="Age or guardian consent" />
          <span>{AGE_CONSENT_TEXT}</span>
        </label>
        <p className="text-xs text-muted-foreground">
          By paying you agree to our <Link to="/terms" target="_blank" className="font-semibold text-primary-deep">Terms</Link>,{" "}
          <Link to="/refunds" target="_blank" className="font-semibold text-primary-deep">Refund Policy</Link> and{" "}
          <Link to="/privacy" target="_blank" className="font-semibold text-primary-deep">Privacy Policy</Link>.
        </p>
        <Button
          className="h-11 w-full rounded-full"
          disabled={!waive || !adult || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm(product);
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          <ShieldCheck className="h-4 w-4" /> {busy ? "Opening secure checkout…" : `Continue to pay ${eur(s.totalEur)}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

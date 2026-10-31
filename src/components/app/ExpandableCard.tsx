import { useState, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Rounded card that can be opened as a full-screen view. */
export function ExpandableCard({
  title,
  description,
  children,
  expanded,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  /** Content shown in full-screen mode; defaults to children. */
  expanded?: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <section
        className={cn(
          "group relative rounded-[1.75rem] border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift",
          className,
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{title}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {action}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={`Open ${title} full screen`}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-primary-soft hover:text-primary-deep"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {children}
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col overflow-auto rounded-[2rem] p-6 sm:max-w-none sm:p-10">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          <div className="mt-4 min-h-0 flex-1">{expanded ?? children}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}

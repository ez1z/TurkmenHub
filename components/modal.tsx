"use client";

import { useEffect, useId, useRef } from "react";

// A native <dialog> opened with showModal(): the browser traps focus, makes
// the page behind it inert, and closes it on Escape. Tapping the backdrop
// closes it too. The parent owns `open`; onClose fires however it closes.
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // The `close` event arrives a task after dialog.close(). By then the
  // parent may already have opened another dialog, so only pass on closes
  // the browser started (Escape, backdrop) while this one is still open.
  const openRef = useRef(open);
  const titleId = useId();

  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (open && !dialog?.open) {
      dialog?.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        if (openRef.current) {
          onClose();
        }
      }}
      // The dialog element itself only receives clicks on the backdrop; the
      // content sits in the inner div.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
      // A bottom sheet on phones (thumb-reachable, like native apps), a
      // centred card from sm up. Motion lives in .sheet in globals.css.
      className="sheet mx-auto mt-auto mb-0 max-h-[90dvh] w-full overflow-y-auto max-w-none rounded-t-3xl bg-surface p-0 text-ink shadow-xl sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-sm sm:rounded-3xl"
    >
      <div className="flex flex-col gap-5 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6">
        <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight text-balance">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

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
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 text-black shadow-xl backdrop:bg-black/50 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

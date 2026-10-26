"use client";

import { useActionState } from "react";
import { redeemInvite, type InviteState } from "@/app/invite/actions";

const initialState: InviteState = { error: "" };

export default function InviteForm() {
  const [state, formAction, pending] = useActionState(
    redeemInvite,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label
        htmlFor="code"
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Invite code
      </label>
      <input
        id="code"
        name="code"
        type="text"
        required
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={20}
        placeholder="ABCDE23456"
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "code-error" : undefined}
        className="h-12 w-full rounded-xl border border-black/[.08] bg-transparent px-4 font-mono text-lg tracking-widest text-black uppercase placeholder:text-zinc-400 focus:border-foreground focus:outline-none dark:border-white/[.145] dark:text-zinc-50"
      />

      {state.error && (
        <p
          id="code-error"
          role="alert"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {pending ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}

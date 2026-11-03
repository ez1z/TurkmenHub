import CopyButton from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";

// The codes redeem_invite() gave this member, and which ones are spent. RLS
// only returns codes the member created. Reads cookies, so render it inside
// <Suspense>.
export default async function MyInvites() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub ?? "";

  const { data: invites } = await supabase
    .from("invites")
    .select("code, used_at")
    .eq("created_by", userId)
    .order("created_at")
    .order("code");

  if (!invites?.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        You don&apos;t have any invite codes.
      </p>
    );
  }

  const left = invites.filter((invite) => !invite.used_at).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {left} of {invites.length} left. Each code verifies one person, so only
        share it with someone you know.
      </p>
      <ul className="flex flex-col divide-y divide-black/[.08] rounded-xl border border-black/[.08] dark:divide-white/[.145] dark:border-white/[.145]">
        {invites.map((invite) => (
          <li
            key={invite.code}
            className="flex h-14 items-center justify-between gap-3 px-4"
          >
            <span
              className={`font-mono tracking-widest ${
                invite.used_at
                  ? "text-zinc-400 line-through dark:text-zinc-600"
                  : "text-black dark:text-zinc-50"
              }`}
            >
              {invite.code}
            </span>
            {invite.used_at ? (
              <span className="text-sm text-zinc-500">Used</span>
            ) : (
              <CopyButton
                text={invite.code}
                label={`Copy invite code ${invite.code}`}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

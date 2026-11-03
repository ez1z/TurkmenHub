"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { createClient } from "@/lib/supabase/server";

const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS, { error: "reasonRequired" }),
  details: z
    .string()
    .trim()
    .max(1000, { error: "detailsTooLong" })
    .transform((details) => details || null),
  also_block: z.boolean(),
});

export type ReportState = {
  error: "" | "reasonRequired" | "detailsTooLong" | "generic";
  sent: boolean;
};

// 23505: already blocked. 23503: the member deleted their account in the
// meantime. Either way they're out of sight, which is what was asked for.
async function insertBlock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string,
) {
  const { error } = await supabase.from("blocks").insert({ blocked_id: memberId });
  return !error || error.code === "23505" || error.code === "23503";
}

// After a block the profile is gone for this viewer (RLS hides blocked
// members both ways), so go back to the city list it was opened from.
function leaveProfile(citySlug: string | null): never {
  redirect(citySlug && /^[a-z0-9-]+$/.test(citySlug) ? `/city/${citySlug}` : "/");
}

// memberId and citySlug are bound by the member page. RLS only lets a
// verified member insert a block with themselves as the blocker.
export async function blockMember(
  memberId: string,
  citySlug: string | null,
): Promise<{ error: "" | "generic" }> {
  const supabase = await createClient();
  if (!(await insertBlock(supabase, memberId))) {
    return { error: "generic" };
  }
  leaveProfile(citySlug);
}

// Files a report for the founder to review, and optionally blocks too.
export async function reportMember(
  memberId: string,
  citySlug: string | null,
  _prevState: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const parsed = reportSchema.safeParse({
    reason: formData.get("reason") ?? undefined,
    details: String(formData.get("details") ?? ""),
    also_block: formData.get("also_block") === "on",
  });
  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    return {
      error: issue.message === "detailsTooLong" ? "detailsTooLong" : "reasonRequired",
      sent: false,
    };
  }

  const { reason, details, also_block } = parsed.data;
  const supabase = await createClient();

  // reporter_id defaults to auth.uid(), and RLS requires it to be.
  const { error } = await supabase
    .from("reports")
    .insert({ reported_id: memberId, reason, details });
  if (error && error.code !== "23503") {
    return { error: "generic", sent: false };
  }

  if (also_block) {
    if (!(await insertBlock(supabase, memberId))) {
      return { error: "generic", sent: false };
    }
    leaveProfile(citySlug);
  }

  return { error: "", sent: true };
}

// Same values, in the same order, as the check constraint on
// public.reports.reason. The report form lists them in this order.
export const REPORT_REASONS = ["spam", "harassment", "political", "fake", "other"] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

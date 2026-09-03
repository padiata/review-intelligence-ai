import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

const FINDINGS_TABLE = "review_intelligence_findings";

export type InternalFeedbackFinding = {
  id: number;
  imported_review_id: number;
  finding_order: number;
  area_code: string;
  cause_code: string | null;
  subcause_code: string | null;
  sentiment: string;
  finding_summary: string | null;
  evidence_text: string | null;
};

function validateReviewId(reviewId: number): void {
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    throw new Error("A valid reviewId is required.");
  }
}

/**
 * Returns the negative findings already generated and persisted
 * by Review Understanding for one imported review.
 *
 * This function:
 * - does not run AI
 * - does not modify Review Understanding
 * - only reads persisted findings
 */
export async function getNegativeFindingsForReview(
  reviewId: number
): Promise<InternalFeedbackFinding[]> {
  validateReviewId(reviewId);

  const { data, error } = await supabaseAdmin
    .from(FINDINGS_TABLE)
    .select(`
      id,
      imported_review_id,
      finding_order,
      area_code,
      cause_code,
      subcause_code,
      sentiment,
      finding_summary,
      evidence_text
    `)
    .eq("imported_review_id", reviewId)
    .eq("sentiment", "negative")
    .order("finding_order", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Could not load negative findings for review ${reviewId}: ${error.message}`
    );
  }

  return (data ?? []) as InternalFeedbackFinding[];
}
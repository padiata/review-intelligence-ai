import "server-only";

import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export type PendingImportedReview = {
  id: number;
  entity_id: number;

  source: string;
  source_review_id: string | null;

  property_name: string | null;
  property_url: string | null;

  review_title: string | null;
  review_text: string | null;

  rating: number | null;

  review_date: string | null;
  visit_date: string | null;

  language: string | null;
  original_language: string | null;

  analysis_status: string;
};

function validateEntityId(
  entityId: number
): void {
  if (
    !Number.isInteger(entityId) ||
    entityId <= 0
  ) {
    throw new Error(
      "A valid entityId is required."
    );
  }
}

function validateReviewId(
  reviewId: number
): void {
  if (
    !Number.isInteger(reviewId) ||
    reviewId <= 0
  ) {
    throw new Error(
      "A valid reviewId is required."
    );
  }
}

/**
 * Returns pending reviews for one entity.
 */
export async function getPendingImportedReviews(
  entityId: number,
  limit = 10
): Promise<PendingImportedReview[]> {
  validateEntityId(entityId);

  if (
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    throw new Error(
      "limit must be greater than zero."
    );
  }

  const { data, error } =
    await supabase
      .from("imported_reviews")
      .select(`
        id,
        entity_id,
        source,
        source_review_id,
        property_name,
        property_url,
        review_title,
        review_text,
        rating,
        review_date,
        visit_date,
        language,
        original_language,
        analysis_status
      `)
      .eq("entity_id", entityId)
      .eq("analysis_status", "pending")
      .order("id", {
        ascending: true,
      })
      .limit(limit);

  if (error) {
    throw new Error(
      `Could not load pending reviews for entity ${entityId}: ${error.message}`
    );
  }

  return (data ??
    []) as PendingImportedReview[];
}

/**
 * Counts pending reviews for one entity.
 */
export async function countPendingImportedReviews(
  entityId: number
): Promise<number> {
  validateEntityId(entityId);

  const { count, error } =
    await supabase
      .from("imported_reviews")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("entity_id", entityId)
      .eq("analysis_status", "pending");

  if (error) {
    throw new Error(
      `Could not count pending reviews for entity ${entityId}: ${error.message}`
    );
  }

  return count ?? 0;
}

/**
 * Marks a review as processing.
 */
export async function markReviewAsProcessing(
  reviewId: number
): Promise<void> {
  validateReviewId(reviewId);

  const { error } =
    await supabase
      .from("imported_reviews")
      .update({
        analysis_status:
          "processing",
      })
      .eq("id", reviewId);

  if (error) {
    throw new Error(
      `Could not mark review ${reviewId} as processing: ${error.message}`
    );
  }
}

/**
 * Marks a review as analyzed.
 */
export async function markReviewAsAnalyzed(
  reviewId: number
): Promise<void> {
  validateReviewId(reviewId);

  const { error } =
    await supabase
      .from("imported_reviews")
      .update({
        analysis_status:
          "analyzed",
      })
      .eq("id", reviewId);

  if (error) {
    throw new Error(
      `Could not mark review ${reviewId} as analyzed: ${error.message}`
    );
  }
}

/**
 * Marks a review as failed.
 */
export async function markReviewAnalysisFailed(
  reviewId: number
): Promise<void> {
  validateReviewId(reviewId);

  const { error } =
    await supabase
      .from("imported_reviews")
      .update({
        analysis_status:
          "failed",
      })
      .eq("id", reviewId);

  if (error) {
    throw new Error(
      `Could not mark review ${reviewId} as failed: ${error.message}`
    );
  }
}
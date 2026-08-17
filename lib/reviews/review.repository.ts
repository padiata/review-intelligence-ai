import "server-only";

import {
  supabaseAdmin as supabase,
} from "@/lib/supabase/admin";

import type {
  NormalizedReview,
} from "../dataforseo";

function validateEntityId(
  entityId: number
): void {
  if (
    !Number.isInteger(entityId) ||
    entityId <= 0
  ) {
    throw new Error(
      "A valid entityId is required to import reviews."
    );
  }
}

export async function insertImportedReviews(
  reviews: NormalizedReview[],
  entityId: number
) {
  validateEntityId(entityId);

  const rows =
    reviews.map((review) => ({
      entity_id:
        entityId,

      source:
        review.source,

      source_review_id:
        review.sourceReviewId,

      property_name:
        review.propertyName,

      property_url:
        review.propertyUrl,

      review_title:
        review.reviewTitle,

      review_text:
        review.reviewText,

      rating:
        review.rating,

      review_date:
        review.reviewDate,

      visit_date:
        review.visitDate,

      language:
        review.language,

      original_language:
        review.originalLanguage,

      reviewer_name:
        review.reviewerName,

      reviewer_url:
        review.reviewerUrl,

      reviewer_reviews_count:
        review.reviewerReviewsCount,

      owner_response_text:
        review.ownerResponseText,

      owner_response_date:
        review.ownerResponseDate,

      owner_response_author:
        review.ownerResponseAuthor,

      raw_payload:
        review.rawPayload,

      analysis_status:
        "pending",
    }));

  const {
    data,
    error,
  } =
    await supabase
      .from("imported_reviews")
      .upsert(
        rows,
        {
          onConflict:
            "source,source_review_id",
        }
      )
      .select();

  if (error) {
    throw error;
  }

  return data;
}

export type ImportReviewsSummary = {
  normalizedCount: number;
  insertedCount: number;
  duplicateCount: number;
};

export async function insertImportedReviewsWithSummary(
  reviews: NormalizedReview[],
  entityId: number
): Promise<ImportReviewsSummary> {
  validateEntityId(entityId);

  const insertedRows =
    await insertImportedReviews(
      reviews,
      entityId
    );

  const insertedCount =
    insertedRows?.length ?? 0;

  return {
    normalizedCount:
      reviews.length,

    insertedCount,

    duplicateCount:
      reviews.length -
      insertedCount,
  };
}
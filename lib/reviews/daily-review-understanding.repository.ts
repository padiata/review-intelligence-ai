import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type DailyReviewUnderstandingRow = {
  id: number;

  entity_id: number;
  review_date: string;

  total_reviews: number;

  pending_reviews: number;
  processing_reviews: number;
  analyzed_reviews: number;
  failed_reviews: number;

  findings_created: number;

  needs_aggregation_rebuild: boolean;
  needs_snapshot_rebuild: boolean;

  last_review_analyzed_at: string | null;
  last_recalculated_at: string | null;

  created_at: string;
  updated_at: string;
};

export type DailyReviewUnderstandingStats = {
  entityId: number;
  reviewDate: string;

  totalReviews: number;

  pendingReviews: number;
  processingReviews: number;
  analyzedReviews: number;
  failedReviews: number;

  findingsCreated: number;
};

export type RecalculateDailyReviewUnderstandingResult = {
  entityId: number;
  reviewDate: string;

  totalReviews: number;
  analyzedReviews: number;
  failedReviews: number;
  findingsCreated: number;

  recalculated: boolean;
};

export type RecalculateDailyReviewUnderstandingDatesResult = {
  entityId: number;

  requestedDates: number;
  recalculatedCount: number;

  results: RecalculateDailyReviewUnderstandingResult[];
};

type ImportedReviewStatusRow = {
  id: number;
  analysis_status: string | null;
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

function normalizeDate(
  value: string
): string {
  const normalized =
    value.trim().slice(0, 10);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalized
    )
  ) {
    throw new Error(
      `Invalid review date: ${value}`
    );
  }

  const parsed =
    new Date(
      `${normalized}T00:00:00.000Z`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      `Invalid review date: ${value}`
    );
  }

  return normalized;
}

function getNextDate(
  date: string
): string {
  const parsed =
    new Date(
      `${date}T00:00:00.000Z`
    );

  parsed.setUTCDate(
    parsed.getUTCDate() + 1
  );

  return parsed
    .toISOString()
    .slice(0, 10);
}

function countStatuses(
  reviews: ImportedReviewStatusRow[]
) {
  let pendingReviews = 0;
  let processingReviews = 0;
  let analyzedReviews = 0;
  let failedReviews = 0;

  for (const review of reviews) {
    switch (
      review.analysis_status
    ) {
      case "pending":
        pendingReviews += 1;
        break;

      case "processing":
        processingReviews += 1;
        break;

      case "analyzed":
        analyzedReviews += 1;
        break;

      case "failed":
        failedReviews += 1;
        break;

      default:
        /*
         * Unknown or null statuses are not included in one
         * of the four recognized status counters.
         *
         * The total review count still includes the review.
         */
        break;
    }
  }

  return {
    pendingReviews,
    processingReviews,
    analyzedReviews,
    failedReviews,
  };
}

/**
 * Counts findings associated with a group of imported reviews.
 *
 * Review IDs are processed in chunks to avoid excessively
 * large `.in()` filters.
 */
async function countFindingsForReviewIds(
  reviewIds: number[]
): Promise<number> {
  if (
    reviewIds.length === 0
  ) {
    return 0;
  }

  const chunkSize = 500;

  let findingsCount = 0;

  for (
    let index = 0;
    index < reviewIds.length;
    index += chunkSize
  ) {
    const chunk =
      reviewIds.slice(
        index,
        index + chunkSize
      );

    const {
      count,
      error,
    } =
      await supabaseAdmin
        .from(
          "review_intelligence_findings"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .in(
          "imported_review_id",
          chunk
        );

    if (error) {
      throw new Error(
        `Could not count findings: ${error.message}`
      );
    }

    findingsCount +=
      count ?? 0;
  }

  return findingsCount;
}

/**
 * Reads the current source-of-truth state for one entity
 * and one review business date.
 *
 * The counters are rebuilt from imported_reviews and
 * review_intelligence_findings. They are not modified
 * incrementally.
 */
export async function getDailyReviewUnderstandingStats(
  entityId: number,
  reviewDate: string
): Promise<DailyReviewUnderstandingStats> {
  validateEntityId(
    entityId
  );

  const normalizedDate =
    normalizeDate(
      reviewDate
    );

  const nextDate =
    getNextDate(
      normalizedDate
    );

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "imported_reviews"
      )
      .select(`
        id,
        analysis_status
      `)
      .eq(
        "entity_id",
        entityId
      )
      .gte(
        "review_date",
        `${normalizedDate}T00:00:00.000Z`
      )
      .lt(
        "review_date",
        `${nextDate}T00:00:00.000Z`
      );

  if (error) {
    throw new Error(
      `Could not load reviews for ${normalizedDate}: ${error.message}`
    );
  }

  const reviews =
    (data ??
      []) as ImportedReviewStatusRow[];

  const reviewIds =
    reviews.map(
      (review) =>
        review.id
    );

  const {
    pendingReviews,
    processingReviews,
    analyzedReviews,
    failedReviews,
  } =
    countStatuses(
      reviews
    );

  const findingsCreated =
    await countFindingsForReviewIds(
      reviewIds
    );

  return {
    entityId,
    reviewDate:
      normalizedDate,

    totalReviews:
      reviews.length,

    pendingReviews,
    processingReviews,
    analyzedReviews,
    failedReviews,

    findingsCreated,
  };
}

/**
 * Rebuilds and persists one daily review-understanding row.
 *
 * When a review changes from failed to analyzed, this method
 * recalculates the complete business day and updates the
 * existing row with an upsert.
 */
export async function recalculateDailyReviewUnderstanding(
  entityId: number,
  reviewDate: string
): Promise<RecalculateDailyReviewUnderstandingResult> {
  const stats =
    await getDailyReviewUnderstandingStats(
      entityId,
      reviewDate
    );

  const now =
    new Date()
      .toISOString();

  /*
   * last_review_analyzed_at represents the moment when the
   * daily state was last rebuilt after understanding activity.
   *
   * If you later add analyzed_at to imported_reviews, this
   * value can instead be calculated from the latest analyzed
   * review in the business day.
   */
  const lastReviewAnalyzedAt =
    stats.analyzedReviews > 0
      ? now
      : null;

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "daily_review_understanding"
      )
      .upsert(
        {
          entity_id:
            stats.entityId,

          review_date:
            stats.reviewDate,

          total_reviews:
            stats.totalReviews,

          pending_reviews:
            stats.pendingReviews,

          processing_reviews:
            stats.processingReviews,

          analyzed_reviews:
            stats.analyzedReviews,

          failed_reviews:
            stats.failedReviews,

          findings_created:
            stats.findingsCreated,

          /*
           * Any change in daily understanding means that
           * downstream intelligence for this day may have
           * changed.
           */
          needs_aggregation_rebuild:
            true,

          needs_snapshot_rebuild:
            true,

          last_review_analyzed_at:
            lastReviewAnalyzedAt,

          last_recalculated_at:
            now,

          updated_at:
            now,
        },
        {
          onConflict:
            "entity_id,review_date",
        }
      );

  if (error) {
    throw new Error(
      `Could not persist daily review understanding for ${stats.reviewDate}: ${error.message}`
    );
  }

  return {
    entityId:
      stats.entityId,

    reviewDate:
      stats.reviewDate,

    totalReviews:
      stats.totalReviews,

    analyzedReviews:
      stats.analyzedReviews,

    failedReviews:
      stats.failedReviews,

    findingsCreated:
      stats.findingsCreated,

    recalculated: true,
  };
}

/**
 * Recalculates multiple business dates.
 *
 * Duplicates are removed before processing.
 */
export async function recalculateDailyReviewUnderstandingForDates(
  entityId: number,
  reviewDates: string[]
): Promise<RecalculateDailyReviewUnderstandingDatesResult> {
  validateEntityId(
    entityId
  );

  const normalizedDates =
    Array.from(
      new Set(
        reviewDates
          .filter(
            (
              reviewDate
            ): reviewDate is string =>
              typeof reviewDate ===
                "string" &&
              reviewDate.trim()
                .length > 0
          )
          .map(
            normalizeDate
          )
      )
    ).sort();

  const results:
    RecalculateDailyReviewUnderstandingResult[] =
      [];

  /*
   * Dates are intentionally recalculated sequentially.
   *
   * This avoids sending many simultaneous database queries
   * and makes failures easier to identify.
   */
  for (
    const reviewDate of normalizedDates
  ) {
    const result =
      await recalculateDailyReviewUnderstanding(
        entityId,
        reviewDate
      );

    results.push(
      result
    );
  }

  return {
    entityId,

    requestedDates:
      normalizedDates.length,

    recalculatedCount:
      results.length,

    results,
  };
}

/**
 * Returns the business days that require finding aggregation.
 */
export async function getDaysPendingAggregationRebuild(
  entityId: number,
  limit = 100
): Promise<DailyReviewUnderstandingRow[]> {
  validateEntityId(
    entityId
  );

  if (
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    throw new Error(
      "limit must be greater than zero."
    );
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "daily_review_understanding"
      )
      .select(`
        id,
        entity_id,
        review_date,
        total_reviews,
        pending_reviews,
        processing_reviews,
        analyzed_reviews,
        failed_reviews,
        findings_created,
        needs_aggregation_rebuild,
        needs_snapshot_rebuild,
        last_review_analyzed_at,
        last_recalculated_at,
        created_at,
        updated_at
      `)
      .eq(
        "entity_id",
        entityId
      )
      .eq(
        "needs_aggregation_rebuild",
        true
      )
      .order(
        "review_date",
        {
          ascending: true,
        }
      )
      .limit(
        limit
      );

  if (error) {
    throw new Error(
      `Could not load days pending aggregation: ${error.message}`
    );
  }

  return (
    data ?? []
  ) as DailyReviewUnderstandingRow[];
}

/**
 * Marks one business date as successfully aggregated.
 */
export async function markDailyAggregationRebuilt(
  entityId: number,
  reviewDate: string
): Promise<void> {
  validateEntityId(
    entityId
  );

  const normalizedDate =
    normalizeDate(
      reviewDate
    );

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "daily_review_understanding"
      )
      .update({
        needs_aggregation_rebuild:
          false,

        /*
         * The snapshot remains dirty until the snapshot
         * pipeline completes successfully.
         */
        needs_snapshot_rebuild:
          true,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "entity_id",
        entityId
      )
      .eq(
        "review_date",
        normalizedDate
      );

  if (error) {
    throw new Error(
      `Could not mark aggregation as rebuilt for ${normalizedDate}: ${error.message}`
    );
  }
}

/**
 * Marks one business date as having an updated snapshot.
 */
export async function markDailySnapshotRebuilt(
  entityId: number,
  reviewDate: string
): Promise<void> {
  validateEntityId(
    entityId
  );

  const normalizedDate =
    normalizeDate(
      reviewDate
    );

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "daily_review_understanding"
      )
      .update({
        needs_snapshot_rebuild:
          false,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "entity_id",
        entityId
      )
      .eq(
        "review_date",
        normalizedDate
      );

  if (error) {
    throw new Error(
      `Could not mark snapshot as rebuilt for ${normalizedDate}: ${error.message}`
    );
  }
}
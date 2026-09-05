import "server-only";

import {
  countPendingImportedReviews,
  getPendingImportedReviews,
  markReviewAnalysisFailed,
  markReviewAsAnalyzed,
  markReviewAsProcessing,
} from "../review-processor.repository";

import {
  recalculateDailyReviewUnderstandingForDates,
} from "../daily-review-understanding.repository";

import {
  buildTaxonomyPromptContext,
} from "../../taxonomy";

import {
  analyzeReviewWithAI,
} from "../ai/review-understanding.ai";

import {
  mapAnalysisForPersistence,
} from "../mappers/review-understanding.mapper";

import {
  replaceReviewUnderstanding,
} from "../repositories/review-understanding.repository";

import {
  createInternalFeedbackCasesForReview,
} from "./internal-feedback.service";

import {
  REVIEW_UNDERSTANDING_DEBUG,
} from "../constants/review-understanding.constants";

import type {
  ProcessAllPendingReviewsInput,
  ReviewProcessingItem,
  ReviewUnderstandingResult,
} from "../types/review-understanding.types";


console.log("mira aqui ");
console.log(REVIEW_UNDERSTANDING_DEBUG);


function logRU(step: string, data?: unknown): void {
  if (!REVIEW_UNDERSTANDING_DEBUG) return;

  const prefix =
    `[ReviewUnderstanding][${new Date().toISOString()}]`;

  if (data === undefined) {
    console.log(`${prefix} ${step}`);
    return;
  }

  console.log(`${prefix} ${step}`, data);
}

function logSeparator(): void {
  logRU(
    "--------------------------------------------------"
  );
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

function getErrorStack(
  error: unknown
): string | undefined {
  return error instanceof Error
    ? error.stack
    : undefined;
}

function normalizeReviewDate(
  value: string | Date | null | undefined
): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value
          .toISOString()
          .slice(0, 10);
  }

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return null;
  }

  const direct =
    /^\d{4}-\d{2}-\d{2}/.exec(
      value.trim()
    );

  if (direct) {
    return direct[0];
  }

  const parsed =
    new Date(value);

  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed
        .toISOString()
        .slice(0, 10);
}

function validatePositiveInteger(
  value: number,
  field: string
): void {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `${field} must be a positive integer.`
    );
  }
}

export async function processAllPendingReviews({
  entityId,
  domainId,
  batchSize = 10,
  maxReviews = 1000,
}: ProcessAllPendingReviewsInput): Promise<ReviewUnderstandingResult> {
  const pipelineStartedAt =
    Date.now();

  logSeparator();

  logRU(
    "PIPELINE_INITIALIZING",
    {
      entityId,
      domainId,
      batchSize,
      maxReviews,
    }
  );

  validatePositiveInteger(
    entityId,
    "entityId"
  );

  validatePositiveInteger(
    domainId,
    "domainId"
  );

  validatePositiveInteger(
    batchSize,
    "batchSize"
  );

  validatePositiveInteger(
    maxReviews,
    "maxReviews"
  );

  logRU(
    "INPUT_VALIDATION_OK"
  );

  const pendingAtStart =
    await countPendingImportedReviews(
      entityId
    );

  logRU(
    "PENDING_REVIEWS_COUNTED",
    {
      pendingAtStart,
    }
  );

  logRU(
    "BUILDING_TAXONOMY_CONTEXT",
    {
      domainId,
    }
  );

  const taxonomyStartedAt =
    Date.now();

  const taxonomyContext =
    await buildTaxonomyPromptContext(
      domainId
    );

  logRU(
    "TAXONOMY_CONTEXT_READY",
    {
      durationMs:
        Date.now() -
        taxonomyStartedAt,

      contextType:
        typeof taxonomyContext,

      contextPreview:
        typeof taxonomyContext ===
        "string"
          ? taxonomyContext.slice(
              0,
              1000
            )
          : taxonomyContext,
    }
  );

  const results:
    ReviewProcessingItem[] = [];

  const affectedReviewDates =
    new Set<string>();

  let processedCount = 0;
  let analyzedCount = 0;
  let failedCount = 0;
  let findingsCreated = 0;
  let relationshipsCreated = 0;
  let batchesProcessed = 0;

  logRU(
    "PIPELINE_START",
    {
      entityId,
      domainId,
      pendingAtStart,
      batchSize,
      maxReviews,
    }
  );

  while (
    processedCount <
    maxReviews
  ) {
    const limit =
      Math.min(
        batchSize,
        maxReviews -
          processedCount
      );

    logRU(
      "FETCHING_PENDING_BATCH",
      {
        batchNumber:
          batchesProcessed + 1,

        limit,
        processedCount,
      }
    );

    const reviews =
      await getPendingImportedReviews(
        entityId,
        limit
      );

    logRU(
      "PENDING_BATCH_FETCHED",
      {
        batchNumber:
          batchesProcessed + 1,

        reviewsFound:
          reviews.length,
      }
    );

    if (
      reviews.length === 0
    ) {
      logRU(
        "NO_MORE_PENDING_REVIEWS"
      );

      break;
    }

    batchesProcessed += 1;

    for (
      const review of reviews
    ) {
      const reviewStartedAt =
        Date.now();

      processedCount += 1;

      const reviewDate =
        normalizeReviewDate(
          review.review_date
        );

      if (reviewDate) {
        affectedReviewDates.add(
          reviewDate
        );
      }

      logSeparator();

      logRU(
        "REVIEW_START",
        {
          current:
            processedCount,

          maxReviews,

          reviewId:
            review.id,

          sourceReviewId:
            review.source_review_id,

          reviewDate,

          rating:
            "rating" in review
              ? review.rating
              : undefined,

          language:
            "language" in review
              ? review.language
              : undefined,

          textPreview:
            "review_text" in
              review &&
            typeof review.review_text ===
              "string"
              ? review.review_text.slice(
                  0,
                  500
                )
              : undefined,
        }
      );

      try {
        logRU(
          "MARKING_REVIEW_AS_PROCESSING",
          {
            reviewId:
              review.id,
          }
        );

        await markReviewAsProcessing(
          review.id
        );

        logRU(
          "REVIEW_MARKED_AS_PROCESSING",
          {
            reviewId:
              review.id,
          }
        );

        logRU(
          "CALLING_REVIEW_UNDERSTANDING_AI",
          {
            reviewId:
              review.id,
          }
        );

        const aiStartedAt =
          Date.now();

        const aiResult =
          await analyzeReviewWithAI(
            review,
            taxonomyContext
          );

        logRU(
          "AI_RESPONSE_RECEIVED",
          {
            reviewId:
              review.id,

            durationMs:
              Date.now() -
              aiStartedAt,

            findingsCount:
              aiResult.analysis
                .findings.length,

            relationshipsCount:
              aiResult.analysis
                .relationships
                .length,
          }
        );

        logRU(
          "AI_ANALYSIS_JSON",
          {
            reviewId:
              review.id,

            analysis:
              aiResult.analysis,
          }
        );

        logRU(
          "MAPPING_ANALYSIS_FOR_PERSISTENCE",
          {
            reviewId:
              review.id,
          }
        );

        const mappingStartedAt =
          Date.now();

        const persistence =
          mapAnalysisForPersistence(
            review.id,
            aiResult.analysis,
            aiResult.rawOutput
          );

        logRU(
          "ANALYSIS_MAPPED_FOR_PERSISTENCE",
          {
            reviewId:
              review.id,

            durationMs:
              Date.now() -
              mappingStartedAt,

            findingsCount:
              persistence
                .findings
                .length,

            relationshipsCount:
              persistence
                .relationships
                .length,
          }
        );

        logRU(
          "PERSISTENCE_PAYLOAD",
          {
            reviewId:
              review.id,

            findings:
              persistence.findings,

            relationships:
              persistence
                .relationships,
          }
        );

        logRU(
          "SAVING_REVIEW_UNDERSTANDING",
          {
            reviewId:
              review.id,
          }
        );

        const persistenceStartedAt =
          Date.now();

        const saved =
          await replaceReviewUnderstanding(
            review.id,
            persistence.findings,
            persistence.relationships
          );

        logRU(
          "REVIEW_UNDERSTANDING_SAVED",
          {
            reviewId:
              review.id,

            durationMs:
              Date.now() -
              persistenceStartedAt,

            findingsSaved:
              saved.findings.length,

            relationshipsSaved:
              saved.relationships
                .length,
          }
        );

        logRU(
          "MARKING_REVIEW_AS_ANALYZED",
          {
            reviewId:
              review.id,
          }
        );

        await markReviewAsAnalyzed(
          review.id
        );

        /*
         * Internal Feedback is a downstream process.
         *
         * Review Understanding is already complete at this point.
         * A failure in Internal Feedback must NOT mark the review
         * analysis as failed.
         */
        try {
          logRU(
            "INTERNAL_FEEDBACK_START",
            {
              reviewId:
                review.id,

              hotelId:
                entityId,
            }
          );

          const internalFeedbackResult =
            await createInternalFeedbackCasesForReview(
              {
                hotelId:
                  entityId,

                reviewId:
                  review.id,
              }
            );

          logRU(
            "INTERNAL_FEEDBACK_CASES_PROCESSED",
            {
              reviewId:
                review.id,

              result:
                internalFeedbackResult,
            }
          );
        } catch (
          feedbackError
        ) {
          console.error(
            `[InternalFeedback] Error creating cases for review ${review.id}:`,
            feedbackError
          );

          logRU(
            "INTERNAL_FEEDBACK_CASES_FAILED",
            {
              reviewId:
                review.id,

              error:
                getErrorMessage(
                  feedbackError
                ),

              stack:
                getErrorStack(
                  feedbackError
                ),
            }
          );
        }

        analyzedCount += 1;

        findingsCreated +=
          saved.findings.length;

        relationshipsCreated +=
          saved.relationships.length;

        results.push({
          reviewId:
            review.id,

          sourceReviewId:
            review.source_review_id,

          reviewDate,

          status:
            "analyzed",

          findingsSaved:
            saved.findings.length,

          relationshipsSaved:
            saved.relationships
              .length,
        });

        logRU(
          "REVIEW_COMPLETED",
          {
            reviewId:
              review.id,

            durationMs:
              Date.now() -
              reviewStartedAt,

            findingsSaved:
              saved.findings.length,

            relationshipsSaved:
              saved.relationships
                .length,
          }
        );
      } catch (error) {
        failedCount += 1;

        logRU(
          "REVIEW_FAILED",
          {
            reviewId:
              review.id,

            durationMs:
              Date.now() -
              reviewStartedAt,

            error:
              getErrorMessage(
                error
              ),

            stack:
              getErrorStack(
                error
              ),
          }
        );

        console.error(
          `[ReviewUnderstanding] Error processing review ${review.id}:`,
          error
        );

        try {
          logRU(
            "MARKING_REVIEW_AS_FAILED",
            {
              reviewId:
                review.id,
            }
          );

          await markReviewAnalysisFailed(
            review.id
          );

          logRU(
            "REVIEW_MARKED_AS_FAILED",
            {
              reviewId:
                review.id,
            }
          );
        } catch (
          statusError
        ) {
          logRU(
            "FAILED_TO_MARK_REVIEW_AS_FAILED",
            {
              reviewId:
                review.id,

              error:
                getErrorMessage(
                  statusError
                ),

              stack:
                getErrorStack(
                  statusError
                ),
            }
          );

          console.error(
            "Could not mark review as failed:",
            review.id,
            statusError
          );
        }

        results.push({
          reviewId:
            review.id,

          sourceReviewId:
            review.source_review_id,

          reviewDate,

          status:
            "failed",

          findingsSaved: 0,

          relationshipsSaved:
            0,

          error:
            getErrorMessage(
              error
            ),
        });
      } finally {
        logSeparator();
      }
    }

    logRU(
      "BATCH_COMPLETED",
      {
        batchNumber:
          batchesProcessed,

        processedCount,
        analyzedCount,
        failedCount,
        findingsCreated,
        relationshipsCreated,
      }
    );
  }

  const affectedDates =
    Array.from(
      affectedReviewDates
    ).sort();

  let dailyRowsRecalculated =
    0;

  if (
    affectedDates.length >
    0
  ) {
    logRU(
      "RECALCULATING_DAILY_REVIEW_UNDERSTANDING",
      {
        entityId,
        affectedDates,
      }
    );

    const dailyStartedAt =
      Date.now();

    const daily =
      await recalculateDailyReviewUnderstandingForDates(
        entityId,
        affectedDates
      );

    dailyRowsRecalculated =
      daily.recalculatedCount;

    logRU(
      "DAILY_REVIEW_UNDERSTANDING_RECALCULATED",
      {
        durationMs:
          Date.now() -
          dailyStartedAt,

        recalculatedCount:
          dailyRowsRecalculated,
      }
    );
  } else {
    logRU(
      "DAILY_RECALCULATION_SKIPPED",
      {
        reason:
          "No affected review dates.",
      }
    );
  }

  const pendingAtEnd =
    await countPendingImportedReviews(
      entityId
    );

  const result:
    ReviewUnderstandingResult = {
      entityId,
      domainId,
      pendingAtStart,
      processedCount,
      analyzedCount,
      failedCount,
      findingsCreated,
      relationshipsCreated,
      batchesProcessed,
      pendingAtEnd,
      affectedReviewDates:
        affectedDates,
      dailyRowsRecalculated,
      results,
    };

  logRU(
    "PIPELINE_COMPLETED",
    {
      durationMs:
        Date.now() -
        pipelineStartedAt,

      ...result,
    }
  );

  logSeparator();

  return result;
}

export async function processPendingReviews(
  entityId: number,
  domainId: number,
  limit = 5
): Promise<ReviewUnderstandingResult> {
  logRU(
    "PROCESS_PENDING_REVIEWS_ALIAS_CALLED",
    {
      entityId,
      domainId,
      limit,
    }
  );

  return processAllPendingReviews({
    entityId,
    domainId,
    batchSize:
      limit,
    maxReviews:
      limit,
  });
}
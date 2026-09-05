import "server-only";

import { NextRequest } from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import type {
  PendingImportedReview,
} from "@/lib/reviews/review-processor.repository";

import {
  markReviewAsProcessing,
  markReviewAsAnalyzed,
  markReviewAnalysisFailed,
} from "@/lib/reviews/review-processor.repository";

import {
  buildTaxonomyPromptContext,
} from "@/lib/taxonomy";

import {
  analyzeReviewWithAI,
} from "@/lib/reviews/ai/review-understanding.ai";

import {
  mapAnalysisForPersistence,
} from "@/lib/reviews/mappers/review-understanding.mapper";

import {
  replaceReviewUnderstanding,
} from "@/lib/reviews/repositories/review-understanding.repository";

import {
  createInternalFeedbackCasesForReview,
} from "@/lib/reviews/services/internal-feedback.service";


type TestOneBody = {
  reviewId: number;
  domainId?: number;
};


async function getReviewById(
  reviewId: number
): Promise<PendingImportedReview> {
  const {
    data,
    error,
  } =
    await supabaseAdmin
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
      .eq(
        "id",
        reviewId
      )
      .single();

  if (error) {
    throw new Error(
      `Could not load review ${reviewId}: ${error.message}`
    );
  }

  return data as PendingImportedReview;
}


export async function POST(
  request: NextRequest
) {
  let reviewId:
    number | undefined;

  try {
    const body =
      await request.json() as TestOneBody;

    reviewId =
      body.reviewId;

    const domainId =
      body.domainId ?? 2;

    if (
      !Number.isInteger(reviewId) ||
      !reviewId ||
      reviewId <= 0
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "A valid reviewId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(domainId) ||
      domainId <= 0
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "A valid domainId is required.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * Load ONLY the requested review.
     */
    const review =
      await getReviewById(
        reviewId
      );


    /*
     * We only want this endpoint
     * for controlled pending-review tests.
     */
    if (
      review.analysis_status !==
      "pending"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            `Review ${reviewId} is not pending.`,
          currentStatus:
            review.analysis_status,
        },
        {
          status: 409,
        }
      );
    }


    console.log(
      `[TestOne] Processing review ${review.id}`
    );


    await markReviewAsProcessing(
      review.id
    );


    const taxonomyContext =
      await buildTaxonomyPromptContext(
        domainId
      );


    const aiResult =
      await analyzeReviewWithAI(
        review,
        taxonomyContext
      );


    const persistence =
      mapAnalysisForPersistence(
        review.id,
        aiResult.analysis,
        aiResult.rawOutput
      );


    const saved =
      await replaceReviewUnderstanding(
        review.id,
        persistence.findings,
        persistence.relationships
      );


    await markReviewAsAnalyzed(
      review.id
    );


    /*
     * Run Internal Feedback only
     * after Review Understanding
     * has been saved successfully.
     */
    let internalFeedbackResult:
      unknown = null;

    try {
      internalFeedbackResult =
        await createInternalFeedbackCasesForReview({
          hotelId:
            review.entity_id,

          reviewId:
            review.id,
        });
    } catch (
      feedbackError
    ) {
      console.error(
        `[TestOne] Internal Feedback failed for review ${review.id}:`,
        feedbackError
      );

      internalFeedbackResult = {
        error:
          feedbackError instanceof Error
            ? feedbackError.message
            : String(
                feedbackError
              ),
      };
    }


    return Response.json({
      ok: true,

      review: {
        id:
          review.id,

        entityId:
          review.entity_id,

        sourceReviewId:
          review.source_review_id,

        propertyName:
          review.property_name,

        status:
          "analyzed",
      },

      reviewUnderstanding: {
        findingsSaved:
          saved.findings.length,

        relationshipsSaved:
          saved.relationships.length,

        findings:
          aiResult.analysis.findings,
      },

      internalFeedback:
        internalFeedbackResult,
    });
  } catch (error) {
    console.error(
      "[TestOne] Review processing failed:",
      error
    );

    /*
     * If processing itself failed,
     * mark only this review as failed.
     */
    if (
      reviewId &&
      Number.isInteger(reviewId)
    ) {
      try {
        await markReviewAnalysisFailed(
          reviewId
        );
      } catch (
        statusError
      ) {
        console.error(
          `[TestOne] Could not mark review ${reviewId} as failed:`,
          statusError
        );
      }
    }

    return Response.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
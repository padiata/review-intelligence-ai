import { NextResponse } from "next/server";

import {
  createInternalFeedbackCasesForReview,
} from "@/lib/reviews/services/internal-feedback.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const hotelId = Number(body.hotelId);
    const reviewId = Number(body.reviewId);

    const result =
      await createInternalFeedbackCasesForReview({
        hotelId,
        reviewId,
      });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(
      "[InternalFeedbackTest] Error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
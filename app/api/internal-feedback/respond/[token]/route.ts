import { NextResponse } from "next/server";

import {
  getInternalFeedbackCaseByToken,
} from "@/lib/reviews/repositories/internal-feedback-access.repository";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    const accessToken = token?.trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing access token.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await getInternalFeedbackCaseByToken(
        accessToken
      );

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          error: "Internal feedback case not found.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      feedbackCase,
      findings,
    } = result;

    if (
      feedbackCase.token_expires_at &&
      new Date(
        feedbackCase.token_expires_at
      ).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Access token has expired.",
        },
        {
          status: 410,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      case: {
        id: feedbackCase.id,
        reviewId:
          feedbackCase.imported_review_id,
        areaCode:
          feedbackCase.area_code,
        status:
          feedbackCase.status,
        contactId:
          feedbackCase.notification_contact_id,
        createdAt:
          feedbackCase.created_at,
      },
      findings,
    });
  } catch (error) {
    console.error(
      "[InternalFeedbackAccess] Error:",
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
import { NextResponse } from "next/server";

import {
  getInternalFeedbackCaseByToken,
} from "@/lib/reviews/repositories/internal-feedback-access.repository";

import {
  createInternalFeedbackResponse,
} from "@/lib/reviews/repositories/internal-feedback-responses.repository";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    const accessToken =
      token?.trim();

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

    const body =
      await request.json();

    const responseText =
      typeof body.responseText === "string"
        ? body.responseText.trim()
        : "";

    if (!responseText) {
      return NextResponse.json(
        {
          ok: false,
          error: "Response text is required.",
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

    const { feedbackCase } =
      result;

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

    if (
      feedbackCase.status ===
      "RESPONDED"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This case has already been responded to.",
        },
        {
          status: 409,
        }
      );
    }

    const response =
      await createInternalFeedbackResponse({
        internalFeedbackCaseId:
          feedbackCase.id,

        notificationContactId:
          feedbackCase.notification_contact_id,

        responseText,
      });

    return NextResponse.json({
      ok: true,
      response,
    });
  } catch (error) {
    console.error(
      "[InternalFeedbackResponse] Error:",
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
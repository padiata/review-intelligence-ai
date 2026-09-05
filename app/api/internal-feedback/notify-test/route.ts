import { NextResponse } from "next/server";

import {
  sendInternalFeedbackNotification,
} from "@/lib/reviews/services/internal-feedback-notification.service";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const caseId =
      Number(body.caseId);

    if (
      !Number.isInteger(caseId) ||
      caseId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "A valid caseId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await sendInternalFeedbackNotification(
        caseId
      );

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(
      "[InternalFeedbackNotifyTest] Error:",
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
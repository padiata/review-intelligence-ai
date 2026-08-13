import { NextResponse } from "next/server";

import {
  getAIProvider,
} from "@/lib/ai";

type ReviewInput = {
  id?: number;
  guest?: string;
  score?: number;
  title?: string;
  text?: string;
  language?: string;
  property?: string;
  source?: string;
};

type AnalysisRequest = {
  review?: ReviewInput;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as AnalysisRequest;

    const reviewText =
      body.review?.text?.trim();

    if (!reviewText) {
      return NextResponse.json(
        {
          error:
            "La review no contiene texto para analizar.",
        },
        {
          status: 400,
        }
      );
    }

    const ai =
      getAIProvider();

    const analysis =
      await ai.analyzeReview({
        id:
          body.review?.id ?? 0,

        guest:
          body.review?.guest ?? "",

        score:
          body.review?.score ?? 0,

        title:
          body.review?.title ?? "",

        text:
          reviewText,

        language:
          body.review?.language ?? "",

        property:
          body.review?.property ?? "",

        source:
          body.review?.source ?? "",
      });

    return NextResponse.json({
      analysis,
    });
  } catch (error) {
    console.error(
      "Error analizando la review:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido";

    return NextResponse.json(
      {
        error:
          `No se pudo analizar la review: ${message}`,
      },
      {
        status: 500,
      }
    );
  }
}
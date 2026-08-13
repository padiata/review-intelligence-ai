import { NextResponse } from "next/server";

import {
  getAIProvider,
} from "@/lib/ai";

type Tone =
  | "Profesional"
  | "Cálida"
  | "Breve";

type ReviewInput = {
  guest?: string;
  score?: number;
  title?: string;
  text?: string;
  language?: string;
  property?: string;
  source?: string;
};

type ReviewResponseRequest = {
  review?: ReviewInput;
  context?: string;
  tone?: Tone;
};

const allowedTones =
  new Set<Tone>([
    "Profesional",
    "Cálida",
    "Breve",
  ]);

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        ReviewResponseRequest;

    const reviewText =
      body.review?.text?.trim();

    if (!reviewText) {
      return NextResponse.json(
        {
          error:
            "La review no contiene texto para responder.",
        },
        {
          status: 400,
        }
      );
    }

    const tone =
      body.tone &&
      allowedTones.has(
        body.tone
      )
        ? body.tone
        : "Profesional";

    const ai =
      getAIProvider();

    const result =
      await ai.generateResponse({
        review: {
          id: 0,

          guest:
            body.review?.guest?.trim() ||
            "Huésped",

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
        },

        context:
          body.context ?? "",

        tone,
      });

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "Error generando respuesta de review:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido";

    return NextResponse.json(
      {
        error:
          `No se pudo generar la respuesta: ${message}`,
      },
      {
        status: 500,
      }
    );
  }
}
import { NextResponse } from "next/server";

import {
  getAIProvider,
} from "@/lib/ai";

type TranslateRequest = {
  text?: string;
  language?: string;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        TranslateRequest;

    const text =
      body.text?.trim();

    const targetLanguage =
      body.language;

    if (!text) {
      return NextResponse.json(
        {
          error:
            "El texto que desea traducir está vacío.",
        },
        {
          status: 400,
        }
      );
    }

    if (!targetLanguage) {
      return NextResponse.json(
        {
          error:
            "El idioma seleccionado no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const ai =
      getAIProvider();

    const result =
      await ai.translateText({
        text,
        language:
          targetLanguage,
      });

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "Error traduciendo respuesta:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido";

    return NextResponse.json(
      {
        error:
          `No se pudo traducir la respuesta: ${message}`,
      },
      {
        status: 500,
      }
    );
  }
}
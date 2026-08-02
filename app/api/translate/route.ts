import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedLanguages: Record<string, string> = {
  es: "español",
  en: "inglés",
  fr: "francés",
  de: "alemán",
  it: "italiano",
  pt: "portugués",
  ru: "ruso",
  zh: "chino simplificado",
  vi: "vietnamita",
};

type TranslateRequest = {
  text?: string;
  language?: string;
};




export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "La variable OPENAI_API_KEY no está configurada.",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as TranslateRequest;

    const text = body.text?.trim();
    const targetLanguage = body.language;
    

    if (!text) {
      return NextResponse.json(
        {
          error: "El texto que desea traducir está vacío.",
        },
        { status: 400 }
      );
    }

    if (
      !targetLanguage ||
      !allowedLanguages[targetLanguage]
    ) {
      return NextResponse.json(
        {
          error: "El idioma seleccionado no es válido.",
        },
        { status: 400 }
      );
    }

    const languageName =
      allowedLanguages[targetLanguage];

    const result = await openai.responses.create({
      model: "gpt-4.1-mini",

      instructions: `
Eres un traductor profesional especializado en respuestas
institucionales para huéspedes de hoteles.

Traduce el texto al ${languageName}.

Reglas:
- Conserva exactamente el significado.
- Mantén el tono profesional y cordial.
- Conserva los párrafos y los saltos de línea.
- No agregues explicaciones.
- No escribas etiquetas como "Traducción".
- Devuelve únicamente el texto traducido.
      `.trim(),

      input: text,
    });

    const translatedText =
      result.output_text?.trim();

    if (!translatedText) {
      return NextResponse.json(
        {
          error:
            "El servicio no devolvió una traducción.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translatedText,
      targetLanguage,
    });
  } catch (error) {
    console.error("Error traduciendo respuesta:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido";

    return NextResponse.json(
      {
        error: `No se pudo traducir la respuesta: ${message}`,
      },
      { status: 500 }
    );
  }
}
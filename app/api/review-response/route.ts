import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Tone = "Profesional" | "Cálida" | "Breve";

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

const allowedTones = new Set<Tone>([
  "Profesional",
  "Cálida",
  "Breve",
]);

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

    const body =
      (await request.json()) as ReviewResponseRequest;

    const reviewText = body.review?.text?.trim();
    const tone =
      body.tone && allowedTones.has(body.tone)
        ? body.tone
        : "Profesional";

    if (!reviewText) {
      return NextResponse.json(
        {
          error:
            "La review no contiene texto para responder.",
        },
        { status: 400 }
      );
    }

    const guest =
      body.review?.guest?.trim() || "Huésped";

    const reviewLanguage =
      body.review?.language?.trim() ||
      "no identificado";

    const context =
      body.context?.trim() ||
      "No se proporcionó contexto interno adicional.";

    const result = await openai.responses.create({
      model: "gpt-4",
      instructions: `
Eres un especialista en reputación hotelera.

Redacta una respuesta pública para una review de hotel.

Reglas:
- Responde en español.
- Usa un tono ${tone.toLowerCase()}.
- Sé cordial, humano y profesional.
- Agradece al huésped por compartir su experiencia.
- Reconoce los aspectos positivos cuando existan.
- Aborda los problemas mencionados sin discutir con el huésped.
- No inventes compensaciones, reparaciones ni acciones que no estén en el contexto interno.
- No reveles información interna del hotel.
- No incluyas la puntuación de forma explícita.
- No incluyas etiquetas como "Respuesta".
- Devuelve únicamente la respuesta final.
- Conserva párrafos breves.
      `.trim(),
      input: `
DATOS DE LA REVIEW

Huésped: ${guest}
Propiedad: ${body.review?.property ?? "No especificada"}
Fuente: ${body.review?.source ?? "No especificada"}
Idioma original: ${reviewLanguage}
Título: ${body.review?.title ?? "Sin título"}
Texto:
${reviewText}

CONTEXTO INTERNO
${context}
      `.trim(),
    });

    const responseText =
      result.output_text?.trim();

    if (!responseText) {
      return NextResponse.json(
        {
          error:
            "OpenAI no devolvió una respuesta.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: responseText,
    });
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
      { status: 500 }
    );
  }
}

import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

const allowedTones = new Set<Tone>([
  "Profesional",
  "Cálida",
  "Breve",
]);

export async function POST(
  request: Request
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "La variable OPENAI_API_KEY no está configurada.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      (await request.json()) as ReviewResponseRequest;

    const reviewText =
      body.review?.text?.trim();

    const tone =
      body.tone &&
      allowedTones.has(body.tone)
        ? body.tone
        : "Profesional";

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

    const guest =
      body.review?.guest?.trim() ||
      "Huésped";

    const reviewLanguage =
      body.review?.language?.trim() ||
      "no identificado";

    const context =
      body.context?.trim() ||
      "No se proporcionó contexto interno adicional.";

    const result =
      await openai.responses.create({
        model: "gpt-4",

        instructions: `
Eres un especialista en reputación hotelera y atención al huésped.

Tu tarea es redactar una respuesta pública para una review de hotel.

REGLAS OBLIGATORIAS

- Responde siempre en el mismo idioma utilizado por el huésped en la review.
- Usa el valor indicado en "Idioma original" como referencia adicional.
- Nunca traduzcas automáticamente la respuesta al español.
- Si la review está escrita en inglés, responde en inglés.
- Si está escrita en francés, responde en francés.
- Si está escrita en alemán, responde en alemán.
- Si está escrita en italiano, responde en italiano.
- Si está escrita en portugués, responde en portugués.
- Si está escrita en ruso, responde en ruso.
- Si está escrita en chino, responde en chino.
- Si está escrita en vietnamita, responde en vietnamita.
- Si está escrita en español, responde en español.
- Si el idioma indicado no coincide claramente con el texto de la review, utiliza el idioma real del texto de la review.

ESTILO

- Usa un tono ${tone.toLowerCase()}.
- Sé cordial, humano y profesional.
- Agradece al huésped por compartir su experiencia.
- Reconoce los aspectos positivos cuando existan.
- Aborda los problemas mencionados con empatía y sin discutir.
- No inventes compensaciones, reparaciones ni acciones que no aparezcan en el contexto interno.
- No reveles información interna del hotel.
- No menciones la puntuación de forma explícita.
- No incluyas encabezados como "Respuesta".
- No expliques qué idioma estás utilizando.
- Devuelve únicamente la respuesta final.
- Utiliza párrafos breves y naturales.
        `.trim(),

        input: `
DATOS DE LA REVIEW

Huésped:
${guest}

Propiedad:
${body.review?.property ?? "No especificada"}

Fuente:
${body.review?.source ?? "No especificada"}

Idioma original:
${reviewLanguage}

IMPORTANTE:
La respuesta final debe escribirse íntegramente en el mismo idioma de la review.

Título:
${body.review?.title ?? "Sin título"}

Texto de la review:
${reviewText}

CONTEXTO INTERNO:
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
        {
          status: 500,
        }
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
      {
        status: 500,
      }
    );
  }
}
import type {
  GenerateResponseInput,
} from "../types";

type Tone =
  | "Profesional"
  | "Cálida"
  | "Breve";

const allowedTones =
  new Set<Tone>([
    "Profesional",
    "Cálida",
    "Breve",
  ]);

function normalizeGuestName(
  guest?: string
): string | null {
  const value =
    guest?.trim() ?? "";

  if (!value) {
    return null;
  }

  const looksGenerated =
    /^guide\d+$/i.test(value) ||
    /^user\d+$/i.test(value) ||
    /^guest\d+$/i.test(value) ||
    /^\d+$/.test(value);

  if (looksGenerated) {
    return null;
  }

  return value;
}

export function buildReviewResponsePrompt(
  input: GenerateResponseInput
) {
  const reviewText =
    input.review.text?.trim();

  if (!reviewText) {
    throw new Error(
      "La review no contiene texto para responder."
    );
  }

  const requestedTone =
    input.tone as Tone;

  const tone =
    allowedTones.has(requestedTone)
      ? requestedTone
      : "Profesional";

  const guest =
    normalizeGuestName(
      input.review.guest
    );

  const reviewLanguage =
    input.review.language?.trim() ||
    "no identificado";

  const context =
    input.context?.trim() ||
    "No se proporcionó contexto interno adicional.";

  const instructions = `
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

SALUDO

- Solo utiliza el nombre del huésped en el saludo si "Nombre del huésped" contiene un nombre real.
- Si el nombre no está disponible o parece un identificador técnico, no inventes un nombre ni utilices ese identificador en el saludo.
- En ese caso, comienza directamente con un agradecimiento natural, sin encabezado personalizado.

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
  `.trim();

  const promptInput = `
DATOS DE LA REVIEW

Nombre del huésped:
${guest ?? "No disponible"}

Propiedad:
${input.review.property ?? "No especificada"}

Fuente:
${input.review.source ?? "No especificada"}

Idioma original:
${reviewLanguage}

IMPORTANTE:
La respuesta final debe escribirse íntegramente en el mismo idioma de la review.

Título:
${input.review.title ?? "Sin título"}

Texto de la review:
${reviewText}

CONTEXTO INTERNO:
${context}
  `.trim();

  return {
    instructions,
    input: promptInput,
  };
}
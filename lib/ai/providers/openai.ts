import OpenAI from "openai";

import type {
  AIProvider,
  AnalyzeReviewInput,
  AnalyzeReviewResult,
  GenerateResponseInput,
  GenerateResponseResult,
  TranslateTextInput,
  TranslateTextResult,
  TranslateTaxonomyNodeInput,
  TranslateTaxonomyNodeResult,
} from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analysisModel =
  process.env.AI_MODEL_ANALYSIS ??
  "gpt-4";

const responseModel =
  process.env.AI_MODEL_RESPONSE ??
  "gpt-4";

const translationModel =
  process.env.AI_MODEL_TRANSLATION ??
  "gpt-4.1-mini";



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

export class OpenAIProvider
  implements AIProvider
{
  ///////////////////////////////////////////////////////////////// analizaeRevie
 async analyzeReview(
  input: AnalyzeReviewInput
): Promise<AnalyzeReviewResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "La variable OPENAI_API_KEY no está configurada."
    );
  }

  const reviewText =
    input.text?.trim();

  if (!reviewText) {
    throw new Error(
      "La review no contiene texto para analizar."
    );
  }

  const result =
    await openai.responses.create({
      model:  analysisModel,

      instructions: `
Eres un analista de reputación hotelera.

Analiza la review y devuelve únicamente JSON válido.

Todo el análisis interno debe estar escrito en español.

Clasificaciones permitidas:
- sentiment: "Muy positivo", "Positivo", "Neutral", "Negativo moderado" o "Muy negativo".
- priority: "Baja", "Media", "Alta" o "Crítica".
- recommendation_probability: "Muy baja", "Baja", "Media", "Alta" o "Muy alta".

Criterios de prioridad:
- Baja: comentario positivo o sin incidencia operativa.
- Media: queja moderada sin riesgo inmediato.
- Alta: problema importante, reiterado o que requiere seguimiento.
- Crítica: seguridad, discriminación, fraude, salud grave o crisis reputacional.

Devuelve esta estructura exacta:
{
  "analysis": {
    "sentiment": "Positivo",
    "priority": "Baja",
    "summary": "Resumen ejecutivo breve",
    "positive_aspects": ["aspecto positivo"],
    "negative_aspects": ["aspecto negativo"],
    "detected_areas": ["área operativa"],
    "predominant_emotion": "Satisfacción",
    "recommendation_probability": "Alta"
  }
}
      `.trim(),

      input: `
DATOS DE LA REVIEW

Huésped: ${input.guest || "Huésped"}
Propiedad: ${input.property || "No especificada"}
Fuente: ${input.source || "No especificada"}
Puntuación: ${input.score || "No especificada"}
Idioma: ${input.language || "No identificado"}
Título: ${input.title || "Sin título"}

Texto:
${reviewText}
      `.trim(),
    });

  const rawOutput =
    result.output_text?.trim();

  if (!rawOutput) {
    throw new Error(
      "OpenAI no devolvió contenido."
    );
  }

  let parsed: {
    analysis?: Partial<AnalyzeReviewResult>;
  };

  try {
    const cleaned =
      rawOutput
        .replace(
          /^```json\s*/i,
          ""
        )
        .replace(
          /^```\s*/i,
          ""
        )
        .replace(
          /```$/i,
          ""
        )
        .trim();

    parsed =
      JSON.parse(cleaned);
  } catch {
    throw new Error(
      "El análisis no pudo interpretarse como JSON."
    );
  }

  const analysis =
    parsed.analysis;

  if (!analysis) {
    throw new Error(
      "OpenAI no devolvió el análisis esperado."
    );
  }

  return {
    sentiment:
      analysis.sentiment ??
      "Neutral",

    priority:
      analysis.priority ??
      "Media",

    summary:
      analysis.summary ??
      "",

    positive_aspects:
      Array.isArray(
        analysis.positive_aspects
      )
        ? analysis.positive_aspects
        : [],

    negative_aspects:
      Array.isArray(
        analysis.negative_aspects
      )
        ? analysis.negative_aspects
        : [],

    detected_areas:
      Array.isArray(
        analysis.detected_areas
      )
        ? analysis.detected_areas
        : [],

    predominant_emotion:
      analysis.predominant_emotion ??
      "Neutral",

    recommendation_probability:
      analysis.recommendation_probability ??
      "Media",
  };
}

  //////////////////////////////////////////////////////////////fin  analizaed

  async generateResponse(
    input: GenerateResponseInput
  ): Promise<GenerateResponseResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "La variable OPENAI_API_KEY no está configurada."
      );
    }

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
      allowedTones.has(
        requestedTone
      )
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

    const result =
      await openai.responses.create({
       model: responseModel,

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
        `.trim(),

        input: `
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
        `.trim(),
      });

    const responseText =
      result.output_text?.trim();

    if (!responseText) {
      throw new Error(
        "OpenAI no devolvió una respuesta."
      );
    }

    return {
      response: responseText,
    };
  }
///////////////////////////////////////////////////// Comienzo trnslate
async translateText(
  input: TranslateTextInput
): Promise<TranslateTextResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "La variable OPENAI_API_KEY no está configurada."
    );
  }

  const allowedLanguages:
    Record<string, string> = {
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

  const text =
    input.text?.trim();

  const targetLanguage =
    input.language;

  if (!text) {
    throw new Error(
      "El texto que desea traducir está vacío."
    );
  }

  if (
    !targetLanguage ||
    !allowedLanguages[targetLanguage]
  ) {
    throw new Error(
      "El idioma seleccionado no es válido."
    );
  }

  const languageName =
    allowedLanguages[targetLanguage];

  const result =
    await openai.responses.create({
      model: translationModel,

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
    throw new Error(
      "El servicio no devolvió una traducción."
    );
  }

  return {
    translatedText,
    targetLanguage,
  };
}

  //////////////////////////////////////////////////////fin translate

  async translateTaxonomyNode(
    input: TranslateTaxonomyNodeInput
  ): Promise<TranslateTaxonomyNodeResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "La variable OPENAI_API_KEY no está configurada."
      );
    }

    const localeLabels: Record<string, string> = {
      es: "Spanish",
      en: "English",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      "es-ES": "Spanish (Spain)",
      "es-MX": "Spanish (Mexico)",
      "en-US": "English (United States)",
      "en-GB": "English (United Kingdom)",
      "pt-BR": "Portuguese (Brazil)",
      "pt-PT": "Portuguese (Portugal)",
    };

    const sourceName =
      localeLabels[
        input.sourceLanguage
      ] ||
      input.sourceLanguage;

    const targetName =
      localeLabels[
        input.targetLanguage
      ] ||
      input.targetLanguage;

    const name =
      input.name?.trim();

    if (!name) {
      throw new Error(
        "El nombre de taxonomía está vacío."
      );
    }

    const description =
      input.description?.trim() || null;

    const result =
      await openai.responses.create({
        model: translationModel,

        instructions: `
You are a professional localization specialist for a hotel
review-intelligence taxonomy.

Translate one taxonomy node from ${sourceName} to ${targetName}.

Context:
- Domain: ${input.domainName || "Hotel / hospitality"}
- Node type: ${input.nodeType}
- The translated terminology will be used in an operational taxonomy and
  may also be shown to an AI review-understanding system.

Rules:
- Preserve the exact operational meaning.
- Prefer standard hospitality terminology used by hotels.
- Translate the name naturally, not word-for-word when a standard hotel term exists.
- Keep the name concise and suitable for a taxonomy label.
- Keep the description precise and neutral.
- Do not invent new concepts or add information.
- If the description is null, return null.
- Return ONLY valid JSON, with exactly these keys:
  {
    "name": "translated name",
    "description": "translated description or null"
  }
        `.trim(),

        input: JSON.stringify({
          name,
          description,
        }),
      });

    const raw =
      result.output_text?.trim();

    if (!raw) {
      throw new Error(
        "OpenAI no devolvió una traducción de taxonomía."
      );
    }

    let parsed: {
      name?: unknown;
      description?: unknown;
    };

    try {
      const cleaned =
        raw
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/i, "")
          .trim();

      parsed =
        JSON.parse(cleaned);
    } catch {
      throw new Error(
        "La traducción de taxonomía no pudo interpretarse como JSON."
      );
    }

    const translatedName =
      typeof parsed.name === "string"
        ? parsed.name.trim()
        : "";

    const translatedDescription =
      parsed.description === null
        ? null
        : typeof parsed.description === "string"
          ? parsed.description.trim() || null
          : null;

    if (!translatedName) {
      throw new Error(
        "La IA no devolvió un nombre traducido válido."
      );
    }

    return {
      name: translatedName,
      description: translatedDescription,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
    };
  }
}
import type {
  AnalyzeReviewInput,
} from "../types";

export function buildReviewAnalysisPrompt(
  input: AnalyzeReviewInput
) {
  const reviewText =
    input.text?.trim();

  if (!reviewText) {
    throw new Error(
      "La review no contiene texto para analizar."
    );
  }

  const instructions = `
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
  `.trim();

  const promptInput = `
DATOS DE LA REVIEW

Huésped: ${input.guest || "Huésped"}
Propiedad: ${input.property || "No especificada"}
Fuente: ${input.source || "No especificada"}
Puntuación: ${input.score || "No especificada"}
Idioma: ${input.language || "No identificado"}
Título: ${input.title || "Sin título"}

Texto:
${reviewText}
  `.trim();

  return {
    instructions,
    input: promptInput,
  };
}
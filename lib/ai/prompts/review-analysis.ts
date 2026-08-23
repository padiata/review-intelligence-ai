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

Analiza la review y devuelve exclusivamente la estructura JSON solicitada.

REGLA DE IDIOMA
- Los campos estructurados sentiment, priority, detected_areas, predominant_emotion y recommendation_probability deben usar exclusivamente los códigos canónicos en inglés indicados abajo.
- Los campos de texto libre summary, positive_aspects y negative_aspects deben escribirse en español por ahora.
- No traduzcas ni reformules el texto original de la review.

SENTIMENT - valores permitidos
- very_positive
- positive
- neutral
- moderately_negative
- very_negative

PRIORITY - valores permitidos
- low
- medium
- high
- critical

Criterios de prioridad:
- low: comentario positivo o sin incidencia operativa.
- medium: queja moderada sin riesgo inmediato.
- high: problema importante, reiterado o que requiere seguimiento.
- critical: seguridad, discriminación, fraude, salud grave o crisis reputacional.

RECOMMENDATION_PROBABILITY - valores permitidos
- very_low
- low
- medium
- high
- very_high

PREDOMINANT_EMOTION - valores permitidos
- satisfaction
- gratitude
- enthusiasm
- neutral
- disappointment
- frustration
- anger
- concern

DETECTED_AREAS - usa exclusivamente uno o más de estos códigos cuando corresponda
- cleanliness: limpieza e higiene general
- staff_service: atención, trato y servicio del personal
- room: habitación, tamaño, mobiliario o estado general
- bathroom: baño, ducha, agua o equipamiento del baño
- food_beverage: alimentos, bebidas, restaurantes o bares
- breakfast: desayuno
- location: ubicación y entorno
- facilities: instalaciones y servicios generales
- maintenance: averías, mantenimiento o estado técnico
- comfort: comodidad, cama, climatización o descanso
- noise: ruido
- wifi: internet o conectividad Wi-Fi
- pool: piscina
- beach: playa
- value: relación calidad-precio
- check_in: llegada o check-in
- check_out: salida o check-out
- booking: reserva, modificaciones o problemas de booking
- accessibility: accesibilidad
- security: seguridad
- other: tema relevante que no encaje en otra categoría

Reglas para detected_areas:
- Devuelve códigos únicos, sin duplicados.
- No inventes categorías nuevas.
- Usa other solo cuando ninguna categoría específica sea adecuada.
- Si una review menciona varias áreas relevantes, devuelve todas las que correspondan.

Los aspectos positivos y negativos deben ser frases cortas, concretas y basadas únicamente en la review.
El summary debe ser un resumen ejecutivo breve y objetivo.
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

import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

type ReviewAnalysis = {
  sentiment: string;
  priority: string;
  summary: string;
  positive_aspects: string[];
  negative_aspects: string[];
  detected_areas: string[];
  predominant_emotion: string;
  recommendation_probability: string;
};

type AnalysisRequest = {
  review?: ReviewInput;
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

    const body =
      (await request.json()) as AnalysisRequest;

    const reviewText = body.review?.text?.trim();

    if (!reviewText) {
      return NextResponse.json(
        {
          error:
            "La review no contiene texto para analizar.",
        },
        { status: 400 }
      );
    }

    const result = await openai.responses.create({
      model: "gpt-4",
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

Huésped: ${body.review?.guest ?? "Huésped"}
Propiedad: ${body.review?.property ?? "No especificada"}
Fuente: ${body.review?.source ?? "No especificada"}
Puntuación: ${body.review?.score ?? "No especificada"}
Idioma: ${body.review?.language ?? "No identificado"}
Título: ${body.review?.title ?? "Sin título"}

Texto:
${reviewText}
      `.trim(),
    });

    const rawOutput = result.output_text?.trim();

    if (!rawOutput) {
      return NextResponse.json(
        {
          error:
            "OpenAI no devolvió contenido.",
        },
        { status: 500 }
      );
    }

    let parsed: {
      analysis?: Partial<ReviewAnalysis>;
    };

    try {
      const cleaned = rawOutput
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          error:
            "El análisis no pudo interpretarse como JSON.",
        },
        { status: 500 }
      );
    }

    const analysis = parsed.analysis;

    if (!analysis) {
      return NextResponse.json(
        {
          error:
            "OpenAI no devolvió el análisis esperado.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      analysis: {
        sentiment:
          analysis.sentiment ?? "Neutral",
        priority:
          analysis.priority ?? "Media",
        summary:
          analysis.summary ?? "",
        positive_aspects: Array.isArray(
          analysis.positive_aspects
        )
          ? analysis.positive_aspects
          : [],
        negative_aspects: Array.isArray(
          analysis.negative_aspects
        )
          ? analysis.negative_aspects
          : [],
        detected_areas: Array.isArray(
          analysis.detected_areas
        )
          ? analysis.detected_areas
          : [],
        predominant_emotion:
          analysis.predominant_emotion ?? "Neutral",
        recommendation_probability:
          analysis.recommendation_probability ??
          "Media",
      },
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
      { status: 500 }
    );
  }
}

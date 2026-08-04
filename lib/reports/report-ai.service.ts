import "server-only";

import OpenAI from "openai";

import type {
  ExecutiveReport,
  OperationalPriority,
  PositiveHighlight,
} from "./report.types";

import type {
  PreparedReportData,
} from "./report-builder.service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AIReportOutput = {
  executiveSummary: string;

  operationalPriorities: Array<{
    title: string;
    areaCode: string | null;
    causeCode: string | null;
    priority: string;
    summary: string;
    impact: string;
    evidence: string[];
    recommendedAction: string;
  }>;

  positiveHighlights: Array<{
    title: string;
    summary: string;
    evidence: string[];
  }>;

  recommendations: string[];
};

function compactPreparedData(
  prepared: PreparedReportData
) {
  return {
    entity: prepared.entity,
    period: prepared.period,

    reviewCount: prepared.reviewCount,
    findingCount: prepared.findingCount,

    operationalPriorities:
      prepared.groupedOperationalPriorities.map(
        (priority) => ({
          title: priority.title,
          areaCode: priority.areaCode,
          causeCode: priority.causeCode,
          priority: priority.priority,
          summary: priority.summary,
          evidence: priority.evidence.slice(
            0,
            4
          ),
        })
      ),

    positiveHighlights:
      prepared.positiveHighlights.map(
        (highlight) => ({
          title: highlight.title,
          summary: highlight.summary,
          evidence: highlight.evidence.slice(
            0,
            3
          ),
        })
      ),
  };
}

function normalizeOperationalPriorities(
  values: AIReportOutput["operationalPriorities"]
): OperationalPriority[] {
  return values.map((item) => ({
    title:
      item.title?.trim() ||
      "Prioridad operativa",

    areaCode:
      item.areaCode ?? null,

    causeCode:
      item.causeCode ?? null,

    priority:
      item.priority?.trim() ||
      "medium",

    summary:
      item.summary?.trim() || "",

    impact:
      item.impact?.trim() || "",

    evidence:
      Array.isArray(item.evidence)
        ? item.evidence
            .map((value) =>
              String(value).trim()
            )
            .filter(Boolean)
            .slice(0, 5)
        : [],

    recommendedAction:
      item.recommendedAction?.trim() ||
      "",
  }));
}

function normalizePositiveHighlights(
  values: AIReportOutput["positiveHighlights"]
): PositiveHighlight[] {
  return values.map((item) => ({
    title:
      item.title?.trim() ||
      "Aspecto positivo",

    summary:
      item.summary?.trim() || "",

    evidence:
      Array.isArray(item.evidence)
        ? item.evidence
            .map((value) =>
              String(value).trim()
            )
            .filter(Boolean)
            .slice(0, 4)
        : [],
  }));
}

export async function generateExecutiveReport(
  prepared: PreparedReportData
): Promise<ExecutiveReport> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "La variable OPENAI_API_KEY no está configurada."
    );
  }

  if (prepared.findingCount === 0) {
    throw new Error(
      "No existen findings para generar el informe."
    );
  }

  const compactData =
    compactPreparedData(prepared);

  const result =
    await openai.responses.create({
      model: "gpt-4",

      instructions: `
Eres un consultor senior especializado en operaciones hoteleras y reputación.

Debes redactar un informe ejecutivo no estadístico basado exclusivamente en findings estructurados.

OBJETIVO

Transformar los findings operativos en un documento claro, breve, accionable y útil para la dirección de un hotel.

REGLAS OBLIGATORIAS

- Escribe el informe en español.
- No inventes hechos, causas, incidencias, acciones realizadas ni compensaciones.
- No agregues recomendaciones que no estén razonablemente vinculadas a los findings recibidos.
- No uses porcentajes salvo que aparezcan explícitamente en los datos de entrada.
- No conviertas el informe en un dashboard estadístico.
- No menciones códigos internos en los títulos redactados para el usuario.
- Los códigos areaCode y causeCode deben conservarse únicamente en sus campos correspondientes.
- No repitas la misma evidencia en varias prioridades, salvo que sea imprescindible.
- No exageres la gravedad de los findings.
- Distingue claramente problemas operativos y aspectos positivos.
- Las recomendaciones deben ser concretas, prudentes y ejecutables.
- Devuelve exclusivamente JSON válido.
- No incluyas texto antes ni después del JSON.

ESTRUCTURA ESPERADA

{
  "executiveSummary": "Resumen ejecutivo de 2 a 4 párrafos.",
  "operationalPriorities": [
    {
      "title": "Título legible",
      "areaCode": "código o null",
      "causeCode": "código o null",
      "priority": "critical | high | medium | low",
      "summary": "Descripción clara del problema.",
      "impact": "Impacto operativo o en la experiencia del huésped.",
      "evidence": ["evidencia real"],
      "recommendedAction": "Acción sugerida."
    }
  ],
  "positiveHighlights": [
    {
      "title": "Fortaleza destacada",
      "summary": "Explicación breve.",
      "evidence": ["evidencia real"]
    }
  ],
  "recommendations": [
    "Recomendación concreta"
  ]
}
      `.trim(),

      input: `
HOTEL

${prepared.entity.name}

PERÍODO

Desde:
${prepared.period.startDate}

Hasta:
${prepared.period.endDate}

BASE DOCUMENTAL

Reviews utilizadas:
${prepared.reviewCount}

Findings utilizados:
${prepared.findingCount}

DATOS PREPARADOS

${JSON.stringify(
  compactData,
  null,
  2
)}
      `.trim(),
    });

  const outputText =
    result.output_text?.trim();

  if (!outputText) {
    throw new Error(
      "OpenAI no devolvió contenido para el informe."
    );
  }

  let parsed: AIReportOutput;

  try {
    parsed =
      JSON.parse(outputText) as AIReportOutput;
  } catch {
    throw new Error(
      "OpenAI devolvió un informe con formato JSON inválido."
    );
  }

  if (
    !parsed.executiveSummary ||
    !Array.isArray(
      parsed.operationalPriorities
    ) ||
    !Array.isArray(
      parsed.positiveHighlights
    ) ||
    !Array.isArray(
      parsed.recommendations
    )
  ) {
    throw new Error(
      "OpenAI devolvió una estructura de informe incompleta."
    );
  }

  return {
    entityId:
      prepared.entity.id,

    entityName:
      prepared.entity.name,

    period:
      prepared.period,

    generatedAt:
      new Date().toISOString(),

    synchronizedUntil:
      prepared.synchronizedUntil,

    reviewCount:
      prepared.reviewCount,

    findingCount:
      prepared.findingCount,

    executiveSummary:
      parsed.executiveSummary.trim(),

    operationalPriorities:
      normalizeOperationalPriorities(
        parsed.operationalPriorities
      ),

    positiveHighlights:
      normalizePositiveHighlights(
        parsed.positiveHighlights
      ),

    recommendations:
      parsed.recommendations
        .map((value) =>
          String(value).trim()
        )
        .filter(Boolean)
        .slice(0, 10),

    findings:
      prepared.findings,
  };
}
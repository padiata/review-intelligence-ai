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
    evidence: string[];
  }>;

  positiveHighlights: Array<{
    title: string;
    summary: string;
    evidence: string[];
  }>;

  methodologicalNote: string;
};

function compactPreparedData(
  prepared: PreparedReportData
) {
  return {
    entity: prepared.entity,

    period: prepared.period,

    reviewCount:
      prepared.reviewCount,

    findingCount:
      prepared.findingCount,

    operationalPriorities:
      prepared.groupedOperationalPriorities.map(
        (priority) => ({
          title:
            priority.title,

          areaCode:
            priority.areaCode,

          causeCode:
            priority.causeCode,

          priority:
            priority.priority,

          summary:
            priority.summary,

          evidence:
            priority.evidence.slice(
              0,
              4
            ),

          evidenceCount:
            priority.evidence.length,
        })
      ),

    positiveHighlights:
      prepared.positiveHighlights.map(
        (highlight) => ({
          title:
            highlight.title,

          summary:
            highlight.summary,

          evidence:
            highlight.evidence.slice(
              0,
              3
            ),

          evidenceCount:
            highlight.evidence.length,
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
      "Hallazgo relevante",

    areaCode:
      item.areaCode ?? null,

    causeCode:
      item.causeCode ?? null,

    priority:
      item.priority?.trim() ||
      "medium",

    summary:
      item.summary?.trim() ||
      "",

    evidence:
      Array.isArray(
        item.evidence
      )
        ? item.evidence
            .map((value) =>
              String(value).trim()
            )
            .filter(Boolean)
            .slice(0, 5)
        : [],
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
      item.summary?.trim() ||
      "",

    evidence:
      Array.isArray(
        item.evidence
      )
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
  if (
    !process.env.OPENAI_API_KEY
  ) {
    throw new Error(
      "La variable OPENAI_API_KEY no está configurada."
    );
  }

  if (
    prepared.findingCount === 0
  ) {
    throw new Error(
      "No existen findings para generar el informe."
    );
  }

  const compactData =
    compactPreparedData(
      prepared
    );

  const result =
    await openai.responses.create({
      model: "gpt-4",

      instructions: `
Eres un analista especializado en reputación y operaciones hoteleras.

Debes redactar un informe ejecutivo no estadístico basado exclusivamente en los findings estructurados recibidos.

OBJETIVO

Transformar los findings en un documento breve, claro y prudente que ayude a la dirección del hotel a comprender lo observado durante el período.

Tu función es describir, contextualizar y organizar la información.

No debes sustituir el criterio profesional de los directivos ni indicarles qué decisiones deben tomar.

REGLAS OBLIGATORIAS

- Escribe todo el informe en español.
- Utiliza exclusivamente la información recibida.
- No inventes hechos, causas, incidencias, explicaciones, acciones realizadas ni compensaciones.
- No formules recomendaciones ni acciones sugeridas.
- No indiques qué debería hacer la dirección.
- No realices diagnósticos técnicos.
- No atribuyas causas que no estén expresamente respaldadas por los findings.
- No uses porcentajes salvo que estén expresamente incluidos en los datos.
- No conviertas el informe en un dashboard estadístico.
- No menciones códigos internos en los títulos visibles para el usuario.
- Conserva areaCode y causeCode únicamente en sus campos JSON.
- No exageres la gravedad de los hallazgos.
- No repitas innecesariamente la misma evidencia.
- Devuelve exclusivamente JSON válido.
- No incluyas texto antes ni después del JSON.

NIVEL DE CERTEZA

- Ajusta siempre el lenguaje a la cantidad y fuerza de la evidencia disponible.
- No presentes un finding aislado como una condición general del hotel.
- Si un tema aparece en una sola opinión, descríbelo como una incidencia puntual, una observación individual o una señal aislada.
- Si aparece en varias opiniones independientes, puede describirse como una señal que merece seguimiento.
- Solo utiliza términos como "patrón recurrente", "tendencia" o "situación generalizada" cuando la evidencia recibida lo respalde claramente.
- Cuando la base documental sea limitada, indícalo expresamente en el resumen ejecutivo.
- Prefiere expresiones prudentes como:
  "se reportó",
  "se observó",
  "la opinión analizada señala",
  "la evidencia disponible sugiere",
  "podría indicar",
  "merece seguimiento".
- Evita expresiones categóricas como:
  "el hotel presenta",
  "existe un problema general",
  "los huéspedes consideran",
  "la situación demuestra",
  salvo que exista evidencia suficiente y claramente repetida.
- Distingue entre incidencias puntuales, señales emergentes, patrones recurrentes y aspectos positivos.

CONTENIDO DEL INFORME

El informe debe contener únicamente:

1. Un resumen ejecutivo.
2. Hallazgos relevantes.
3. Aspectos positivos.
4. Una nota metodológica.

No incluyas:

- recomendaciones;
- acciones sugeridas;
- impacto operativo estimado;
- instrucciones para la dirección;
- anexos;
- listas completas de findings.

ESTRUCTURA JSON ESPERADA

{
  "executiveSummary": "Resumen ejecutivo prudente de 2 a 4 párrafos. Debe explicar el alcance del período y señalar las limitaciones de la evidencia cuando corresponda.",
  "operationalPriorities": [
    {
      "title": "Título claro y legible para el usuario",
      "areaCode": "código interno o null",
      "causeCode": "código interno o null",
      "priority": "critical | high | medium | low",
      "summary": "Descripción prudente, clara y proporcional a la evidencia disponible.",
      "evidence": [
        "Evidencia real recibida en los datos"
      ]
    }
  ],
  "positiveHighlights": [
    {
      "title": "Fortaleza o aspecto positivo identificado",
      "summary": "Descripción breve y prudente.",
      "evidence": [
        "Evidencia real recibida en los datos"
      ]
    }
  ],
  "methodologicalNote": "Nota breve indicando que el informe sintetiza las opiniones del período, que los hallazgos deben interpretarse según la cantidad de evidencia disponible y que su valoración final corresponde a la dirección del establecimiento."
}
      `.trim(),

      input: `
HOTEL

${prepared.entity.name}

PERÍODO DE LAS OPINIONES

Desde:
${prepared.period.startDate}

Hasta:
${prepared.period.endDate}

BASE DOCUMENTAL

Número de reviews utilizadas:
${prepared.reviewCount}

Número de findings utilizados:
${prepared.findingCount}

IMPORTANTE

La cantidad de reviews y findings determina el nivel de certeza permitido.

Si la base documental es reducida, debes declararlo expresamente y evitar conclusiones generales sobre el hotel.

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
      JSON.parse(
        outputText
      ) as AIReportOutput;
  } catch {
    console.error(
      "Contenido inválido devuelto por OpenAI:",
      outputText
    );

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
    !parsed.methodologicalNote
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

    methodologicalNote:
      parsed.methodologicalNote.trim(),

    // Se conservan para trazabilidad y para report_history.
    // No es necesario mostrarlos en la interfaz.
    findings:
      prepared.findings,
  };
}
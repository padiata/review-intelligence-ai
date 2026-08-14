import OpenAI from "openai";

import type {
  AIProvider,
  AnalyzeReviewInput,
  AnalyzeReviewResult,
  GenerateResponseInput,
  GenerateResponseResult,
  TranslateTextInput,
  TranslateTextResult,
  GenerateExecutiveReportInput,
  GenerateExecutiveReportResult,
  AnalyzeReviewUnderstandingInput,
  AnalyzeReviewUnderstandingResult,
} from "../types";

import type {
  OperationalPriority,
  PositiveHighlight,
} from "@/lib/reports/report.types";

import {
  REVIEW_UNDERSTANDING_MODEL,
} from "@/lib/reviews/constants/review-understanding.constants";

import {
  validateReviewUnderstandingAnalysis,
} from "@/lib/reviews/validators/review-understanding.validator";

import {
  buildReviewUnderstandingPrompt,
} from "@/lib/reviews/ai/prompts/review-understanding.prompt";

import {
  buildReviewResponsePrompt,
} from "../prompts/review-response";

import {
  buildReviewAnalysisPrompt,
} from "../prompts/review-analysis";

import {
  buildTranslationPrompt,
} from "../prompts/translation";

import {
  buildExecutiveReportPrompt,
} from "../prompts/executive-report";

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

const reportModel =
  process.env.AI_MODEL_REPORT ??
  "gpt-4.1";

const understandingModel =
  process.env.AI_MODEL_UNDERSTANDING ??
  REVIEW_UNDERSTANDING_MODEL;

type AIReportOutput = {
  executiveSummary: string;

  operationalPriorities: Array<{
    title: string;
    areaCode: string | null;
    causeCode: string | null;
    priority:
      | "critical"
      | "high"
      | "medium"
      | "low";
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

function cleanJsonOutput(
  value: string
) {
  return value
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
}

function normalizeOperationalPriorities(
  values: AIReportOutput["operationalPriorities"]
): OperationalPriority[] {
  return values.map(
    (item) => ({
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
              .map(
                (value) =>
                  String(
                    value
                  ).trim()
              )
              .filter(Boolean)
              .slice(0, 5)
          : [],
    })
  );
}

function normalizePositiveHighlights(
  values: AIReportOutput["positiveHighlights"]
): PositiveHighlight[] {
  return values.map(
    (item) => ({
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
              .map(
                (value) =>
                  String(
                    value
                  ).trim()
              )
              .filter(Boolean)
              .slice(0, 4)
          : [],
    })
  );
}

export class OpenAIProvider
  implements AIProvider
{
  /////////////////////////////////////////////////////////////////
  // ANALYZE REVIEW
  /////////////////////////////////////////////////////////////////

  async analyzeReview(
    input: AnalyzeReviewInput
  ): Promise<AnalyzeReviewResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "La variable OPENAI_API_KEY no está configurada."
      );
    }

    const prompt =
      buildReviewAnalysisPrompt(
        input
      );

    const result =
      await openai.responses.create({
        model: analysisModel,

        instructions:
          prompt.instructions,

        input:
          prompt.input,
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
        cleanJsonOutput(
          rawOutput
        );

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

  /////////////////////////////////////////////////////////////////
  // GENERATE RESPONSE
  /////////////////////////////////////////////////////////////////

  async generateResponse(
    input: GenerateResponseInput
  ): Promise<GenerateResponseResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "La variable OPENAI_API_KEY no está configurada."
      );
    }

    const prompt =
      buildReviewResponsePrompt(
        input
      );

    const result =
      await openai.responses.create({
        model: responseModel,

        instructions:
          prompt.instructions,

        input:
          prompt.input,
      });

    const responseText =
      result.output_text?.trim();

    if (!responseText) {
      throw new Error(
        "OpenAI no devolvió una respuesta."
      );
    }

    return {
      response:
        responseText,
    };
  }

  /////////////////////////////////////////////////////////////////
  // TRANSLATE
  /////////////////////////////////////////////////////////////////

  async translateText(
    input: TranslateTextInput
  ): Promise<TranslateTextResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "La variable OPENAI_API_KEY no está configurada."
      );
    }

    const prompt =
      buildTranslationPrompt(
        input
      );

    const result =
      await openai.responses.create({
        model: translationModel,

        instructions:
          prompt.instructions,

        input:
          prompt.input,
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

      targetLanguage:
        prompt.targetLanguage,
    };
  }

  /////////////////////////////////////////////////////////////////
  // EXECUTIVE REPORT
  /////////////////////////////////////////////////////////////////

  async generateExecutiveReport(
    prepared: GenerateExecutiveReportInput
  ): Promise<GenerateExecutiveReportResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "La variable OPENAI_API_KEY no está configurada."
      );
    }

    const prompt =
      buildExecutiveReportPrompt(
        prepared
      );

    const result =
      await openai.responses.create({
        model: reportModel,

        instructions:
          prompt.instructions,

        input:
          prompt.input,

        text: {
          format: {
            type: "json_schema",

            name:
              "executive_report",

            strict: true,

            schema: {
              type: "object",

              properties: {
                executiveSummary: {
                  type: "string",
                },

                operationalPriorities: {
                  type: "array",

                  items: {
                    type: "object",

                    properties: {
                      title: {
                        type: "string",
                      },

                      areaCode: {
                        anyOf: [
                          {
                            type: "string",
                          },
                          {
                            type: "null",
                          },
                        ],
                      },

                      causeCode: {
                        anyOf: [
                          {
                            type: "string",
                          },
                          {
                            type: "null",
                          },
                        ],
                      },

                      priority: {
                        type: "string",

                        enum: [
                          "critical",
                          "high",
                          "medium",
                          "low",
                        ],
                      },

                      summary: {
                        type: "string",
                      },

                      evidence: {
                        type: "array",

                        items: {
                          type: "string",
                        },
                      },
                    },

                    required: [
                      "title",
                      "areaCode",
                      "causeCode",
                      "priority",
                      "summary",
                      "evidence",
                    ],

                    additionalProperties:
                      false,
                  },
                },

                positiveHighlights: {
                  type: "array",

                  items: {
                    type: "object",

                    properties: {
                      title: {
                        type: "string",
                      },

                      summary: {
                        type: "string",
                      },

                      evidence: {
                        type: "array",

                        items: {
                          type: "string",
                        },
                      },
                    },

                    required: [
                      "title",
                      "summary",
                      "evidence",
                    ],

                    additionalProperties:
                      false,
                  },
                },

                methodologicalNote: {
                  type: "string",
                },
              },

              required: [
                "executiveSummary",
                "operationalPriorities",
                "positiveHighlights",
                "methodologicalNote",
              ],

              additionalProperties:
                false,
            },
          },
        },
      });

    const outputText =
      result.output_text?.trim();

    if (!outputText) {
      throw new Error(
        "OpenAI no devolvió contenido para el informe."
      );
    }

    let parsed:
      AIReportOutput;

    try {
      const cleaned =
        cleanJsonOutput(
          outputText
        );

      parsed =
        JSON.parse(
          cleaned
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

    const operationalPriorities =
      normalizeOperationalPriorities(
        parsed.operationalPriorities
      );

    const positiveHighlights =
      normalizePositiveHighlights(
        parsed.positiveHighlights
      );

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

      operationalPriorities,

      positiveHighlights,

      methodologicalNote:
        parsed.methodologicalNote.trim(),

      /*
       * Se conservan para trazabilidad
       * y para report_history.
       *
       * No es necesario mostrarlos
       * en la interfaz.
       */
      findings:
        prepared.findings,
    };
  }

  /////////////////////////////////////////////////////////////////
  // REVIEW UNDERSTANDING
  /////////////////////////////////////////////////////////////////

  async analyzeReviewUnderstanding(
    input: AnalyzeReviewUnderstandingInput
  ): Promise<AnalyzeReviewUnderstandingResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "La variable OPENAI_API_KEY no está configurada."
      );
    }

    const completion =
      await openai.chat.completions.create({
        model:
          understandingModel,

        temperature: 0,

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "user",

            content:
              buildReviewUnderstandingPrompt(
                input.review,
                input.taxonomyContext
              ),
          },
        ],
      });

    const content =
      completion
        .choices[0]
        ?.message
        ?.content;

    if (!content) {
      throw new Error(
        "OpenAI returned empty content."
      );
    }

    let rawOutput:
      unknown;

    try {
      rawOutput =
        JSON.parse(
          content
        );
    } catch {
      throw new Error(
        "OpenAI returned invalid JSON."
      );
    }

    return {
      analysis:
        validateReviewUnderstandingAnalysis(
          rawOutput
        ),

      rawOutput,

      model:
        completion.model,
    };
  }
}
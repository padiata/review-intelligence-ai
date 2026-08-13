import OpenAI from "openai";

import type {
  AIProvider,
  AnalyzeReviewInput,
  AnalyzeReviewResult,
  GenerateResponseInput,
  GenerateResponseResult,
  TranslateTextInput,
  TranslateTextResult,
} from "../types";

import {
  buildReviewResponsePrompt,
} from "../prompts/review-response";

import {
  buildReviewAnalysisPrompt,
} from "../prompts/review-analysis";

import {
  buildTranslationPrompt,
} from "../prompts/translation";

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
      response: responseText,
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
}
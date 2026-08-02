import "server-only";

import OpenAI from "openai";
import {
  REVIEW_UNDERSTANDING_MODEL,
} from "../constants/review-understanding.constants";
import type { PendingImportedReview } from "../review-processor.repository";
import type { ReviewUnderstandingAnalysis } from "../types/review-understanding.types";
import { validateReviewUnderstandingAnalysis } from "../validators/review-understanding.validator";
import { buildReviewUnderstandingPrompt } from "./prompts/review-understanding.prompt";

const apiKey =
  process.env.OPENAI_API_KEY ??
  process.env.TU_API_PASSWORDOPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Missing OpenAI API key.");
}

const openai = new OpenAI({ apiKey });

export type AnalyzeReviewWithAIResult = {
  analysis: ReviewUnderstandingAnalysis;
  rawOutput: unknown;
  model: string;
};

export async function analyzeReviewWithAI(
  review: PendingImportedReview,
  taxonomyContext: string
): Promise<AnalyzeReviewWithAIResult> {
  const completion = await openai.chat.completions.create({
    model: REVIEW_UNDERSTANDING_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: buildReviewUnderstandingPrompt(review, taxonomyContext),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content.");
  }

  let rawOutput: unknown;
  try {
    rawOutput = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }

  return {
    analysis: validateReviewUnderstandingAnalysis(rawOutput),
    rawOutput,
    model: completion.model,
  };
}

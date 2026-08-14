import "server-only";

import {
  getAIProvider,
} from "@/lib/ai";

import type {
  PendingImportedReview,
} from "../review-processor.repository";

import type {
  ReviewUnderstandingAnalysis,
} from "../types/review-understanding.types";

export type AnalyzeReviewWithAIResult = {
  analysis: ReviewUnderstandingAnalysis;
  rawOutput: unknown;
  model: string;
};

export async function analyzeReviewWithAI(
  review: PendingImportedReview,
  taxonomyContext: string
): Promise<AnalyzeReviewWithAIResult> {
  const ai =
    getAIProvider();

  return await ai.analyzeReviewUnderstanding({
    review,
    taxonomyContext,
  });
}
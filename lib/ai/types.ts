import type {
  PendingImportedReview,
} from "@/lib/reviews/review-processor.repository";

import type {
  ReviewUnderstandingAnalysis,
} from "@/lib/reviews/types/review-understanding.types";

export type AnalyzeReviewInput = {
  id: number;
  guest: string;
  score: number;
  title: string;
  text: string;
  language: string;
  property: string;
  source: string;
};

export type AnalyzeReviewResult = {
  sentiment: string;
  priority: string;
  summary: string;
  detected_areas: string[];
  positive_aspects: string[];
  negative_aspects: string[];
  predominant_emotion: string;
  recommendation_probability: string;
};

export type AnalyzeReviewUnderstandingInput = {
  review: PendingImportedReview;
  taxonomyContext: string;
};

export type AnalyzeReviewUnderstandingResult = {
  analysis: ReviewUnderstandingAnalysis;
  rawOutput: unknown;
  model: string;
};

export type GenerateResponseInput = {
  review: AnalyzeReviewInput;
  context: string;
  tone: string;
};

export type GenerateResponseResult = {
  response: string;
};

export type TranslateTextInput = {
  text: string;
  language: string;
};

export type TranslateTextResult = {
  translatedText: string;
  targetLanguage: string;
};

export type TranslateTaxonomyNodeInput = {
  name: string;
  description?: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  nodeType: "area" | "cause" | "subcause";
  domainName?: string | null;
};

export type TranslateTaxonomyNodeResult = {
  name: string;
  description: string | null;
  sourceLanguage: string;
  targetLanguage: string;
};

export interface AIProvider {
  analyzeReview(
    input: AnalyzeReviewInput
  ): Promise<AnalyzeReviewResult>;

  analyzeReviewUnderstanding(
    input: AnalyzeReviewUnderstandingInput
  ): Promise<AnalyzeReviewUnderstandingResult>;

  generateResponse(
    input: GenerateResponseInput
  ): Promise<GenerateResponseResult>;

  translateText(
    input: TranslateTextInput
  ): Promise<TranslateTextResult>;

  translateTaxonomyNode(
    input: TranslateTaxonomyNodeInput
  ): Promise<TranslateTaxonomyNodeResult>;
}
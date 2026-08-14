import type {
  ExecutiveReport,
} from "@/lib/reports/report.types";

import type {
  PreparedReportData,
} from "@/lib/reports/report-builder.service";

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

export type GenerateExecutiveReportInput =
  PreparedReportData;

export type GenerateExecutiveReportResult =
  ExecutiveReport;

export type AnalyzeReviewUnderstandingInput = {
  review: PendingImportedReview;
  taxonomyContext: string;
};

export type AnalyzeReviewUnderstandingResult = {
  analysis: ReviewUnderstandingAnalysis;
  rawOutput: unknown;
  model: string;
};

export interface AIProvider {
  analyzeReview(
    input: AnalyzeReviewInput
  ): Promise<AnalyzeReviewResult>;

  generateResponse(
    input: GenerateResponseInput
  ): Promise<GenerateResponseResult>;

  translateText(
    input: TranslateTextInput
  ): Promise<TranslateTextResult>;

  generateExecutiveReport(
    input: GenerateExecutiveReportInput
  ): Promise<GenerateExecutiveReportResult>;

  analyzeReviewUnderstanding(
    input: AnalyzeReviewUnderstandingInput
  ): Promise<AnalyzeReviewUnderstandingResult>;
}
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

export type ReviewSentiment =
  | "very_positive"
  | "positive"
  | "neutral"
  | "moderately_negative"
  | "very_negative";

export type ReviewPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ReviewRecommendationProbability =
  | "very_low"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export type ReviewEmotion =
  | "satisfaction"
  | "gratitude"
  | "enthusiasm"
  | "neutral"
  | "disappointment"
  | "frustration"
  | "anger"
  | "concern";

export type ReviewArea =
  | "cleanliness"
  | "staff_service"
  | "room"
  | "bathroom"
  | "food_beverage"
  | "breakfast"
  | "location"
  | "facilities"
  | "maintenance"
  | "comfort"
  | "noise"
  | "wifi"
  | "pool"
  | "beach"
  | "value"
  | "check_in"
  | "check_out"
  | "booking"
  | "accessibility"
  | "security"
  | "other";

export type AnalyzeReviewResult = {
  sentiment: ReviewSentiment;
  priority: ReviewPriority;
  summary: string;
  detected_areas: ReviewArea[];
  positive_aspects: string[];
  negative_aspects: string[];
  predominant_emotion: ReviewEmotion;
  recommendation_probability: ReviewRecommendationProbability;
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
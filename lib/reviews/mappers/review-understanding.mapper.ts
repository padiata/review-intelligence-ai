import {
  REVIEW_UNDERSTANDING_MODEL,
  REVIEW_UNDERSTANDING_PROMPT_VERSION,
} from "../constants/review-understanding.constants";
import type {
  ReviewUnderstandingAnalysis,
} from "../types/review-understanding.types";

export type ReviewUnderstandingFindingRowInput = {
  imported_review_id: number;
  finding_order: number;
  area_code: string | null;
  cause_code: string | null;
  subcause_code: string | null;
  sentiment: string;
  sentiment_score: number | null;
  intensity_score: number;
  severity_score: number;
  confidence: number;
  impact_score: number;
  finding_summary: string;
  evidence_text: string;
  operational_priority: string;
  requires_response: boolean;
  processed_at: string;
  prompt_version: string;
  model_version: string;
  raw_ai_output: unknown;
};

export type ReviewUnderstandingRelationshipRowInput = {
  root_finding_order: number;
  connected_finding_order: number;
  connector: string;
  relationship_type: string;
  connector_position: number | null;
  notes: string | null;
};

export function mapAnalysisForPersistence(
  reviewId: number,
  analysis: ReviewUnderstandingAnalysis,
  rawAiOutput: unknown,
  processedAt = new Date().toISOString()
): {
  findings: ReviewUnderstandingFindingRowInput[];
  relationships: ReviewUnderstandingRelationshipRowInput[];
} {
  return {
    findings: analysis.findings.map((finding) => ({
      imported_review_id: reviewId,
      finding_order: finding.finding_order,
      area_code: finding.area_code,
      cause_code: finding.cause_code,
      subcause_code: finding.subcause_code,
      sentiment: finding.sentiment,
      sentiment_score: finding.sentiment_score,
      intensity_score: finding.intensity_score,
      severity_score: finding.severity_score,
      confidence: finding.confidence,
      impact_score: finding.impact_score,
      finding_summary: finding.finding_summary,
      evidence_text: finding.evidence_text,
      operational_priority: finding.operational_priority,
      requires_response: finding.requires_response,
      processed_at: processedAt,
      prompt_version: REVIEW_UNDERSTANDING_PROMPT_VERSION,
      model_version: REVIEW_UNDERSTANDING_MODEL,
      raw_ai_output: {
        finding,
        response: rawAiOutput,
      },
    })),
    relationships: analysis.relationships.map((relationship) => ({ ...relationship })),
  };
}

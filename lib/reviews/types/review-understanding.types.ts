import {
  OPERATIONAL_PRIORITY_VALUES,
  RELATIONSHIP_TYPE_VALUES,
  SENTIMENT_VALUES,
} from "../constants/review-understanding.constants";

export type Sentiment =
  (typeof SENTIMENT_VALUES)[number];

export type OperationalPriority =
  (typeof OPERATIONAL_PRIORITY_VALUES)[number];

export type FindingRelationshipType =
  (typeof RELATIONSHIP_TYPE_VALUES)[number];

export type ReviewUnderstandingFinding = {
  finding_order: number;

  area_code: string | null;
  cause_code: string | null;
  subcause_code: string | null;

  sentiment: Sentiment;
  sentiment_score: number | null;
  intensity_score: number;
  severity_score: number;
  confidence: number;
  impact_score: number;

  finding_summary: string;
  evidence_text: string;

  operational_priority: OperationalPriority;
  requires_response: boolean;
};

/**
 * Relationships reference findings by finding_order while the result is still
 * outside the database. The repository resolves those orders to database IDs.
 */
export type ReviewUnderstandingRelationship = {
  root_finding_order: number;
  connected_finding_order: number;
  connector: string;
  relationship_type: FindingRelationshipType;
  connector_position: number | null;
  notes: string | null;
};

export type ReviewUnderstandingAnalysis = {
  findings: ReviewUnderstandingFinding[];
  relationships: ReviewUnderstandingRelationship[];
};

export type SavedReviewFinding = {
  id: number;
  imported_review_id: number;
  finding_order: number;
};

export type SavedReviewRelationship = {
  id: number;
  root_finding_id: number;
  connected_finding_id: number;
};

export type SavedReviewUnderstanding = {
  findings: SavedReviewFinding[];
  relationships: SavedReviewRelationship[];
};

export type ReviewProcessingItem = {
  reviewId: number;
  sourceReviewId: string | null;
  reviewDate: string | null;
  status: "analyzed" | "failed";
  findingsSaved: number;
  relationshipsSaved: number;
  error?: string;
};

export type ReviewUnderstandingResult = {
  entityId: number;
  domainId: number;
  pendingAtStart: number;
  processedCount: number;
  analyzedCount: number;
  failedCount: number;
  findingsCreated: number;
  relationshipsCreated: number;
  batchesProcessed: number;
  pendingAtEnd: number;
  affectedReviewDates: string[];
  dailyRowsRecalculated: number;
  results: ReviewProcessingItem[];
};

export type ProcessAllPendingReviewsInput = {
  entityId: number;
  domainId: number;
  batchSize?: number;
  maxReviews?: number;
};

import { aggregateFindingsForEntity } from "./finding-aggregator.service";

import {
  getTaxonomyMetadata,
  saveKnowledgeSnapshotRows,
} from "./knowledge-snapshot.repository";

type BuildKnowledgeSnapshotInput = {
  entityId: number;
  domainId: number;
  sourceId?: number | null;

  periodType:
    | "DAY"
    | "WEEK"
    | "MONTH"
    | "QUARTER"
    | "YEAR"
    | "ALL";

  periodStart: string;
  periodEnd: string;

  snapshotVersion?: number;
};

type AggregationItem = {
  code: string;

  count: number;
  reviewsCount: number;

  positive: number;
  neutral: number;
  negative: number;
  mixed: number;

  avgSentimentScore: number | null;

  requiresResponse: number;

  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
};

async function buildRowsForDimension(
  input: BuildKnowledgeSnapshotInput,
  dimension: "AREA" | "CAUSE" | "SUBCAUSE",
  items: AggregationItem[]
) {
  const rows = [];

  for (const item of items) {
    const metadata = await getTaxonomyMetadata(
      dimension,
      item.code
    );

    rows.push({
      domain_id: input.domainId,
      entity_id: input.entityId,
      source_id: input.sourceId ?? null,

      period_type: input.periodType,
      period_start: input.periodStart,
      period_end: input.periodEnd,

      snapshot_version: input.snapshotVersion ?? 1,

      dimension,

      taxonomy_code: item.code,
      taxonomy_name: metadata.name,
      taxonomy_numeric_code: metadata.numericCode,

      reviews_count: item.reviewsCount,
      findings_count: item.count,

      positive_count: item.positive,
      neutral_count: item.neutral,
      negative_count: item.negative,
      mixed_count: item.mixed,

      avg_sentiment_score: item.avgSentimentScore,

      requires_response_count: item.requiresResponse,

      high_priority_count: item.highPriority,
      medium_priority_count: item.mediumPriority,
      low_priority_count: item.lowPriority,

      extra_data: null,
    });
  }

  return rows;
}

export async function buildKnowledgeSnapshot(
  input: BuildKnowledgeSnapshotInput
) {
  const aggregation = await aggregateFindingsForEntity(
    input.entityId
  );

  const areaRows = await buildRowsForDimension(
    input,
    "AREA",
    aggregation.byArea
  );

  const causeRows = await buildRowsForDimension(
    input,
    "CAUSE",
    aggregation.byCause
  );

  const subcauseRows = await buildRowsForDimension(
    input,
    "SUBCAUSE",
    aggregation.bySubcause
  );

  const rows = [
    ...areaRows,
    ...causeRows,
    ...subcauseRows,
  ];

  const saved = await saveKnowledgeSnapshotRows(rows);

  return {
    entityId: input.entityId,
    totalReviews: aggregation.totalReviews,
    totalFindings: aggregation.totalFindings,

    rowsPrepared: rows.length,
    rowsSaved: saved.length,

    sentimentDistribution:
      aggregation.sentimentDistribution,

    priorityDistribution:
      aggregation.priorityDistribution,

    requiresResponse:
      aggregation.requiresResponse,
  };
}
import {
  countDailyFindingAggregationRows,
  deleteDailyFindingAggregation,
  getFindingsForEntityAndDate,
  insertDailyFindingAggregations,
  type AggregationLevel,
  type DailyFindingAggregationInsert,
  type FindingForAggregation,
} from "./finding-aggregator.repository";

const DEBUG = true;

function logFA(step: string, data?: unknown): void {
  if (!DEBUG) return;
  const prefix = `[FindingAggregator][${new Date().toISOString()}]`;
  data === undefined
    ? console.log(`${prefix} ${step}`)
    : console.log(`${prefix} ${step}`, data);
}

type AggregateFindingsForDayInput = {
  entityId: number;
  reviewDate: string;
};

type InternalItem = {
  aggregationLevel: AggregationLevel;
  aggregationCode: string;
  findingsCount: number;
  reviewIds: Set<number>;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  mixedCount: number;
  sentimentScoreSum: number;
  sentimentScoreCount: number;
  requiresResponseCount: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
};

export type FindingAggregationOutputItem = {
  aggregationLevel: AggregationLevel;
  aggregationCode: string;
  findingsCount: number;
  reviewsCount: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  mixedCount: number;
  avgSentimentScore: number | null;
  requiresResponseCount: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
};

function validateInput(entityId: number, reviewDate: string): void {
  if (!Number.isInteger(entityId) || entityId <= 0) {
    throw new Error("A valid entityId is required.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate)) {
    throw new Error("reviewDate must use YYYY-MM-DD.");
  }

  const parsed = new Date(`${reviewDate}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== reviewDate
  ) {
    throw new Error("reviewDate is not a valid calendar date.");
  }
}

function createItem(
  aggregationLevel: AggregationLevel,
  aggregationCode: string
): InternalItem {
  return {
    aggregationLevel,
    aggregationCode,
    findingsCount: 0,
    reviewIds: new Set<number>(),
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
    mixedCount: 0,
    sentimentScoreSum: 0,
    sentimentScoreCount: 0,
    requiresResponseCount: 0,
    highPriorityCount: 0,
    mediumPriorityCount: 0,
    lowPriorityCount: 0,
  };
}

function normalizeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function addFinding(
  map: Map<string, InternalItem>,
  level: AggregationLevel,
  code: string | null,
  finding: FindingForAggregation
): void {
  if (!code) return;

  let item = map.get(code);
  if (!item) {
    item = createItem(level, code);
    map.set(code, item);
  }

  item.findingsCount += 1;
  item.reviewIds.add(finding.imported_review_id);

  const sentiment = finding.sentiment?.trim().toLowerCase();
  if (sentiment === "positive") item.positiveCount += 1;
  else if (sentiment === "neutral") item.neutralCount += 1;
  else if (sentiment === "negative") item.negativeCount += 1;
  else if (sentiment === "mixed") item.mixedCount += 1;

  if (finding.sentiment_score !== null && finding.sentiment_score !== undefined) {
    const score = Number(finding.sentiment_score);
    if (Number.isFinite(score)) {
      item.sentimentScoreSum += score;
      item.sentimentScoreCount += 1;
    }
  }

  if (finding.requires_response === true) {
    item.requiresResponseCount += 1;
  }

  const priority = finding.operational_priority?.trim().toLowerCase();
  if (priority === "high") item.highPriorityCount += 1;
  else if (priority === "medium") item.mediumPriorityCount += 1;
  else if (priority === "low") item.lowPriorityCount += 1;
}

function finalize(
  map: Map<string, InternalItem>
): FindingAggregationOutputItem[] {
  return Array.from(map.values())
    .map((item) => ({
      aggregationLevel: item.aggregationLevel,
      aggregationCode: item.aggregationCode,
      findingsCount: item.findingsCount,
      reviewsCount: item.reviewIds.size,
      positiveCount: item.positiveCount,
      neutralCount: item.neutralCount,
      negativeCount: item.negativeCount,
      mixedCount: item.mixedCount,
      avgSentimentScore:
        item.sentimentScoreCount > 0
          ? Number((item.sentimentScoreSum / item.sentimentScoreCount).toFixed(5))
          : null,
      requiresResponseCount: item.requiresResponseCount,
      highPriorityCount: item.highPriorityCount,
      mediumPriorityCount: item.mediumPriorityCount,
      lowPriorityCount: item.lowPriorityCount,
    }))
    .sort(
      (a, b) =>
        b.findingsCount - a.findingsCount ||
        a.aggregationCode.localeCompare(b.aggregationCode)
    );
}

function toRows(
  entityId: number,
  reviewDate: string,
  items: FindingAggregationOutputItem[]
): DailyFindingAggregationInsert[] {
  return items.map((item) => ({
    entity_id: entityId,
    review_date: reviewDate,
    aggregation_level: item.aggregationLevel,
    aggregation_code: item.aggregationCode,
    findings_count: item.findingsCount,
    reviews_count: item.reviewsCount,
    positive_count: item.positiveCount,
    neutral_count: item.neutralCount,
    negative_count: item.negativeCount,
    mixed_count: item.mixedCount,
    avg_sentiment_score: item.avgSentimentScore,
    requires_response_count: item.requiresResponseCount,
    high_priority_count: item.highPriorityCount,
    medium_priority_count: item.mediumPriorityCount,
    low_priority_count: item.lowPriorityCount,
  }));
}

export async function aggregateFindingsForDay({
  entityId,
  reviewDate,
}: AggregateFindingsForDayInput) {
  const startedAt = Date.now();

  logFA("==================================================");
  logFA("PIPELINE_START", { entityId, reviewDate });

  validateInput(entityId, reviewDate);

  const findings = await getFindingsForEntityAndDate(entityId, reviewDate);
  const reviewIds = new Set(findings.map((finding) => finding.imported_review_id));

  logFA("FINDINGS_LOADED", {
    entityId,
    reviewDate,
    findings: findings.length,
    reviews: reviewIds.size,
  });

  const areaMap = new Map<string, InternalItem>();
  const causeMap = new Map<string, InternalItem>();
  const subcauseMap = new Map<string, InternalItem>();

  for (const finding of findings) {
    addFinding(areaMap, "AREA", normalizeCode(finding.area_code), finding);
    addFinding(causeMap, "CAUSE", normalizeCode(finding.cause_code), finding);
    addFinding(subcauseMap, "SUBCAUSE", normalizeCode(finding.subcause_code), finding);
  }

  const byArea = finalize(areaMap);
  const byCause = finalize(causeMap);
  const bySubcause = finalize(subcauseMap);
  const aggregations = [...byArea, ...byCause, ...bySubcause];
  const rows = toRows(entityId, reviewDate, aggregations);

  logFA("AGGREGATION_FINISHED", {
    entityId,
    reviewDate,
    areaGroups: byArea.length,
    causeGroups: byCause.length,
    subcauseGroups: bySubcause.length,
    rowsPrepared: rows.length,
  });

  const rowsDeleted = await deleteDailyFindingAggregation(entityId, reviewDate);
  const rowsInserted = await insertDailyFindingAggregations(rows);
  const rowsVerified = await countDailyFindingAggregationRows(entityId, reviewDate);

  if (rowsInserted !== rows.length || rowsVerified !== rows.length) {
    throw new Error(
      `Verification failed. Prepared=${rows.length}, inserted=${rowsInserted}, verified=${rowsVerified}.`
    );
  }

  const result = {
    entityId,
    reviewDate,
    totalReviews: reviewIds.size,
    totalFindings: findings.length,
    areaGroups: byArea.length,
    causeGroups: byCause.length,
    subcauseGroups: bySubcause.length,
    rowsPrepared: rows.length,
    rowsDeleted,
    rowsInserted,
    rowsVerified,
    durationMs: Date.now() - startedAt,
    aggregations,
  };

  logFA("PIPELINE_FINISHED", result);
  logFA("==================================================");

  return result;
}

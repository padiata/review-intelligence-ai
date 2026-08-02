import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEBUG = true;

function logFAR(step: string, data?: unknown): void {
  if (!DEBUG) return;
  const prefix = `[FindingAggregatorRepository][${new Date().toISOString()}]`;
  data === undefined
    ? console.log(`${prefix} ${step}`)
    : console.log(`${prefix} ${step}`, data);
}

export type AggregationLevel = "AREA" | "CAUSE" | "SUBCAUSE";

export type FindingForAggregation = {
  id: number;
  imported_review_id: number;
  area_code: string | null;
  cause_code: string | null;
  subcause_code: string | null;
  sentiment: string | null;
  sentiment_score: number | string | null;
  operational_priority: string | null;
  requires_response: boolean | null;
  imported_reviews: {
    id: number;
    entity_id: number;
    review_date: string;
    rating: number | null;
    source: string | null;
    source_review_id: string | null;
  };
};

export type DailyFindingAggregationInsert = {
  entity_id: number;
  review_date: string;
  aggregation_level: AggregationLevel;
  aggregation_code: string;
  findings_count: number;
  reviews_count: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  mixed_count: number;
  avg_sentiment_score: number | null;
  requires_response_count: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
};

function validate(entityId: number, reviewDate: string): void {
  if (!Number.isInteger(entityId) || entityId <= 0) {
    throw new Error("A valid entityId is required.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate)) {
    throw new Error("reviewDate must use YYYY-MM-DD.");
  }
}

export async function getFindingsForEntityAndDate(
  entityId: number,
  reviewDate: string
): Promise<FindingForAggregation[]> {
  validate(entityId, reviewDate);
  logFAR("GET_FINDINGS_START", { entityId, reviewDate, supabaseUrl });

  const startedAt = Date.now();
  const { data, error } = await supabase
    .from("review_intelligence_findings")
    .select(`
      id,
      imported_review_id,
      area_code,
      cause_code,
      subcause_code,
      sentiment,
      sentiment_score,
      operational_priority,
      requires_response,
      imported_reviews!inner (
        id,
        entity_id,
        review_date,
        rating,
        source,
        source_review_id
      )
    `)
    .eq("imported_reviews.entity_id", entityId)
    .eq("imported_reviews.review_date", reviewDate)
    .order("id", { ascending: true });

  if (error) {
    logFAR("GET_FINDINGS_ERROR", { entityId, reviewDate, error });
    throw error;
  }

  const findings = (data ?? []) as unknown as FindingForAggregation[];

  logFAR("GET_FINDINGS_FINISHED", {
    entityId,
    reviewDate,
    findingsCount: findings.length,
    durationMs: Date.now() - startedAt,
  });

  return findings;
}

export async function deleteDailyFindingAggregation(
  entityId: number,
  reviewDate: string
): Promise<number> {
  validate(entityId, reviewDate);
  logFAR("DELETE_START", { entityId, reviewDate });

  const { data, error } = await supabase
    .from("daily_finding_aggregation")
    .delete()
    .eq("entity_id", entityId)
    .eq("review_date", reviewDate)
    .select("id");

  if (error) throw error;

  const deletedCount = data?.length ?? 0;
  logFAR("DELETE_FINISHED", { entityId, reviewDate, deletedCount });
  return deletedCount;
}

export async function insertDailyFindingAggregations(
  rows: DailyFindingAggregationInsert[]
): Promise<number> {
  if (rows.length === 0) {
    logFAR("INSERT_SKIPPED", { reason: "No rows to insert." });
    return 0;
  }

  logFAR("INSERT_START", { rowsCount: rows.length });

  const { data, error } = await supabase
    .from("daily_finding_aggregation")
    .insert(rows)
    .select("id");

  if (error) throw error;

  const insertedCount = data?.length ?? 0;
  logFAR("INSERT_FINISHED", { insertedCount });
  return insertedCount;
}

export async function countDailyFindingAggregationRows(
  entityId: number,
  reviewDate: string
): Promise<number> {
  validate(entityId, reviewDate);

  const { count, error } = await supabase
    .from("daily_finding_aggregation")
    .select("id", { count: "exact", head: true })
    .eq("entity_id", entityId)
    .eq("review_date", reviewDate);

  if (error) throw error;

  const result = count ?? 0;
  logFAR("COUNT_FINISHED", { entityId, reviewDate, count: result });
  return result;
}

import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

const CASE_FINDINGS_TABLE = "internal_feedback_case_findings";

export type InternalFeedbackCaseFinding = {
  id: number;
  internal_feedback_case_id: number;
  finding_id: number;
  created_at: string;
};

type AddFindingToCaseInput = {
  internalFeedbackCaseId: number;
  findingId: number;
};

function validatePositiveInteger(
  value: number,
  field: string
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }
}

/**
 * Links one Review Understanding finding
 * to one internal feedback case.
 *
 * It does not modify the original finding.
 */
export async function addFindingToInternalFeedbackCase({
  internalFeedbackCaseId,
  findingId,
}: AddFindingToCaseInput): Promise<InternalFeedbackCaseFinding> {
  validatePositiveInteger(
    internalFeedbackCaseId,
    "internalFeedbackCaseId"
  );
  validatePositiveInteger(
    findingId,
    "findingId"
  );

  const { data, error } = await supabaseAdmin
    .from(CASE_FINDINGS_TABLE)
    .insert({
      internal_feedback_case_id:
        internalFeedbackCaseId,
      finding_id: findingId,
    })
    .select(`
      id,
      internal_feedback_case_id,
      finding_id,
      created_at
    `)
    .single();

  if (error) {
    throw new Error(
      `Could not link finding ${findingId} to internal feedback case ${internalFeedbackCaseId}: ${error.message}`
    );
  }

  return data as InternalFeedbackCaseFinding;
}

/**
 * Links several findings to the same internal feedback case.
 *
 * Useful because one review may contain several negative
 * findings belonging to the same hotel area.
 */
export async function addFindingsToInternalFeedbackCase(
  internalFeedbackCaseId: number,
  findingIds: number[]
): Promise<InternalFeedbackCaseFinding[]> {
  validatePositiveInteger(
    internalFeedbackCaseId,
    "internalFeedbackCaseId"
  );

  const validFindingIds = findingIds.filter(
    (id) =>
      Number.isInteger(id) &&
      id > 0
  );

  if (validFindingIds.length === 0) {
    return [];
  }

  const rows = validFindingIds.map((findingId) => ({
    internal_feedback_case_id:
      internalFeedbackCaseId,
    finding_id: findingId,
  }));

  const { data, error } = await supabaseAdmin
    .from(CASE_FINDINGS_TABLE)
    .insert(rows)
    .select(`
      id,
      internal_feedback_case_id,
      finding_id,
      created_at
    `);

  if (error) {
    throw new Error(
      `Could not link findings to internal feedback case ${internalFeedbackCaseId}: ${error.message}`
    );
  }

  return (data ?? []) as InternalFeedbackCaseFinding[];
}
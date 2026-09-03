import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

const CASES_TABLE = "internal_feedback_cases";
const CASE_FINDINGS_TABLE = "internal_feedback_case_findings";
const FINDINGS_TABLE = "review_intelligence_findings";

export type InternalFeedbackAccessCase = {
  id: number;
  hotel_id: number;
  imported_review_id: number;
  area_code: string;
  notification_contact_id: number;
  status: string;
  access_token: string;
  token_expires_at: string | null;
  created_at: string;
  sent_at: string | null;
  opened_at: string | null;
  responded_at: string | null;
};

export type InternalFeedbackAccessFinding = {
  id: number;
  finding_order: number;
  area_code: string;
  cause_code: string | null;
  subcause_code: string | null;
  sentiment: string;
  finding_summary: string | null;
  evidence_text: string | null;
};

export type InternalFeedbackAccessData = {
  feedbackCase: InternalFeedbackAccessCase;
  findings: InternalFeedbackAccessFinding[];
};

function validateAccessToken(accessToken: string): void {
  if (!accessToken || accessToken.trim() === "") {
    throw new Error("A valid access token is required.");
  }
}

export async function getInternalFeedbackCaseByToken(
  accessToken: string
): Promise<InternalFeedbackAccessData | null> {
  validateAccessToken(accessToken);

  const { data: feedbackCase, error: caseError } =
    await supabaseAdmin
      .from(CASES_TABLE)
      .select(`
        id,
        hotel_id,
        imported_review_id,
        area_code,
        notification_contact_id,
        status,
        access_token,
        token_expires_at,
        created_at,
        sent_at,
        opened_at,
        responded_at
      `)
      .eq("access_token", accessToken)
      .maybeSingle();

  if (caseError) {
    throw new Error(
      `Could not load internal feedback case: ${caseError.message}`
    );
  }

  if (!feedbackCase) {
    return null;
  }

  const { data: caseFindings, error: caseFindingsError } =
    await supabaseAdmin
      .from(CASE_FINDINGS_TABLE)
      .select("finding_id")
      .eq("internal_feedback_case_id", feedbackCase.id);

  if (caseFindingsError) {
    throw new Error(
      `Could not load findings for internal feedback case ${feedbackCase.id}: ${caseFindingsError.message}`
    );
  }

  const findingIds = (caseFindings ?? [])
    .map((row) => row.finding_id)
    .filter(
      (id): id is number =>
        typeof id === "number"
    );

  if (findingIds.length === 0) {
    return {
      feedbackCase:
        feedbackCase as InternalFeedbackAccessCase,
      findings: [],
    };
  }

  const { data: findings, error: findingsError } =
    await supabaseAdmin
      .from(FINDINGS_TABLE)
      .select(`
        id,
        finding_order,
        area_code,
        cause_code,
        subcause_code,
        sentiment,
        finding_summary,
        evidence_text
      `)
      .in("id", findingIds)
      .order("finding_order", {
        ascending: true,
      });

  if (findingsError) {
    throw new Error(
      `Could not load Review Understanding findings: ${findingsError.message}`
    );
  }

  return {
    feedbackCase:
      feedbackCase as InternalFeedbackAccessCase,
    findings:
      (findings ?? []) as InternalFeedbackAccessFinding[],
  };
}
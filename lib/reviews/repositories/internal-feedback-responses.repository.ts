import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

const RESPONSES_TABLE = "internal_feedback_responses";
const CASES_TABLE = "internal_feedback_cases";

type CreateInternalFeedbackResponseInput = {
  internalFeedbackCaseId: number;
  notificationContactId: number;
  responseText: string;
};

function validatePositiveInteger(
  value: number,
  field: string
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }
}

export async function createInternalFeedbackResponse({
  internalFeedbackCaseId,
  notificationContactId,
  responseText,
}: CreateInternalFeedbackResponseInput) {
  validatePositiveInteger(
    internalFeedbackCaseId,
    "internalFeedbackCaseId"
  );

  validatePositiveInteger(
    notificationContactId,
    "notificationContactId"
  );

  const cleanResponse = responseText.trim();

  if (!cleanResponse) {
    throw new Error("Response text is required.");
  }

  const { data, error } = await supabaseAdmin
    .from(RESPONSES_TABLE)
    .insert({
      internal_feedback_case_id:
        internalFeedbackCaseId,
      notification_contact_id:
        notificationContactId,
      response_text:
        cleanResponse,
    })
    .select(`
      id,
      internal_feedback_case_id,
      notification_contact_id,
      response_text,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(
      `Could not save internal feedback response: ${error.message}`
    );
  }

  const { error: caseError } = await supabaseAdmin
    .from(CASES_TABLE)
    .update({
      status: "RESPONDED",
      responded_at: new Date().toISOString(),
    })
    .eq(
      "id",
      internalFeedbackCaseId
    );

  if (caseError) {
    throw new Error(
      `Response was saved but case status could not be updated: ${caseError.message}`
    );
  }

  return data;
}
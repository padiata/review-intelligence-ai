import "server-only";

import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CASES_TABLE = "internal_feedback_cases";

export type InternalFeedbackCase = {
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

type CreateInternalFeedbackCaseInput = {
  hotelId: number;
  reviewId: number;
  areaCode: string;
  notificationContactId: number;
};

function validatePositiveInteger(
  value: number,
  field: string
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }
}

function validateAreaCode(areaCode: string): void {
  if (!areaCode || areaCode.trim() === "") {
    throw new Error("A valid areaCode is required.");
  }
}

/**
 * Looks for an existing feedback case for the same
 * hotel + review + area.
 *
 * Used to avoid duplicate cases.
 */
export async function findExistingInternalFeedbackCase(
  hotelId: number,
  reviewId: number,
  areaCode: string
): Promise<InternalFeedbackCase | null> {
  validatePositiveInteger(hotelId, "hotelId");
  validatePositiveInteger(reviewId, "reviewId");
  validateAreaCode(areaCode);

  const { data, error } = await supabaseAdmin
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
    .eq("hotel_id", hotelId)
    .eq("imported_review_id", reviewId)
    .eq("area_code", areaCode)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not check existing internal feedback case for review ${reviewId} and area ${areaCode}: ${error.message}`
    );
  }

  return data as InternalFeedbackCase | null;
}

/**
 * Creates one internal feedback case.
 *
 * The access token will later be used in the secure
 * response link sent to the hotel contact.
 */
export async function createInternalFeedbackCase({
  hotelId,
  reviewId,
  areaCode,
  notificationContactId,
}: CreateInternalFeedbackCaseInput): Promise<InternalFeedbackCase> {
  validatePositiveInteger(hotelId, "hotelId");
  validatePositiveInteger(reviewId, "reviewId");
  validatePositiveInteger(
    notificationContactId,
    "notificationContactId"
  );
  validateAreaCode(areaCode);

  const accessToken = randomBytes(32).toString("hex");

  const { data, error } = await supabaseAdmin
    .from(CASES_TABLE)
    .insert({
      hotel_id: hotelId,
      imported_review_id: reviewId,
      area_code: areaCode,
      notification_contact_id:
        notificationContactId,
      status: "PENDING",
      access_token: accessToken,
    })
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
    .single();

  if (error) {
    throw new Error(
      `Could not create internal feedback case for review ${reviewId} and area ${areaCode}: ${error.message}`
    );
  }

  return data as InternalFeedbackCase;
}
import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

const CONTACTS_TABLE = "hotel_notification_contacts";
const ASSIGNMENTS_TABLE = "contact_area_assignments";

export type InternalFeedbackContact = {
  id: number;
  hotel_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  preferred_channel: string | null;
  active: boolean;
};

function validateHotelId(hotelId: number): void {
  if (!Number.isInteger(hotelId) || hotelId <= 0) {
    throw new Error("A valid hotelId is required.");
  }
}

function validateAreaCode(areaCode: string): void {
  if (!areaCode || areaCode.trim() === "") {
    throw new Error("A valid areaCode is required.");
  }
}

/**
 * Returns active notification contacts assigned to one hotel area.
 *
 * This function:
 * - does not create cases
 * - does not send notifications
 * - only resolves contacts assigned to the area
 */
export async function getContactsForArea(
  hotelId: number,
  areaCode: string
): Promise<InternalFeedbackContact[]> {
  validateHotelId(hotelId);
  validateAreaCode(areaCode);

  const { data: assignments, error: assignmentsError } =
    await supabaseAdmin
      .from(ASSIGNMENTS_TABLE)
      .select("notification_contact_id")
      .eq("area_code", areaCode)
      .eq("active", true);

  if (assignmentsError) {
    throw new Error(
      `Could not load contact assignments for area ${areaCode}: ${assignmentsError.message}`
    );
  }

  const contactIds = (assignments ?? [])
    .map((row) => row.notification_contact_id)
    .filter(
      (id): id is number =>
        typeof id === "number"
    );

  if (contactIds.length === 0) {
    return [];
  }

  const { data: contacts, error: contactsError } =
    await supabaseAdmin
      .from(CONTACTS_TABLE)
      .select(`
        id,
        hotel_id,
        name,
        email,
        phone,
        preferred_channel,
        active
      `)
      .eq("hotel_id", hotelId)
      .eq("active", true)
      .in("id", contactIds);

  if (contactsError) {
    throw new Error(
      `Could not load notification contacts for area ${areaCode}: ${contactsError.message}`
    );
  }

  return (contacts ?? []) as InternalFeedbackContact[];
}
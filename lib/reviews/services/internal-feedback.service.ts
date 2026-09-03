import "server-only";

import {
  getNegativeFindingsForReview,
  type InternalFeedbackFinding,
} from "../repositories/internal-feedback.repository";

import {
  getContactsForArea,
  type InternalFeedbackContact,
} from "../repositories/internal-feedback-contacts.repository";

import {
  findExistingInternalFeedbackCase,
  createInternalFeedbackCase,
} from "../repositories/internal-feedback-cases.repository";

import {
  addFindingsToInternalFeedbackCase,
} from "../repositories/internal-feedback-case-findings.repository";

type CreateInternalFeedbackCasesInput = {
  hotelId: number;
  reviewId: number;
};

export type InternalFeedbackCaseCreationResult = {
  reviewId: number;
  areasProcessed: number;
  casesCreated: number;
  existingCases: number;
  areasWithoutContact: string[];
};

function validatePositiveInteger(
  value: number,
  field: string
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }
}

function groupFindingsByArea(
  findings: InternalFeedbackFinding[]
): Map<string, InternalFeedbackFinding[]> {
  const groups =
    new Map<string, InternalFeedbackFinding[]>();

  for (const finding of findings) {
    const areaCode =
      finding.area_code?.trim();

    if (!areaCode) {
      continue;
    }

    const current =
      groups.get(areaCode) ?? [];

    current.push(finding);

    groups.set(
      areaCode,
      current
    );
  }

  return groups;
}

/**
 * Creates internal feedback cases for the negative
 * findings already produced by Review Understanding.
 *
 * Rules for Iteration 1:
 *
 * - only negative findings are considered
 * - findings are grouped by area_code
 * - one case is created per review + area
 * - all findings from that area are attached to the case
 * - existing cases are not duplicated
 * - areas without an assigned contact are reported but do not
 *   stop processing other areas
 *
 * This service does not send notifications yet.
 */
export async function createInternalFeedbackCasesForReview({
  hotelId,
  reviewId,
}: CreateInternalFeedbackCasesInput): Promise<InternalFeedbackCaseCreationResult> {
  validatePositiveInteger(
    hotelId,
    "hotelId"
  );

  validatePositiveInteger(
    reviewId,
    "reviewId"
  );

  const findings =
    await getNegativeFindingsForReview(
      reviewId
    );

  if (findings.length === 0) {
    return {
      reviewId,
      areasProcessed: 0,
      casesCreated: 0,
      existingCases: 0,
      areasWithoutContact: [],
    };
  }

  const findingsByArea =
    groupFindingsByArea(findings);

  let casesCreated = 0;
  let existingCases = 0;

  const areasWithoutContact: string[] = [];

  for (const [
    areaCode,
    areaFindings,
  ] of findingsByArea.entries()) {
    const existingCase =
      await findExistingInternalFeedbackCase(
        hotelId,
        reviewId,
        areaCode
      );

    if (existingCase) {
      existingCases += 1;
      continue;
    }

    const contacts =
      await getContactsForArea(
        hotelId,
        areaCode
      );

    if (contacts.length === 0) {
      areasWithoutContact.push(
        areaCode
      );

      continue;
    }

    /*
     * Iteration 1:
     * use the first active contact assigned to the area.
     *
     * Later we can introduce primary contact,
     * escalation, multiple recipients, etc.
     */
    const contact: InternalFeedbackContact =
      contacts[0];

    const feedbackCase =
      await createInternalFeedbackCase({
        hotelId,
        reviewId,
        areaCode,
        notificationContactId:
          contact.id,
      });

    const findingIds =
      areaFindings.map(
        (finding) => finding.id
      );

    await addFindingsToInternalFeedbackCase(
      feedbackCase.id,
      findingIds
    );

    casesCreated += 1;
  }

  return {
    reviewId,
    areasProcessed:
      findingsByArea.size,
    casesCreated,
    existingCases,
    areasWithoutContact,
  };
}
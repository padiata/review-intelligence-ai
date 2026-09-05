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

import {
  sendInternalFeedbackNotification,
} from "./internal-feedback-notification.service";


type CreateInternalFeedbackCasesInput = {
  hotelId: number;
  reviewId: number;
};


export type InternalFeedbackCaseCreationResult = {
  reviewId: number;
  areasProcessed: number;
  casesCreated: number;
  existingCases: number;
  notificationsSent: number;
  notificationFailures: number;
  areasWithoutContact: string[];
};


function validatePositiveInteger(
  value: number,
  field: string
): void {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `${field} must be a positive integer.`
    );
  }
}


function groupFindingsByArea(
  findings: InternalFeedbackFinding[]
): Map<string, InternalFeedbackFinding[]> {
  const groups =
    new Map<
      string,
      InternalFeedbackFinding[]
    >();

  for (const finding of findings) {
    const areaCode =
      finding.area_code?.trim();

    if (!areaCode) {
      continue;
    }

    const current =
      groups.get(areaCode) ??
      [];

    current.push(
      finding
    );

    groups.set(
      areaCode,
      current
    );
  }

  return groups;
}


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

  if (
    findings.length === 0
  ) {
    return {
      reviewId,
      areasProcessed:
        0,
      casesCreated:
        0,
      existingCases:
        0,
      notificationsSent:
        0,
      notificationFailures:
        0,
      areasWithoutContact:
        [],
    };
  }

  const findingsByArea =
    groupFindingsByArea(
      findings
    );

  let casesCreated =
    0;

  let existingCases =
    0;

  let notificationsSent =
    0;

  let notificationFailures =
    0;

  const areasWithoutContact:
    string[] = [];

  for (
    const [
      areaCode,
      areaFindings,
    ] of findingsByArea.entries()
  ) {
    const existingCase =
      await findExistingInternalFeedbackCase(
        hotelId,
        reviewId,
        areaCode
      );

    if (existingCase) {
      existingCases +=
        1;

      continue;
    }

    const contacts =
      await getContactsForArea(
        hotelId,
        areaCode
      );

    if (
      contacts.length === 0
    ) {
      areasWithoutContact.push(
        areaCode
      );

      continue;
    }

    const contact:
      InternalFeedbackContact =
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
        (finding) =>
          finding.id
      );

    await addFindingsToInternalFeedbackCase(
      feedbackCase.id,
      findingIds
    );

    casesCreated +=
      1;

    try {
      await sendInternalFeedbackNotification(
        feedbackCase.id
      );

      notificationsSent +=
        1;

      console.log(
        `[InternalFeedback] Notification sent for case ${feedbackCase.id}`
      );
    } catch (
      notificationError
    ) {
      notificationFailures +=
        1;

      console.error(
        `[InternalFeedback] Could not send notification for case ${feedbackCase.id}:`,
        notificationError
      );
    }
  }

  return {
    reviewId,
    areasProcessed:
      findingsByArea.size,
    casesCreated,
    existingCases,
    notificationsSent,
    notificationFailures,
    areasWithoutContact,
  };
}
import "server-only";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import {
  sendEmail,
} from "@/lib/notifications/email.service";


const CASES_TABLE =
  "internal_feedback_cases";

const CONTACTS_TABLE =
  "hotel_notification_contacts";

const CASE_FINDINGS_TABLE =
  "internal_feedback_case_findings";

const FINDINGS_TABLE =
  "review_intelligence_findings";

const REVIEWS_TABLE =
  "imported_reviews";


type InternalFeedbackCaseForNotification = {
  id: number;
  hotel_id: number;
  imported_review_id: number;
  area_code: string;
  notification_contact_id: number;
  status: string;
  access_token: string;
  sent_at: string | null;
};


type NotificationContact = {
  id: number;
  name: string;
  email: string | null;
  active: boolean;
};


type NotificationFinding = {
  id: number;
  finding_summary: string | null;
  evidence_text: string | null;
  finding_order: number;
};


type NotificationReview = {
  id: number;
  property_name: string | null;
  reviewer_name: string | null;
  review_date: string | null;
  visit_date: string | null;
};


export type SendInternalFeedbackNotificationResult = {
  caseId: number;
  contactId: number;
  recipientEmail: string;
  responseUrl: string;
  status: "SENT";
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


function getApplicationBaseUrl(): string {
  const value =
    process.env.APP_BASE_URL?.trim();

  if (!value) {
    throw new Error(
      "APP_BASE_URL is not configured."
    );
  }

  return value.replace(
    /\/+$/,
    ""
  );
}


function formatDate(
  value: string | null
): string {
  if (!value) {
    return "No disponible";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}


async function getFeedbackCase(
  caseId: number
): Promise<InternalFeedbackCaseForNotification> {
  const {
    data,
    error,
  } =
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
        sent_at
      `)
      .eq(
        "id",
        caseId
      )
      .single();

  if (error) {
    throw new Error(
      `Could not load internal feedback case ${caseId}: ${error.message}`
    );
  }

  return data as InternalFeedbackCaseForNotification;
}


async function getNotificationContact(
  contactId: number
): Promise<NotificationContact> {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(CONTACTS_TABLE)
      .select(`
        id,
        name,
        email,
        active
      `)
      .eq(
        "id",
        contactId
      )
      .single();

  if (error) {
    throw new Error(
      `Could not load notification contact ${contactId}: ${error.message}`
    );
  }

  return data as NotificationContact;
}


async function getReviewForNotification(
  reviewId: number
): Promise<NotificationReview> {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(REVIEWS_TABLE)
      .select(`
        id,
        property_name,
        reviewer_name,
        review_date,
        visit_date
      `)
      .eq(
        "id",
        reviewId
      )
      .single();

  if (error) {
    throw new Error(
      `Could not load review ${reviewId}: ${error.message}`
    );
  }

  return data as NotificationReview;
}


async function getCaseFindings(
  caseId: number
): Promise<NotificationFinding[]> {
  const {
    data: caseFindings,
    error: caseFindingsError,
  } =
    await supabaseAdmin
      .from(CASE_FINDINGS_TABLE)
      .select(`
        finding_id
      `)
      .eq(
        "internal_feedback_case_id",
        caseId
      );

  if (caseFindingsError) {
    throw new Error(
      `Could not load finding links for case ${caseId}: ${caseFindingsError.message}`
    );
  }

  const findingIds =
    (caseFindings ?? [])
      .map(
        (row) =>
          row.finding_id
      )
      .filter(
        (
          id
        ): id is number =>
          typeof id === "number"
      );

  if (
    findingIds.length === 0
  ) {
    return [];
  }

  const {
    data: findings,
    error: findingsError,
  } =
    await supabaseAdmin
      .from(FINDINGS_TABLE)
      .select(`
        id,
        finding_summary,
        evidence_text,
        finding_order
      `)
      .in(
        "id",
        findingIds
      )
      .order(
        "finding_order",
        {
          ascending: true,
        }
      );

  if (findingsError) {
    throw new Error(
      `Could not load findings for case ${caseId}: ${findingsError.message}`
    );
  }

  return (
    findings ?? []
  ) as NotificationFinding[];
}


async function markCaseAsSent(
  caseId: number
): Promise<void> {
  const sentAt =
    new Date().toISOString();

  const {
    error,
  } =
    await supabaseAdmin
      .from(CASES_TABLE)
      .update({
        status:
          "SENT",

        sent_at:
          sentAt,
      })
      .eq(
        "id",
        caseId
      );

  if (error) {
    throw new Error(
      `Email was sent but internal feedback case ${caseId} could not be marked as SENT: ${error.message}`
    );
  }
}


function buildFindingsText(
  findings: NotificationFinding[]
): string {
  if (
    findings.length === 0
  ) {
    return "No hay detalle adicional disponible.";
  }

  return findings
    .map(
      (
        finding,
        index
      ) => {
        const summary =
          finding.finding_summary?.trim() ||
          "Aspecto identificado";

        const evidence =
          finding.evidence_text?.trim();

        return [
          `${index + 1}. ${summary}`,
          evidence
            ? `   Evidencia del huésped: ${evidence}`
            : null,
        ]
          .filter(Boolean)
          .join("\n");
      }
    )
    .join("\n\n");
}


function buildFindingsHtml(
  findings: NotificationFinding[]
): string {
  if (
    findings.length === 0
  ) {
    return `
      <p>
        No hay detalle adicional disponible.
      </p>
    `;
  }

  return findings
    .map(
      (finding) => {
        const summary =
          finding.finding_summary?.trim() ||
          "Aspecto identificado";

        const evidence =
          finding.evidence_text?.trim();

        return `
          <div
            style="
              margin: 16px 0;
              padding: 14px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              background: #f9fafb;
            "
          >
            <p
              style="
                margin: 0 0 8px 0;
              "
            >
              <strong>
                ${summary}
              </strong>
            </p>

            ${
              evidence
                ? `
                  <p
                    style="
                      margin: 0;
                      color: #555;
                    "
                  >
                    <strong>
                      Evidencia del huésped:
                    </strong>
                    ${evidence}
                  </p>
                `
                : ""
            }
          </div>
        `;
      }
    )
    .join("");
}


export async function sendInternalFeedbackNotification(
  caseId: number
): Promise<SendInternalFeedbackNotificationResult> {
  validatePositiveInteger(
    caseId,
    "caseId"
  );

  const feedbackCase =
    await getFeedbackCase(
      caseId
    );

  if (
    feedbackCase.status ===
    "RESPONDED"
  ) {
    throw new Error(
      `Internal feedback case ${caseId} has already been responded to.`
    );
  }


  const contact =
    await getNotificationContact(
      feedbackCase.notification_contact_id
    );


  if (!contact.active) {
    throw new Error(
      `Notification contact ${contact.id} is inactive.`
    );
  }


  const recipientEmail =
    contact.email?.trim();

  if (!recipientEmail) {
    throw new Error(
      `Notification contact ${contact.id} does not have an email address.`
    );
  }


  const review =
    await getReviewForNotification(
      feedbackCase.imported_review_id
    );


  const findings =
    await getCaseFindings(
      feedbackCase.id
    );


  const baseUrl =
    getApplicationBaseUrl();


  const responseUrl =
    `${baseUrl}/internal-feedback/respond/${feedbackCase.access_token}`;


  const propertyName =
    review.property_name?.trim() ||
    "Hotel";


  const reviewerName =
    review.reviewer_name?.trim() ||
    "Huésped no identificado";


  const visitDate =
    formatDate(
      review.visit_date
    );


  const reviewDate =
    formatDate(
      review.review_date
    );


  const areaLabel =
    feedbackCase.area_code;


  const findingsText =
    buildFindingsText(
      findings
    );


  const findingsHtml =
    buildFindingsHtml(
      findings
    );


  const subject =
    `PADIATA - Incidencia detectada - ${areaLabel}`;


  const text =
    `
Hola ${contact.name},

PADIATA ha identificado una incidencia relacionada con su área.

Hotel:
${propertyName}

Huésped:
${reviewerName}

Fecha de visita/estancia:
${visitDate}

Fecha de publicación de la reseña:
${reviewDate}

Área:
${areaLabel}

Aspectos detectados:

${findingsText}

Por favor, revise la información disponible y deje sus consideraciones utilizando el siguiente enlace:

${responseUrl}

Esta solicitud corresponde únicamente a un proceso interno del hotel.
Su respuesta no será enviada directamente al huésped.

Gracias.

PADIATA
    `.trim();


  const html =
    `
<!DOCTYPE html>
<html>
  <body
    style="
      font-family: Arial, sans-serif;
      color: #222;
      line-height: 1.5;
    "
  >
    <div
      style="
        max-width: 620px;
        margin: 0 auto;
        padding: 24px;
      "
    >
      <h2>
        Incidencia detectada
      </h2>

      <p>
        Hola ${contact.name},
      </p>

      <p>
        PADIATA ha identificado una incidencia
        relacionada con su área.
      </p>

      <div
        style="
          margin: 20px 0;
          padding: 16px;
          border-left: 4px solid #111827;
          background: #f9fafb;
        "
      >
        <p>
          <strong>Hotel:</strong>
          ${propertyName}
        </p>

        <p>
          <strong>Huésped:</strong>
          ${reviewerName}
        </p>

        <p>
          <strong>Fecha de visita/estancia:</strong>
          ${visitDate}
        </p>

        <p>
          <strong>Fecha de publicación de la reseña:</strong>
          ${reviewDate}
        </p>

        <p>
          <strong>Área:</strong>
          ${areaLabel}
        </p>
      </div>

      <h3>
        Aspectos detectados
      </h3>

      ${findingsHtml}

      <p>
        Por favor, revise la información y deje
        sus consideraciones sobre lo ocurrido.
      </p>

      <p
        style="
          margin: 28px 0;
        "
      >
        <a
          href="${responseUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #111827;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Revisar incidencia y responder
        </a>
      </p>

      <p
        style="
          font-size: 14px;
          color: #666;
        "
      >
        Esta solicitud corresponde únicamente
        a un proceso interno del hotel.
        Su respuesta no será enviada directamente
        al huésped.
      </p>

      <p>
        Gracias.
      </p>

      <p>
        <strong>PADIATA</strong>
      </p>
    </div>
  </body>
</html>
    `.trim();


  await sendEmail({
    to:
      recipientEmail,

    subject,

    text,

    html,
  });


  await markCaseAsSent(
    feedbackCase.id
  );


  return {
    caseId:
      feedbackCase.id,

    contactId:
      contact.id,

    recipientEmail,

    responseUrl,

    status:
      "SENT",
  };
}
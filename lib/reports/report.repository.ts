import "server-only";

import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

import type {
  ReportDataset,
  ReportFinding,
} from "./report.types";

type GetReportDatasetInput = {
  entityId: number;
  startDate: string;
  endDate: string;
};

function validateDate(value: string, fieldName: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${fieldName} no contiene una fecha válida.`
    );
  }

  return date;
}

function getExclusiveEndDate(endDate: string) {
  const date = validateDate(endDate, "endDate");

  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString();
}

export async function getReportDataset({
  entityId,
  startDate,
  endDate,
}: GetReportDatasetInput): Promise<ReportDataset> {
  if (
    !Number.isInteger(entityId) ||
    entityId <= 0
  ) {
    throw new Error(
      "Se requiere un entityId válido."
    );
  }

  const parsedStartDate =
    validateDate(startDate, "startDate");

  const parsedEndDate =
    validateDate(endDate, "endDate");

  if (parsedStartDate > parsedEndDate) {
    throw new Error(
      "La fecha inicial no puede ser posterior a la fecha final."
    );
  }

  const endExclusive =
    getExclusiveEndDate(endDate);

  const {
    data: entity,
    error: entityError,
  } = await supabase
    .from("entity_config")
    .select(
      `
        id,
        entity_name,
        report_language_code,
        dataforseo_last_success_at,
        dataforseo_last_sync_at
      `
    )
    .eq("id", entityId)
    .single();

  if (entityError || !entity) {
    throw new Error(
      entityError?.message ||
        "No se encontró la entidad solicitada."
    );
  }

  const {
    data: reviews,
    error: reviewsError,
  } = await supabase
    .from("imported_reviews")
    .select(
      `
        id,
        review_date,
        reviewer_name,
        rating
      `
    )
    .eq("entity_id", entityId)
    .gte(
      "review_date",
      parsedStartDate.toISOString()
    )
    .lt(
      "review_date",
      endExclusive
    )
    .order("review_date", {
      ascending: true,
    });

  if (reviewsError) {
    throw new Error(
      `No se pudieron cargar las reviews del período: ${reviewsError.message}`
    );
  }

  const loadedReviews = reviews ?? [];

  const reviewIds = loadedReviews.map(
    (review) => review.id
  );

  if (reviewIds.length === 0) {
    return {
      entity: {
        id: entity.id,
        name: entity.entity_name,
         reportLanguageCode:
      entity.report_language_code ?? "es",
      },

      period: {
        startDate,
        endDate,
      },

      synchronizedUntil:
        entity.dataforseo_last_success_at ??
        entity.dataforseo_last_sync_at ??
        null,

      reviewCount: 0,
      findingCount: 0,

      findings: [],
    };
  }

  const {
    data: findings,
    error: findingsError,
  } = await supabase
    .from("review_intelligence_findings")
    .select(
      `
        id,
        imported_review_id,
        area_code,
        cause_code,
        subcause_code,
        sentiment,
        finding_summary,
        evidence_text,
        operational_priority
      `
    )
    .in(
      "imported_review_id",
      reviewIds
    )
    .order("operational_priority", {
      ascending: true,
    })
    .order("id", {
      ascending: true,
    });

  if (findingsError) {
    throw new Error(
      `No se pudieron cargar los findings del período: ${findingsError.message}`
    );
  }

  const reviewsById = new Map(
    loadedReviews.map((review) => [
      review.id,
      review,
    ])
  );

  const mappedFindings: ReportFinding[] =
    (findings ?? []).map((finding) => {
      const review = reviewsById.get(
        finding.imported_review_id
      );

      return {
        id: finding.id,

        reviewId:
          finding.imported_review_id,

        reviewDate:
          review?.review_date ?? null,

        reviewerName:
          review?.reviewer_name ?? null,

        rating:
          review?.rating === null ||
          review?.rating === undefined
            ? null
            : Number(review.rating),

        areaCode:
          finding.area_code ?? null,

        causeCode:
          finding.cause_code ?? null,

        subcauseCode:
          finding.subcause_code ?? null,

        sentiment:
          finding.sentiment ?? null,

        priority:
          finding.operational_priority ??
          null,

        findingSummary:
          finding.finding_summary ??
          "Hallazgo sin resumen.",

        evidenceText:
          finding.evidence_text ?? null,
      };
    });

  return {
    entity: {
      id: entity.id,
      name: entity.entity_name,
       reportLanguageCode:
      entity.report_language_code ?? "es",
    },

    period: {
      startDate,
      endDate,
    },

    synchronizedUntil:
      entity.dataforseo_last_success_at ??
      entity.dataforseo_last_sync_at ??
      null,

    reviewCount:
      loadedReviews.length,

    findingCount:
      mappedFindings.length,

    findings:
      mappedFindings,
  };
}
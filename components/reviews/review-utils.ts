import type {
  DisplayReview,
  ImportedReview,
  ReviewAnalysis,
} from "./review-types";

export const emptyAnalysis: ReviewAnalysis = {
  sentiment: "Sin analizar",
  priority: "Sin analizar",
  summary: "",
  positive_aspects: [],
  negative_aspects: [],
  detected_areas: [],
  predominant_emotion: "Sin analizar",
  recommendation_probability: "Sin analizar",
};

export const emptyReview: DisplayReview = {
  id: null,
  source: "",
  source_review_url: null,
  score: 0,
  date: "Sin fecha",
  property: "Propiedad no especificada",
  guest: "Huésped",
  language: "Idioma no identificado",
  title: "",
  text: "No hay reviews disponibles.",
};

export function formatReviewDate(
  value: string | null
) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function normalizeRating(
  value: number | string | null
) {
  const numericRating = Number(value ?? 0);

  if (!Number.isFinite(numericRating)) {
    return 0;
  }

  return Math.min(
    5,
    Math.max(0, Math.round(numericRating))
  );
}

export function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");

  return initials || "H";
}

export function mapImportedReview(
  importedReview: ImportedReview
): DisplayReview {
  return {
    id: importedReview.id,

    source:
      importedReview.source,

    source_review_url:
      importedReview.source_review_url,

    score: normalizeRating(
      importedReview.rating
    ),

    date: formatReviewDate(
      importedReview.review_date ??
        importedReview.created_at
    ),

    property:
      importedReview.property_name ??
      "Propiedad no especificada",

    guest:
      importedReview.reviewer_name ??
      "Huésped",

    language:
      importedReview.language ??
      importedReview.original_language ??
      "Idioma no identificado",

    title:
      importedReview.review_title ?? "",

    text:
      importedReview.review_text ??
      importedReview.review_title ??
      "La review no contiene texto.",
  };
}

export function mapStoredAnalysis(
  importedReview: ImportedReview
): ReviewAnalysis {
  return {
    sentiment:
      importedReview.sentiment ??
      "Sin analizar",

    priority:
      importedReview.priority ??
      "Sin analizar",

    summary:
      importedReview.analysis_summary ??
      "",

    positive_aspects:
      importedReview.positive_aspects ??
      [],

    negative_aspects:
      importedReview.negative_aspects ??
      [],

    detected_areas:
      importedReview.detected_areas ??
      [],

    predominant_emotion:
      importedReview.predominant_emotion ??
      "Sin analizar",

    recommendation_probability:
      importedReview
        .recommendation_probability ??
      "Sin analizar",
  };
}

export function hasStoredAnalysis(
  importedReview: ImportedReview
) {
  return Boolean(
    importedReview.sentiment &&
      importedReview.priority &&
      importedReview.analysis_summary
  );
}
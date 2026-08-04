import type {
  ImportedReview,
  ReviewSource,
} from "./review-types";

type Props = {
  reviews: ImportedReview[];
  sources: ReviewSource[];
  loading: boolean;
  error?: string;

  onSelectReview: (
    review: ImportedReview
  ) => void;
};

function normalizeRating(
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

function formatReviewDate(
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

export default function ReviewInbox({
  reviews,
  sources,
  loading,
  error,
  onSelectReview,
}: Props) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            Reviews recibidas
          </p>

          <h2>
            Seleccione una review para trabajar
          </h2>
        </div>

        <span className="optional">
          {loading
            ? "Cargando..."
            : `${reviews.length} disponibles`}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="review-inbox-error"
        >
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        reviews.length === 0 && (
          <div className="review-inbox-empty">
            No hay reviews nuevas, pendientes
            o en revisión.
          </div>
        )}

      <div className="review-inbox-list">
        {reviews.map((item) => {
          const score = normalizeRating(
            item.rating
          );

          const sourceName =
            sources.find(
              (source) =>
                source.source_code.toUpperCase() ===
                item.source.toUpperCase()
            )?.source_name ?? item.source;

          const reviewText =
            item.review_text ??
            "La review no contiene texto.";

          return (
            <button
              key={item.id}
              type="button"
              className="review-inbox-item"
              onClick={() =>
                onSelectReview(item)
              }
            >
              <div className="review-inbox-content">
                <div className="review-inbox-meta">
                  <strong>
                    {item.reviewer_name ??
                      "Huésped"}
                  </strong>

                  <span className="optional">
                    {sourceName}
                  </span>

                  <span className="optional">
                    {item.analysis_status}
                  </span>
                </div>

                <p className="review-inbox-title">
                  {item.review_title ??
                    item.property_name ??
                    "Review sin título"}
                </p>

                <p className="review-inbox-text">
                  {reviewText.slice(0, 180)}

                  {reviewText.length > 180
                    ? "…"
                    : ""}
                </p>
              </div>

              <div className="review-inbox-rating">
                <div className="stars">
                  {"★".repeat(score)}
                  {"☆".repeat(5 - score)}
                </div>

                <span className="date">
                  {formatReviewDate(
                    item.review_date ??
                      item.created_at
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
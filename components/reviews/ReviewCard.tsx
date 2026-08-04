import type {
  DisplayReview,
  ReviewSource,
  ReviewStatus,
} from "./review-types";

type Props = {
  review: DisplayReview;
  sources: ReviewSource[];
  selectedSourceId: number | "";
  status: ReviewStatus;

  loadingSources: boolean;
  loadingReview: boolean;

  sourceError?: string;
  reviewError?: string;

  onSourceChange: (
    sourceId: number | ""
  ) => void;

  onStatusChange: (
    status: ReviewStatus
  ) => void;
};

function getInitials(name: string) {
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

export default function ReviewCard({
  review,
  sources,
  selectedSourceId,
  status,
  loadingSources,
  loadingReview,
  sourceError,
  reviewError,
  onSourceChange,
  onStatusChange,
}: Props) {
  const stars =
    "★".repeat(review.score) +
    "☆".repeat(5 - review.score);

  return (
    <article className="panel review-card">
      <div className="review-header">
        <div>
          <div className="platform-row">
            <select
              aria-label="Fuente de la review"
              value={selectedSourceId}
              disabled={
                loadingSources ||
                loadingReview
              }
              onChange={(event) => {
                const value =
                  event.target.value;

                onSourceChange(
                  value === ""
                    ? ""
                    : Number(value)
                );
              }}
            >
              <option value="">
                {loadingSources
                  ? "Cargando fuentes..."
                  : "Seleccione una fuente"}
              </option>

              {sources.map((source) => (
                <option
                  key={source.id}
                  value={source.id}
                >
                  {source.source_name}
                </option>
              ))}
            </select>

            <span className="date">
              {loadingReview
                ? "Cargando..."
                : review.date}
            </span>
          </div>

          <div
            className="stars"
            aria-label={`${review.score} de 5 estrellas`}
          >
            {stars}
          </div>

          {sourceError && (
            <p
              role="alert"
              className="review-card-error"
            >
              {sourceError}
            </p>
          )}

          {reviewError && (
            <p
              role="alert"
              className="review-card-error"
            >
              {reviewError}
            </p>
          )}
        </div>

        <select
          aria-label="Estado de la review"
          value={status}
          onChange={(event) =>
            onStatusChange(
              event.target
                .value as ReviewStatus
            )
          }
        >
          <option>Nueva</option>
          <option>En revisión</option>
          <option>Aprobada</option>
          <option>Publicada</option>
        </select>
      </div>

      <div className="guest-row">
        <div className="avatar">
          {getInitials(review.guest)}
        </div>

        <div>
          <strong>
            {loadingReview
              ? "Cargando huésped..."
              : review.guest}
          </strong>

          <span>
            {review.property} ·{" "}
            {review.language}
          </span>
        </div>
      </div>

      {review.title && (
        <h3 className="review-card-title">
          {review.title}
        </h3>
      )}

      <blockquote>
        {loadingReview
          ? "Cargando review..."
          : review.text}
      </blockquote>
    </article>
  );
}
"use client";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

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

function getInitials(
  name: string
) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part
          .charAt(0)
          .toUpperCase()
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
  const {
    messages,
  } = useLanguage();

  const card =
    messages.reviewDetail
      .reviewCard;

  const stars =
    "★".repeat(
      review.score
    ) +
    "☆".repeat(
      5 - review.score
    );

  return (
    <article className="panel review-card">
      <div className="review-header">
        <div>
          <div className="platform-row">
            <select
              aria-label={
                card.sourceAria
              }
              value={
                selectedSourceId
              }
              disabled={
                loadingSources ||
                loadingReview
              }
              onChange={(
                event
              ) => {
                const value =
                  event.target
                    .value;

                onSourceChange(
                  value === ""
                    ? ""
                    : Number(
                        value
                      )
                );
              }}
            >
              <option value="">
                {loadingSources
                  ? card.loadingSources
                  : card.selectSource}
              </option>

              {sources.map(
                (source) => (
                  <option
                    key={
                      source.id
                    }
                    value={
                      source.id
                    }
                  >
                    {
                      source.source_name
                    }
                  </option>
                )
              )}
            </select>

            <span className="date">
              {loadingReview
                ? card.loading
                : review.date}
            </span>
          </div>

          <div
            className="stars"
            aria-label={`${review.score} ${card.starsSuffix}`}
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
          aria-label={
            card.statusAria
          }
          value={status}
          onChange={(
            event
          ) =>
            onStatusChange(
              event.target
                .value as ReviewStatus
            )
          }
        >
          <option value="Nueva">
            {
              card.statuses
                .new
            }
          </option>

          <option value="En revisión">
            {
              card.statuses
                .inReview
            }
          </option>

          <option value="Aprobada">
            {
              card.statuses
                .approved
            }
          </option>

          <option value="Publicada">
            {
              card.statuses
                .published
            }
          </option>
        </select>
      </div>

      <div className="guest-row">
        <div className="avatar">
          {
            getInitials(
              review.guest
            )
          }
        </div>

        <div>
          <strong>
            {loadingReview
              ? card.loadingGuest
              : review.guest}
          </strong>

          <span>
            {review.property}
            {" · "}
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
          ? card.loadingReview
          : review.text}
      </blockquote>
    </article>
  );
}
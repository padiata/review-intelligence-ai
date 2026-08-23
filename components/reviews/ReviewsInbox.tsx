"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

type ReviewSource = {
  id: number;
  source_code: string;
  source_name: string;
};

type ImportedReview = {
  id: number;
  created_at: string;

  source: string;
  source_review_id: string;
  source_review_url: string | null;

  property_name: string | null;

  review_title: string | null;
  review_text: string | null;

  rating: number | string | null;

  review_date: string | null;

  reviewer_name: string | null;

  review_status: string;

  sentiment: string | null;
  priority: string | null;
};

function normalizeRating(
  value: number | string | null
) {
  const numericRating =
    Number(value ?? 0);

  if (
    !Number.isFinite(
      numericRating
    )
  ) {
    return 0;
  }

  return Math.min(
    5,
    Math.max(
      0,
      Math.round(
        numericRating
      )
    )
  );
}

function formatReviewDate(
  value: string | null,
  language: "es" | "en",
  noDateLabel: string
) {
  if (!value) {
    return noDateLabel;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return noDateLabel;
  }

  return new Intl.DateTimeFormat(
    language === "es"
      ? "es-ES"
      : "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

export default function ReviewsInbox() {
  const supabase =
    useMemo(
      () => createClient(),
      []
    );

  const {
    language,
    messages,
  } = useLanguage();

  const inbox =
    messages.reviewsInbox;

  const [
    sources,
    setSources,
  ] =
    useState<ReviewSource[]>(
      []
    );

  const [
    reviews,
    setReviews,
  ] =
    useState<ImportedReview[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    sourceFilter,
    setSourceFilter,
  ] =
    useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("open");

  useEffect(() => {
    async function loadInbox() {
      setLoading(true);
      setErrorMessage("");

      const [
        sourcesResult,
        reviewsResult,
      ] =
        await Promise.all([
          supabase
            .from(
              "review_sources"
            )
            .select(
              "id, source_code, source_name"
            )
            .eq(
              "active",
              true
            )
            .order(
              "source_name",
              {
                ascending:
                  true,
              }
            ),

          supabase
            .from(
              "imported_reviews"
            )
            .select(
              `
                id,
                created_at,
                source,
                source_review_id,
                source_review_url,
                property_name,
                review_title,
                review_text,
                rating,
                review_date,
                reviewer_name,
                review_status,
                sentiment,
                priority
              `
            )
            .order(
              "review_date",
              {
                ascending:
                  false,
              }
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            ),
        ]);

      if (
        sourcesResult.error
      ) {
        console.error(
          "Error cargando las fuentes:",
          sourcesResult.error
        );
      } else {
        setSources(
          (
            sourcesResult.data as
              | ReviewSource[]
              | null
          ) ?? []
        );
      }

      if (
        reviewsResult.error
      ) {
        console.error(
          "Error cargando la bandeja:",
          reviewsResult.error
        );

        setReviews([]);

        setErrorMessage(
          `${inbox.loadErrorPrefix} ${reviewsResult.error.message}`
        );
      } else {
        setReviews(
          (
            reviewsResult.data as
              | ImportedReview[]
              | null
          ) ?? []
        );
      }

      setLoading(false);
    }

    void loadInbox();
  }, [
    supabase,
    inbox.loadErrorPrefix,
  ]);

  const filteredReviews =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return reviews.filter(
        (review) => {
          const matchesSearch =
            !query ||
            [
              review.reviewer_name,
              review.review_title,
              review.review_text,
              review.property_name,
              review.source,
            ].some(
              (value) =>
                (
                  value ?? ""
                )
                  .toLowerCase()
                  .includes(
                    query
                  )
            );

          const matchesSource =
            sourceFilter ===
              "all" ||
            review.source.toUpperCase() ===
              sourceFilter.toUpperCase();

          const matchesStatus =
            statusFilter ===
              "all" ||
            (
              statusFilter ===
              "open"
                ? [
                    "new",
                    "pending",
                    "in_review",
                  ].includes(
                    review.review_status
                  )
                : review.review_status ===
                  statusFilter
            );

          return (
            matchesSearch &&
            matchesSource &&
            matchesStatus
          );
        }
      );
    }, [
      reviews,
      search,
      sourceFilter,
      statusFilter,
    ]);

  function getSourceName(
    sourceCode: string
  ) {
    return (
      sources.find(
        (source) =>
          source.source_code.toUpperCase() ===
          sourceCode.toUpperCase()
      )?.source_name ??
      sourceCode
    );
  }

  function getStatusLabel(
    status: string
  ) {
    switch (status) {
      case "new":
        return inbox.statuses.new;

      case "pending":
        return inbox.statuses.pending;

      case "in_review":
        return inbox.statuses.in_review;

      case "approved":
        return inbox.statuses.approved;

      case "published":
        return inbox.statuses.published;

      default:
        return status;
    }
  }

  return (
    <div className="reviews-inbox">
      <section className="reviews-inbox-header">
        <div>
          <p className="eyebrow">
            {inbox.eyebrow}
          </p>

          <h2>
            {inbox.title}
          </h2>

          <span>
            {inbox.description}
          </span>
        </div>

        <span className="reviews-count">
          {loading
            ? inbox.loading
            : `${filteredReviews.length} ${inbox.availableSuffix}`}
        </span>
      </section>

      <section className="reviews-filters">
        <input
          type="search"
          value={search}
          onChange={(
            event
          ) =>
            setSearch(
              event.target.value
            )
          }
          placeholder={
            inbox.searchPlaceholder
          }
          aria-label={
            inbox.searchAria
          }
        />

        <select
          value={sourceFilter}
          onChange={(
            event
          ) =>
            setSourceFilter(
              event.target.value
            )
          }
          aria-label={
            inbox.sourceFilterAria
          }
        >
          <option value="all">
            {inbox.allSources}
          </option>

          {sources.map(
            (source) => (
              <option
                key={
                  source.id
                }
                value={
                  source.source_code
                }
              >
                {
                  source.source_name
                }
              </option>
            )
          )}
        </select>

        <select
          value={statusFilter}
          onChange={(
            event
          ) =>
            setStatusFilter(
              event.target.value
            )
          }
          aria-label={
            inbox.statusFilterAria
          }
        >
          <option value="open">
            {
              inbox.openStatuses
            }
          </option>

          <option value="all">
            {
              inbox.allStatuses
            }
          </option>

          <option value="new">
            {
              inbox
                .statusesPlural
                .new
            }
          </option>

          <option value="pending">
            {
              inbox
                .statusesPlural
                .pending
            }
          </option>

          <option value="in_review">
            {
              inbox
                .statusesPlural
                .in_review
            }
          </option>

          <option value="approved">
            {
              inbox
                .statusesPlural
                .approved
            }
          </option>

          <option value="published">
            {
              inbox
                .statusesPlural
                .published
            }
          </option>
        </select>
      </section>

      {errorMessage && (
        <p
          className="reviews-error"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      {!loading &&
        !errorMessage &&
        filteredReviews.length ===
          0 && (
          <section className="reviews-empty">
            {inbox.empty}
          </section>
        )}

      <section className="reviews-list">
        {filteredReviews.map(
          (review) => {
            const score =
              normalizeRating(
                review.rating
              );

            return (
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="review-list-card"
              >
                <div className="review-list-content">
                  <div className="review-list-meta">
                    <strong>
                      {review.reviewer_name ??
                        inbox.guest}
                    </strong>

                    <span>
                      {getSourceName(
                        review.source
                      )}
                    </span>

                    <span>
                      {getStatusLabel(
                        review.review_status
                      )}
                    </span>

                    {review.sentiment && (
                      <span>
                        {
                          review.sentiment
                        }
                      </span>
                    )}

                    {review.priority && (
                      <span>
                        {inbox.priority}{" "}
                        {
                          review.priority
                        }
                      </span>
                    )}
                  </div>

                  <h3>
                    {review.review_title ??
                      review.property_name ??
                      inbox.untitled}
                  </h3>

                  <p>
                    {(
                      review.review_text ??
                      inbox.noText
                    ).slice(
                      0,
                      220
                    )}

                    {(review.review_text ??
                      "").length >
                    220
                      ? "…"
                      : ""}
                  </p>
                </div>

                <div className="review-list-rating">
                  <div
                    className="stars"
                    aria-label={`${score} ${inbox.starsSuffix}`}
                  >
                    {"★".repeat(
                      score
                    )}

                    {"☆".repeat(
                      5 - score
                    )}
                  </div>

                  <span>
                    {formatReviewDate(
                      review.review_date ??
                        review.created_at,
                      language,
                      inbox.noDate
                    )}
                  </span>
                </div>
              </Link>
            );
          }
        )}
      </section>
    </div>
  );
}
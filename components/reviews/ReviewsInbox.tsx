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
  value: string | null
) {
  if (!value) {
    return "Sin fecha";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-CU",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function statusLabel(
  status: string
) {
  switch (status) {
    case "new":
      return "Nueva";

    case "pending":
      return "Pendiente";

    case "in_review":
      return "En revisión";

    case "approved":
      return "Aprobada";

    case "published":
      return "Publicada";

    default:
      return status;
  }
}

export default function ReviewsInbox() {
  const supabase =
    useMemo(
      () => createClient(),
      []
    );

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
          `No se pudo cargar la bandeja: ${reviewsResult.error.message}`
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
  }, [supabase]);

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

  return (
    <div className="reviews-inbox">
      <section className="reviews-inbox-header">
        <div>
          <p className="eyebrow">
            Reviews recibidas
          </p>

          <h2>
            Bandeja de reviews
          </h2>

          <span>
            Seleccione una review
            para analizarla y
            preparar su respuesta.
          </span>
        </div>

        <span className="reviews-count">
          {loading
            ? "Cargando..."
            : `${filteredReviews.length} disponibles`}
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
          placeholder="Buscar por huésped, título, hotel o contenido..."
          aria-label="Buscar reviews"
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
          aria-label="Filtrar por fuente"
        >
          <option value="all">
            Todas las fuentes
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
          aria-label="Filtrar por estado"
        >
          <option value="open">
            Pendientes de gestión
          </option>

          <option value="all">
            Todos los estados
          </option>

          <option value="new">
            Nuevas
          </option>

          <option value="pending">
            Pendientes
          </option>

          <option value="in_review">
            En revisión
          </option>

          <option value="approved">
            Aprobadas
          </option>

          <option value="published">
            Publicadas
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
            No hay reviews que
            coincidan con los
            filtros.
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
                        "Huésped"}
                    </strong>

                    <span>
                      {getSourceName(
                        review.source
                      )}
                    </span>

                    <span>
                      {statusLabel(
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
                        Prioridad{" "}
                        {
                          review.priority
                        }
                      </span>
                    )}
                  </div>

                  <h3>
                    {review.review_title ??
                      review.property_name ??
                      "Review sin título"}
                  </h3>

                  <p>
                    {(
                      review.review_text ??
                      "La review no contiene texto."
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
                    aria-label={`${score} de 5 estrellas`}
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
                        review.created_at
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
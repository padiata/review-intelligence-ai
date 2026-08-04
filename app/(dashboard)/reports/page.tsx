"use client";

import { useMemo, useState } from "react";

import type {
  ExecutiveReport,
  GenerateReportResponse,
  OperationalPriority,
  PositiveHighlight,
  ReportFinding,
} from "@/lib/reports/report.types";

import "./ReportsPage.css";

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultPeriod() {
  const endDate = new Date();

  const startDate = new Date();
  startDate.setDate(
    startDate.getDate() - 29
  );

  return {
    startDate: formatInputDate(startDate),
    endDate: formatInputDate(endDate),
  };
}

function formatDisplayDate(
  value: string | null
) {
  if (!value) {
    return "No disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "No disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "es",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function priorityLabel(
  priority: string
) {
  switch (
    priority.trim().toLowerCase()
  ) {
    case "critical":
      return "Crítica";

    case "high":
      return "Alta";

    case "medium":
      return "Media";

    case "low":
      return "Baja";

    default:
      return priority;
  }
}

function priorityClass(
  priority: string
) {
  switch (
    priority.trim().toLowerCase()
  ) {
    case "critical":
      return "critical";

    case "high":
      return "high";

    case "medium":
      return "medium";

    default:
      return "low";
  }
}

function ReportPriorityCard({
  priority,
}: {
  priority: OperationalPriority;
}) {
  return (
    <article className="report-priority-card">
      <div className="report-priority-heading">
        <div>
          <span
            className={`report-priority-badge ${priorityClass(
              priority.priority
            )}`}
          >
            Prioridad{" "}
            {priorityLabel(
              priority.priority
            )}
          </span>

          <h3>{priority.title}</h3>
        </div>
      </div>

      {priority.summary && (
        <div className="report-block">
          <strong>Situación detectada</strong>
          <p>{priority.summary}</p>
        </div>
      )}

      {priority.impact && (
        <div className="report-block">
          <strong>
            Impacto operativo
          </strong>
          <p>{priority.impact}</p>
        </div>
      )}

      {priority.evidence.length > 0 && (
        <div className="report-block">
          <strong>
            Evidencias representativas
          </strong>

          <div className="report-evidence-list">
            {priority.evidence.map(
              (evidence, index) => (
                <blockquote
                  key={`${priority.title}-${index}`}
                >
                  “{evidence}”
                </blockquote>
              )
            )}
          </div>
        </div>
      )}

      {priority.recommendedAction && (
        <div className="report-action">
          <strong>Acción sugerida</strong>
          <p>
            {priority.recommendedAction}
          </p>
        </div>
      )}
    </article>
  );
}

function PositiveHighlightCard({
  highlight,
}: {
  highlight: PositiveHighlight;
}) {
  return (
    <article className="report-highlight-card">
      <h3>{highlight.title}</h3>

      <p>{highlight.summary}</p>

      {highlight.evidence.length > 0 && (
        <div className="report-evidence-list">
          {highlight.evidence.map(
            (evidence, index) => (
              <blockquote
                key={`${highlight.title}-${index}`}
              >
                “{evidence}”
              </blockquote>
            )
          )}
        </div>
      )}
    </article>
  );
}

function FindingsAnnex({
  findings,
}: {
  findings: ReportFinding[];
}) {
  const [expanded, setExpanded] =
    useState(false);

  if (findings.length === 0) {
    return null;
  }

  const visibleFindings = expanded
    ? findings
    : findings.slice(0, 10);

  return (
    <section className="report-section">
      <div className="report-section-heading">
        <div>
          <p className="report-eyebrow">
            Trazabilidad
          </p>

          <h2>
            Anexo de hallazgos
          </h2>
        </div>

        <span className="report-count">
          {findings.length} hallazgos
        </span>
      </div>

      <div className="report-findings-list">
        {visibleFindings.map(
          (finding) => (
            <article
              key={finding.id}
              className="report-finding"
            >
              <div className="report-finding-heading">
                <div>
                  <strong>
                    {finding.areaCode ??
                      "Área no clasificada"}
                  </strong>

                  {finding.causeCode && (
                    <span>
                      {finding.causeCode}
                    </span>
                  )}
                </div>

                {finding.priority && (
                  <span
                    className={`report-priority-badge ${priorityClass(
                      finding.priority
                    )}`}
                  >
                    {priorityLabel(
                      finding.priority
                    )}
                  </span>
                )}
              </div>

              <p>
                {finding.findingSummary}
              </p>

              {finding.evidenceText && (
                <blockquote>
                  “{finding.evidenceText}”
                </blockquote>
              )}

              <footer>
                <span>
                  Review #{finding.reviewId}
                </span>

                <span>
                  {formatDisplayDate(
                    finding.reviewDate
                  )}
                </span>
              </footer>
            </article>
          )
        )}
      </div>

      {findings.length > 10 && (
        <button
          type="button"
          className="report-secondary-button"
          onClick={() =>
            setExpanded(
              (current) => !current
            )
          }
        >
          {expanded
            ? "Mostrar menos"
            : `Mostrar los ${findings.length} hallazgos`}
        </button>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const defaultPeriod =
    useMemo(
      () => getDefaultPeriod(),
      []
    );

  const [startDate, setStartDate] =
    useState(
      defaultPeriod.startDate
    );

  const [endDate, setEndDate] =
    useState(
      defaultPeriod.endDate
    );

  const [report, setReport] =
    useState<ExecutiveReport | null>(
      null
    );

  const [
    reportHistoryId,
    setReportHistoryId,
  ] = useState<number | null>(null);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  function selectLastSevenDays() {
    const end = new Date();

    const start = new Date();
    start.setDate(
      start.getDate() - 6
    );

    setStartDate(
      formatInputDate(start)
    );
    setEndDate(formatInputDate(end));
  }

  function selectLastThirtyDays() {
    const period =
      getDefaultPeriod();

    setStartDate(period.startDate);
    setEndDate(period.endDate);
  }

  function selectPreviousMonth() {
    const now = new Date();

    const start = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    );

    setStartDate(
      formatInputDate(start)
    );
    setEndDate(formatInputDate(end));
  }

  async function generateReport() {
    setErrorMessage("");
    setReport(null);
    setReportHistoryId(null);

    if (!startDate || !endDate) {
      setErrorMessage(
        "Debe seleccionar la fecha inicial y la fecha final."
      );
      return;
    }

    if (
      new Date(startDate) >
      new Date(endDate)
    ) {
      setErrorMessage(
        "La fecha inicial no puede ser posterior a la fecha final."
      );
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        "/api/reports/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            startDate,
            endDate,
          }),
        }
      );

      const data =
        (await response.json()) as GenerateReportResponse & {
          reportHistoryId?: number;
        };

      if (
        !response.ok ||
        !data.report
      ) {
        throw new Error(
          data.error ||
            "No se pudo generar el informe."
        );
      }

      setReport(data.report);
      setReportHistoryId(
        data.reportHistoryId ?? null
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo generar el informe."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <p className="report-eyebrow">
            Inteligencia operativa
          </p>

          <h1>
            Informe ejecutivo
          </h1>

          <p>
            Seleccione el período de las
            opiniones que desea analizar.
            El informe se generará bajo
            demanda a partir de los
            hallazgos disponibles.
          </p>
        </div>
      </header>

      <section className="report-generator-card">
        <div className="report-period-heading">
          <div>
            <h2>
              Período del informe
            </h2>

            <p>
              El período se calcula mediante
              la fecha real de publicación de
              cada review.
            </p>
          </div>
        </div>

        <div className="report-quick-periods">
          <button
            type="button"
            onClick={selectLastSevenDays}
          >
            Últimos 7 días
          </button>

          <button
            type="button"
            onClick={selectLastThirtyDays}
          >
            Últimos 30 días
          </button>

          <button
            type="button"
            onClick={selectPreviousMonth}
          >
            Mes anterior
          </button>
        </div>

        <div className="report-period-form">
          <label>
            <span>Desde</span>

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
              disabled={isGenerating}
            />
          </label>

          <label>
            <span>Hasta</span>

            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value
                )
              }
              disabled={isGenerating}
            />
          </label>

          <button
            type="button"
            className="report-primary-button"
            onClick={() =>
              void generateReport()
            }
            disabled={isGenerating}
          >
            {isGenerating
              ? "Generando informe..."
              : "Generar informe"}
          </button>
        </div>

        {isGenerating && (
          <div
            className="report-generation-status"
            aria-live="polite"
          >
            <span className="report-spinner" />

            <div>
              <strong>
                Preparando informe
              </strong>

              <p>
                Estamos organizando los
                hallazgos y redactando el
                informe ejecutivo. Este
                proceso puede tardar algunos
                segundos.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            className="report-error"
            role="alert"
          >
            {errorMessage}
          </div>
        )}
      </section>

      {report && (
        <article className="executive-report">
          <header className="executive-report-header">
            <div>
              <p className="report-eyebrow">
                Informe de inteligencia
                operativa
              </p>

              <h2>
                {report.entityName}
              </h2>

              <p>
                Opiniones publicadas entre el{" "}
                <strong>
                  {formatDisplayDate(
                    report.period.startDate
                  )}
                </strong>{" "}
                y el{" "}
                <strong>
                  {formatDisplayDate(
                    report.period.endDate
                  )}
                </strong>
                .
              </p>
            </div>

            <div className="report-document-meta">
              <span>
                Generado:{" "}
                {formatDateTime(
                  report.generatedAt
                )}
              </span>

              <span>
                Sincronizado hasta:{" "}
                {formatDateTime(
                  report.synchronizedUntil
                )}
              </span>

              {reportHistoryId && (
                <span>
                  Informe #
                  {reportHistoryId}
                </span>
              )}
            </div>
          </header>

          <div className="report-source-summary">
            <div>
              <span>Opiniones utilizadas</span>
              <strong>
                {report.reviewCount}
              </strong>
            </div>

            <div>
              <span>Hallazgos utilizados</span>
              <strong>
                {report.findingCount}
              </strong>
            </div>
          </div>

          <section className="report-section">
            <div className="report-section-heading">
              <div>
                <p className="report-eyebrow">
                  Visión general
                </p>

                <h2>
                  Resumen ejecutivo
                </h2>
              </div>
            </div>

            <div className="report-executive-summary">
              {report.executiveSummary
                .split(/\n{2,}/)
                .filter(Boolean)
                .map(
                  (paragraph, index) => (
                    <p key={index}>
                      {paragraph}
                    </p>
                  )
                )}
            </div>
          </section>

          <section className="report-section">
            <div className="report-section-heading">
              <div>
                <p className="report-eyebrow">
                  Atención requerida
                </p>

                <h2>
                  Prioridades operativas
                </h2>
              </div>

              <span className="report-count">
                {
                  report
                    .operationalPriorities
                    .length
                }{" "}
                prioridades
              </span>
            </div>

            {report.operationalPriorities
              .length > 0 ? (
              <div className="report-priorities-list">
                {report.operationalPriorities.map(
                  (priority, index) => (
                    <ReportPriorityCard
                      key={`${priority.title}-${index}`}
                      priority={priority}
                    />
                  )
                )}
              </div>
            ) : (
              <p className="report-empty">
                No se detectaron prioridades
                operativas relevantes.
              </p>
            )}
          </section>

          <section className="report-section">
            <div className="report-section-heading">
              <div>
                <p className="report-eyebrow">
                  Fortalezas
                </p>

                <h2>
                  Aspectos positivos
                </h2>
              </div>
            </div>

            {report.positiveHighlights
              .length > 0 ? (
              <div className="report-highlights-grid">
                {report.positiveHighlights.map(
                  (highlight, index) => (
                    <PositiveHighlightCard
                      key={`${highlight.title}-${index}`}
                      highlight={highlight}
                    />
                  )
                )}
              </div>
            ) : (
              <p className="report-empty">
                No se identificaron aspectos
                positivos específicos para
                este período.
              </p>
            )}
          </section>

          <section className="report-section">
            <div className="report-section-heading">
              <div>
                <p className="report-eyebrow">
                  Próximos pasos
                </p>

                <h2>
                  Recomendaciones
                </h2>
              </div>
            </div>

            {report.recommendations.length >
            0 ? (
              <ol className="report-recommendations">
                {report.recommendations.map(
                  (
                    recommendation,
                    index
                  ) => (
                    <li
                      key={`${recommendation}-${index}`}
                    >
                      <span>
                        {index + 1}
                      </span>

                      <p>
                        {recommendation}
                      </p>
                    </li>
                  )
                )}
              </ol>
            ) : (
              <p className="report-empty">
                No se generaron recomendaciones
                para este período.
              </p>
            )}
          </section>

          <FindingsAnnex
            findings={report.findings}
          />
        </article>
      )}
    </div>
  );
}
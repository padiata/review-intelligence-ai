"use client";

import { useMemo, useState } from "react";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

import type {
  ExecutiveReport,
  GenerateReportResponse,
  OperationalPriority,
  PositiveHighlight,
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
    startDate:
      formatInputDate(startDate),

    endDate:
      formatInputDate(endDate),
  };
}

function formatDisplayDate(
  value: string | null,
  locale: string,
  unavailableLabel: string
) {
  if (!value) {
    return unavailableLabel;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatDateTime(
  value: string | null,
  locale: string,
  unavailableLabel: string
) {
  if (!value) {
    return unavailableLabel;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function priorityClass(
  priority: string
) {
  switch (
    priority
      .trim()
      .toLowerCase()
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
  reportMessages,
}: {
  priority: OperationalPriority;
  reportMessages: {
    relevance: string;
    detectedObservation: string;
    representativeEvidence: string;
    priorities: {
      critical: string;
      high: string;
      medium: string;
      low: string;
    };
  };
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
            {reportMessages.relevance}{" "}
            {reportMessages.priorities[
              priority.priority
                .trim()
                .toLowerCase() as
                keyof typeof reportMessages.priorities
            ] ?? priority.priority}
          </span>

          <h3>
            {priority.title}
          </h3>
        </div>
      </div>

      {priority.summary && (
        <div className="report-block">
          <strong>
            {reportMessages.detectedObservation}
          </strong>

          <p>
            {priority.summary}
          </p>
        </div>
      )}

      {priority.evidence.length >
        0 && (
        <div className="report-block">
          <strong>
            {reportMessages.representativeEvidence}
          </strong>

          <div className="report-evidence-list">
            {priority.evidence.map(
              (
                evidence,
                index
              ) => (
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
      <h3>
        {highlight.title}
      </h3>

      <p>
        {highlight.summary}
      </p>

      {highlight.evidence.length >
        0 && (
        <div className="report-evidence-list">
          {highlight.evidence.map(
            (
              evidence,
              index
            ) => (
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

export default function ReportsPage() {
  const {
    language,
    messages,
  } = useLanguage();

  const reportMessages =
    messages.reportsPage;

  const locale =
    language === "en"
      ? "en-US"
      : "es-ES";

  const defaultPeriod =
    useMemo(
      () => getDefaultPeriod(),
      []
    );

  const [
    startDate,
    setStartDate,
  ] = useState(
    defaultPeriod.startDate
  );

  const [
    endDate,
    setEndDate,
  ] = useState(
    defaultPeriod.endDate
  );

  const [
    report,
    setReport,
  ] =
    useState<ExecutiveReport | null>(
      null
    );

  const [
    reportHistoryId,
    setReportHistoryId,
  ] =
    useState<number | null>(
      null
    );

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  function selectLastSevenDays() {
    const end = new Date();

    const start = new Date();

    start.setDate(
      start.getDate() - 6
    );

    setStartDate(
      formatInputDate(start)
    );

    setEndDate(
      formatInputDate(end)
    );
  }

  function selectLastThirtyDays() {
    const period =
      getDefaultPeriod();

    setStartDate(
      period.startDate
    );

    setEndDate(
      period.endDate
    );
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

    setEndDate(
      formatInputDate(end)
    );
  }

  async function generateReport() {
    setErrorMessage("");
    setReport(null);
    setReportHistoryId(null);

    if (
      !startDate ||
      !endDate
    ) {
      setErrorMessage(
        reportMessages.missingDates
      );

      return;
    }

    if (
      new Date(startDate) >
      new Date(endDate)
    ) {
      setErrorMessage(
        reportMessages.invalidPeriod
      );

      return;
    }

    setIsGenerating(true);

    try {
      const response =
        await fetch(
          "/api/reports/generate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                entityId: 1,
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
            reportMessages.generationFailed
        );
      }

      setReport(
        data.report
      );

      setReportHistoryId(
        data.reportHistoryId ??
          null
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : reportMessages.generationFailed
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
            {reportMessages.eyebrow}
          </p>

          <h1>
            {reportMessages.title}
          </h1>

          <p>
            {reportMessages.description}
          </p>
        </div>
      </header>

      <section className="report-generator-card">
        <div className="report-period-heading">
          <div>
            <h2>
              {reportMessages.periodTitle}
            </h2>

            <p>
              {reportMessages.periodDescription}
            </p>
          </div>
        </div>

        <div className="report-quick-periods">
          <button
            type="button"
            onClick={selectLastSevenDays}
            disabled={isGenerating}
          >
            {reportMessages.last7Days}
          </button>

          <button
            type="button"
            onClick={selectLastThirtyDays}
            disabled={isGenerating}
          >
            {reportMessages.last30Days}
          </button>

          <button
            type="button"
            onClick={selectPreviousMonth}
            disabled={isGenerating}
          >
            {reportMessages.previousMonth}
          </button>
        </div>

        <div className="report-period-form">
          <label>
            <span>{reportMessages.from}</span>

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
            <span>{reportMessages.to}</span>

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
              ? reportMessages.generating
              : reportMessages.generate}
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
                {reportMessages.preparingTitle}
              </strong>

              <p>
                {reportMessages.preparingDescription}
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
                {reportMessages.reportEyebrow}
              </p>

              <h2>
                {report.entityName}
              </h2>

              <p>
                {reportMessages.publishedBetween}{" "}
                <strong>
                  {formatDisplayDate(
                    report.period.startDate,
                    locale,
                    reportMessages.unavailable
                  )}
                </strong>{" "}
                {reportMessages.and}{" "}
                <strong>
                  {formatDisplayDate(
                    report.period.endDate,
                    locale,
                    reportMessages.unavailable
                  )}
                </strong>
                .
              </p>
            </div>

       <div className="report-document-meta">

  <span>
    {reportMessages.generated}{" "}
    {formatDateTime(
      report.generatedAt,
      locale,
      reportMessages.unavailable
    )}
  </span>

  <span>
    {reportMessages.synchronizedUntil}{" "}
    {formatDateTime(
      report.synchronizedUntil,
      locale,
      reportMessages.unavailable
    )}
  </span>

  {reportHistoryId && (
    <span>
      {reportMessages.reportNumber} #{reportHistoryId}
    </span>
  )}

  <button
    type="button"
    className="report-print-button"
    onClick={() => window.print()}
  >
    {reportMessages.print}
  </button>

</div>
          </header>

          <div className="report-source-summary">
            <div>
              <span>
                {reportMessages.reviewsUsed}
              </span>

              <strong>
                {report.reviewCount}
              </strong>
            </div>

            <div>
              <span>
                {reportMessages.findingsUsed}
              </span>

              <strong>
                {report.findingCount}
              </strong>
            </div>
          </div>

          <section className="report-section">
            <div className="report-section-heading">
              <div>
                <p className="report-eyebrow">
                  {reportMessages.overview}
                </p>

                <h2>
                  {reportMessages.executiveSummary}
                </h2>
              </div>
            </div>

            <div className="report-executive-summary">
              {report.executiveSummary
                .split(/\n{2,}/)
                .filter(Boolean)
                .map(
                  (
                    paragraph,
                    index
                  ) => (
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
                  {reportMessages.findingsEyebrow}
                </p>

                <h2>
                  {reportMessages.relevantFindings}
                </h2>
              </div>

              <span className="report-count">
                {
                  report
                    .operationalPriorities
                    .length
                }{" "}
                {reportMessages.findingsSuffix}
              </span>
            </div>

            {report.operationalPriorities
              .length > 0 ? (
              <div className="report-priorities-list">
                {report.operationalPriorities.map(
                  (
                    priority,
                    index
                  ) => (
                    <ReportPriorityCard
                      key={`${priority.title}-${index}`}
                      priority={priority}
                      reportMessages={
                        reportMessages
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <p className="report-empty">
                {reportMessages.noFindings}
              </p>
            )}
          </section>

          <section className="report-section">
            <div className="report-section-heading">
              <div>
                <p className="report-eyebrow">
                  {reportMessages.strengths}
                </p>

                <h2>
                  {reportMessages.positiveAspects}
                </h2>
              </div>
            </div>

            {report.positiveHighlights
              .length > 0 ? (
              <div className="report-highlights-grid">
                {report.positiveHighlights.map(
                  (
                    highlight,
                    index
                  ) => (
                    <PositiveHighlightCard
                      key={`${highlight.title}-${index}`}
                      highlight={highlight}
                    />
                  )
                )}
              </div>
            ) : (
              <p className="report-empty">
                {reportMessages.noPositiveAspects}
              </p>
            )}
          </section>

          <section className="report-section">
            <div className="report-section-heading">
              <div>
                <p className="report-eyebrow">
                  {reportMessages.methodologyEyebrow}
                </p>

                <h2>
                  {reportMessages.reportScope}
                </h2>
              </div>
            </div>

            <div className="report-executive-summary">
              <p>
                {report.methodologicalNote}
              </p>
            </div>
          </section>
        </article>
      )}
    </div>
  );
}
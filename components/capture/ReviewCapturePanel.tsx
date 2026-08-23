"use client";

import {
  useState,
} from "react";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

type CaptureRound = {
  taskId: string;

  requestedDepth: number;
  downloadedCount: number;
  normalizedCount: number;
  insertedCount: number;
  duplicateCount: number;

  jsonPath: string;
};

type CaptureResult = {
  success: true;

  entityId: number;
  entityName: string;

  initialDepth: number;
  finalDepth: number;
  depthStep: number;
  maxDepth: number;

  totalInserted: number;

  stopReason:
    | "SOURCE_EXHAUSTED"
    | "NO_NEW_REVIEWS"
    | "MAX_DEPTH_REACHED";

  rounds: CaptureRound[];

  understanding: {
    pendingAtStart: number;

    processedCount: number;
    analyzedCount: number;
    failedCount: number;

    findingsCreated: number;

    batchesProcessed: number;
    pendingAtEnd: number;
  };
};

export default function ReviewCapturePanel() {
  const {
    messages,
  } = useLanguage();

  const capture =
    messages.capture;

  const [
    running,
    setRunning,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  const [
    result,
    setResult,
  ] = useState<CaptureResult | null>(
    null
  );

  async function runPipeline() {
    try {
      setRunning(true);
      setErrorMessage(null);
      setResult(null);

      const response =
        await fetch(
          "/api/admin/review-capture/tripadvisor",
          {
            method: "POST",
          }
        );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ??
            capture.panel.defaultError
        );
      }

      setResult(
        payload as CaptureResult
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : capture.panel
              .unexpectedError
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {
              capture.panel.title
            }
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {
              capture.panel
                .description
            }
          </p>
        </div>

        <button
          type="button"
          disabled={running}
          onClick={runPipeline}
          className="mt-7 inline-flex min-w-52 items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {running
            ? capture.panel
                .runningButton
            : capture.panel
                .runButton}
        </button>
      </section>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-900"
        >
          ⚠ {errorMessage}
        </div>
      )}

      {running && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-8 text-center">
          <p className="font-semibold text-blue-900">
            {
              capture.panel
                .runningTitle
            }
          </p>

          <p className="mt-2 text-sm text-blue-700">
            {
              capture.panel
                .runningDescription
            }
          </p>
        </div>
      )}

      {result && (
        <CaptureResultPanel
          result={result}
        />
      )}
    </div>
  );
}

/////////////////////////////////////////////////

function CaptureResultPanel({
  result,
}: {
  result: CaptureResult;
}) {
  const {
    messages,
  } = useLanguage();

  const capture =
    messages.capture;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="rounded-xl bg-emerald-50 p-5">
        <h2 className="text-lg font-semibold text-emerald-900">
          ✓{" "}
          {
            capture.result
              .completed
          }
        </h2>

        <p className="mt-2 text-sm text-emerald-800">
          {
            capture.result
              .insertedPrefix
          }{" "}
          <strong>
            {result.totalInserted}
          </strong>{" "}
          {
            capture.result
              .insertedMiddle
          }{" "}
          <strong>
            {result.entityName}
          </strong>
          .
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label={
            capture.result
              .initialDepth
          }
          value={
            result.initialDepth
          }
        />

        <Metric
          label={
            capture.result
              .finalDepth
          }
          value={
            result.finalDepth
          }
        />

        <Metric
          label={
            capture.result.rounds
          }
          value={
            result.rounds.length
          }
        />

        <Metric
          label={
            capture.result
              .totalInserted
          }
          value={
            result.totalInserted
          }
        />
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {
            capture.result
              .stopReason
          }
        </p>

        <p className="mt-2 text-sm font-medium text-slate-800">
          {getStopReasonLabel(
            result.stopReason,
            capture.stopReasons
          )}
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">
                {
                  capture.result
                    .table.depth
                }
              </th>

              <th className="px-4 py-3">
                {
                  capture.result
                    .table
                    .downloaded
                }
              </th>

              <th className="px-4 py-3">
                {
                  capture.result
                    .table
                    .inserted
                }
              </th>

              <th className="px-4 py-3">
                {
                  capture.result
                    .table
                    .duplicates
                }
              </th>

              <th className="px-4 py-3">
                {
                  capture.result
                    .table.task
                }
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {result.rounds.map(
              (round) => (
                <tr
                  key={round.taskId}
                  className="bg-white text-slate-700"
                >
                  <td className="px-4 py-3 font-semibold">
                    {
                      round.requestedDepth
                    }
                  </td>

                  <td className="px-4 py-3">
                    {
                      round.downloadedCount
                    }
                  </td>

                  <td className="px-4 py-3 text-emerald-700">
                    {
                      round.insertedCount
                    }
                  </td>

                  <td className="px-4 py-3">
                    {
                      round.duplicateCount
                    }
                  </td>

                  <td className="max-w-48 truncate px-4 py-3 font-mono text-xs">
                    {
                      round.taskId
                    }
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {
              capture
                .understanding
                .title
            }
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {
              capture
                .understanding
                .description
            }
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label={
              capture
                .understanding
                .pendingAtStart
            }
            value={
              result
                .understanding
                .pendingAtStart
            }
          />

          <Metric
            label={
              capture
                .understanding
                .processed
            }
            value={
              result
                .understanding
                .processedCount
            }
          />

          <Metric
            label={
              capture
                .understanding
                .analyzed
            }
            value={
              result
                .understanding
                .analyzedCount
            }
          />

          <Metric
            label={
              capture
                .understanding
                .findings
            }
            value={
              result
                .understanding
                .findingsCreated
            }
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label={
              capture
                .understanding
                .failed
            }
            value={
              result
                .understanding
                .failedCount
            }
          />

          <Metric
            label={
              capture
                .understanding
                .batches
            }
            value={
              result
                .understanding
                .batchesProcessed
            }
          />

          <Metric
            label={
              capture
                .understanding
                .pendingAtEnd
            }
            value={
              result
                .understanding
                .pendingAtEnd
            }
          />
        </div>

        <div
          className={[
            "mt-6 rounded-xl border p-4 text-sm",

            result
                .understanding
                .failedCount ===
                0 &&
              result
                .understanding
                .pendingAtEnd ===
                0

              ? "border-emerald-200 bg-emerald-50 text-emerald-900"

              : "border-amber-200 bg-amber-50 text-amber-900",
          ].join(" ")}
        >
          {result
              .understanding
              .failedCount ===
              0 &&
          result
              .understanding
              .pendingAtEnd ===
              0 ? (
            <p>
              ✓{" "}
              {
                capture
                  .understanding
                  .allAnalyzed
              }
            </p>
          ) : (
            <div className="space-y-1">
              {result
                  .understanding
                  .failedCount >
                0 && (
                <p>
                  {
                    capture
                      .understanding
                      .failuresPrefix
                  }{" "}
                  <strong>
                    {
                      result
                        .understanding
                        .failedCount
                    }
                  </strong>{" "}
                  {
                    capture
                      .understanding
                      .failuresSuffix
                  }
                </p>
              )}

              {result
                  .understanding
                  .pendingAtEnd >
                0 && (
                <p>
                  {
                    capture
                      .understanding
                      .pendingPrefix
                  }{" "}
                  <strong>
                    {
                      result
                        .understanding
                        .pendingAtEnd
                    }
                  </strong>{" "}
                  {
                    capture
                      .understanding
                      .pendingSuffix
                  }
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/////////////////////////////////////////////////

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

/////////////////////////////////////////////////

function getStopReasonLabel(
  reason:
    CaptureResult["stopReason"],

  labels: {
    sourceExhausted: string;
    noNewReviews: string;
    maxDepthReached: string;
  }
) {
  switch (reason) {
    case "SOURCE_EXHAUSTED":
      return labels
        .sourceExhausted;

    case "NO_NEW_REVIEWS":
      return labels
        .noNewReviews;

    case "MAX_DEPTH_REACHED":
      return labels
        .maxDepthReached;
  }
}
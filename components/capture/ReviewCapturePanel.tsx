"use client";

import {
  useState,
} from "react";

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
            "No se pudo ejecutar el pipeline."
        );
      }

      setResult(
        payload as CaptureResult
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Error inesperado ejecutando el pipeline."
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
            Captura de reseñas
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Descargue, normalice, importe y analice
            automáticamente las reseñas asociadas
            a la entidad del usuario autenticado.
          </p>
        </div>

        <button
          type="button"
          disabled={running}
          onClick={runPipeline}
          className="mt-7 inline-flex min-w-52 items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {running
            ? "Ejecutando pipeline..."
            : "Descargar e importar"}
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
            Review Capture Pipeline en ejecución
          </p>

          <p className="mt-2 text-sm text-blue-700">
            Este proceso puede tardar varios minutos
            porque DataForSEO crea y procesa una tarea
            por cada incremento de profundidad.
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
  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="rounded-xl bg-emerald-50 p-5">
        <h2 className="text-lg font-semibold text-emerald-900">
          ✓ Proceso finalizado
        </h2>

        <p className="mt-2 text-sm text-emerald-800">
          Se insertaron{" "}
          <strong>
            {result.totalInserted}
          </strong>{" "}
          reseñas nuevas para{" "}
          <strong>
            {result.entityName}
          </strong>
          .
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Depth inicial"
          value={result.initialDepth}
        />

        <Metric
          label="Depth final"
          value={result.finalDepth}
        />

        <Metric
          label="Rondas"
          value={result.rounds.length}
        />

        <Metric
          label="Total insertadas"
          value={result.totalInserted}
        />
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Motivo de finalización
        </p>

        <p className="mt-2 text-sm font-medium text-slate-800">
          {getStopReasonLabel(
            result.stopReason
          )}
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">
                Depth
              </th>

              <th className="px-4 py-3">
                Descargadas
              </th>

              <th className="px-4 py-3">
                Insertadas
              </th>

              <th className="px-4 py-3">
                Duplicadas
              </th>

              <th className="px-4 py-3">
                Task
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
                    {round.taskId}
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
            Review Understanding
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Resultado del análisis automático
            de las reseñas pendientes.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Pendientes iniciales"
            value={
              result.understanding
                .pendingAtStart
            }
          />

          <Metric
            label="Procesadas"
            value={
              result.understanding
                .processedCount
            }
          />

          <Metric
            label="Analizadas"
            value={
              result.understanding
                .analyzedCount
            }
          />

          <Metric
            label="Hallazgos"
            value={
              result.understanding
                .findingsCreated
            }
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label="Fallidas"
            value={
              result.understanding
                .failedCount
            }
          />

          <Metric
            label="Lotes procesados"
            value={
              result.understanding
                .batchesProcessed
            }
          />

          <Metric
            label="Pendientes restantes"
            value={
              result.understanding
                .pendingAtEnd
            }
          />
        </div>

        <div
          className={[
            "mt-6 rounded-xl border p-4 text-sm",

            result.understanding
                .failedCount === 0 &&
              result.understanding
                .pendingAtEnd === 0

              ? "border-emerald-200 bg-emerald-50 text-emerald-900"

              : "border-amber-200 bg-amber-50 text-amber-900",
          ].join(" ")}
        >
          {result.understanding
              .failedCount === 0 &&
          result.understanding
              .pendingAtEnd === 0 ? (
            <p>
              ✓ Todas las reseñas pendientes
              fueron analizadas correctamente.
            </p>
          ) : (
            <div className="space-y-1">
              {result.understanding
                  .failedCount > 0 && (
                <p>
                  Se produjeron{" "}
                  <strong>
                    {
                      result.understanding
                        .failedCount
                    }
                  </strong>{" "}
                  fallos durante el análisis.
                </p>
              )}

              {result.understanding
                  .pendingAtEnd > 0 && (
                <p>
                  Quedaron{" "}
                  <strong>
                    {
                      result.understanding
                        .pendingAtEnd
                    }
                  </strong>{" "}
                  reseñas pendientes de análisis.
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
  reason: CaptureResult["stopReason"]
) {
  switch (reason) {
    case "SOURCE_EXHAUSTED":
      return "DataForSEO devolvió menos reseñas que la profundidad solicitada.";

    case "NO_NEW_REVIEWS":
      return "El último lote no contenía reseñas nuevas.";

    case "MAX_DEPTH_REACHED":
      return "Se alcanzó el límite máximo de profundidad configurado.";
  }
}
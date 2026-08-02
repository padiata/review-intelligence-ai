import "server-only";

import {
  processAllPendingReviews,
} from "@/lib/reviews/review-understanding.service";

import {
  captureTripadvisorBatch,
} from "./tripadvisor-capture.service";

import type {
  CaptureBatchResult,
  CaptureStopReason,
  ReviewCapturePipelineResult,
  TripadvisorEntityConfiguration,
} from "./capture.types";

type RunReviewCapturePipelineInput = {
  entity:
    TripadvisorEntityConfiguration;

  initialDepth: number;

  depthStep?: number;

  maxDepth?: number;

  languageName?: string;

  sortBy?:
    | "most_recent"
    | "detailed_reviews";

  understandingBatchSize?: number;

  maxReviewsToAnalyze?: number;
};

export async function runReviewCapturePipeline({
  entity,

  initialDepth,

  depthStep = initialDepth,

  maxDepth = 1000,

  languageName = "English",

  sortBy = "most_recent",

  understandingBatchSize = 10,

  maxReviewsToAnalyze = 1000,
}: RunReviewCapturePipelineInput): Promise<ReviewCapturePipelineResult> {
  if (
    !Number.isInteger(
      initialDepth
    ) ||
    initialDepth <= 0
  ) {
    throw new Error(
      "El depth inicial debe ser un número entero mayor que cero."
    );
  }

  if (
    !Number.isInteger(
      depthStep
    ) ||
    depthStep <= 0
  ) {
    throw new Error(
      "El incremento del depth debe ser mayor que cero."
    );
  }

  if (
    !Number.isInteger(
      maxDepth
    ) ||
    maxDepth < initialDepth
  ) {
    throw new Error(
      "El maxDepth no puede ser menor que el depth inicial."
    );
  }

  if (
    !Number.isInteger(
      entity.domainId
    ) ||
    entity.domainId <= 0
  ) {
    throw new Error(
      "La entidad no tiene un dominio válido."
    );
  }

  const rounds:
    CaptureBatchResult[] = [];

  let currentDepth =
    initialDepth;

  let totalInserted = 0;

  let stopReason:
    CaptureStopReason =
    "MAX_DEPTH_REACHED";

  /*
   * ETAPA 1
   * CAPTURA E IMPORTACIÓN
   */
  while (
    currentDepth <= maxDepth
  ) {
    console.log("");
    console.log(
      `Capture depth: ${currentDepth}`
    );

    const batch =
      await captureTripadvisorBatch({
        entity,

        depth:
          currentDepth,

        languageName,

        sortBy,
      });

    rounds.push(batch);

    totalInserted +=
      batch.insertedCount;

    console.log(
      `Downloaded: ${batch.downloadedCount}`
    );

    console.log(
      `Inserted: ${batch.insertedCount}`
    );

    console.log(
      `Duplicates: ${batch.duplicateCount}`
    );

    if (
      batch.downloadedCount <
      currentDepth
    ) {
      stopReason =
        "SOURCE_EXHAUSTED";

      break;
    }

    if (
      batch.insertedCount === 0
    ) {
      stopReason =
        "NO_NEW_REVIEWS";

      break;
    }

    const nextDepth =
      currentDepth +
      depthStep;

    if (
      nextDepth >
      maxDepth
    ) {
      stopReason =
        "MAX_DEPTH_REACHED";

      break;
    }

    currentDepth =
      nextDepth;
  }

  /*
   * ETAPA 2
   * REVIEW UNDERSTANDING
   *
   * Siempre se ejecuta, aunque
   * no existan reseñas nuevas.
   */
  console.log("");
  console.log(
    "Starting Review Understanding..."
  );

 const understandingResult =
  await processAllPendingReviews({
    entityId: entity.id,

    domainId: entity.domainId,

    batchSize:
      understandingBatchSize,

    maxReviews:
      maxReviewsToAnalyze,
  });
  console.log(
    `Pending at start: ${understandingResult.pendingAtStart}`
  );

  console.log(
    `Analyzed: ${understandingResult.analyzedCount}`
  );

  console.log(
    `Failed: ${understandingResult.failedCount}`
  );

  console.log(
    `Findings created: ${understandingResult.findingsCreated}`
  );

  console.log(
    `Pending at end: ${understandingResult.pendingAtEnd}`
  );

  const finalDepth =
    rounds.at(-1)
      ?.requestedDepth ??
    initialDepth;

  return {
    success: true,

    entityId:
      entity.id,

    entityName:
      entity.name,

    initialDepth,
    finalDepth,

    depthStep,
    maxDepth,

    totalInserted,

    stopReason,

    rounds,

    understanding: {
      pendingAtStart:
        understandingResult
          .pendingAtStart,

      processedCount:
        understandingResult
          .processedCount,

      analyzedCount:
        understandingResult
          .analyzedCount,

      failedCount:
        understandingResult
          .failedCount,

      findingsCreated:
        understandingResult
          .findingsCreated,

      batchesProcessed:
        understandingResult
          .batchesProcessed,

      pendingAtEnd:
        understandingResult
          .pendingAtEnd,
    },
  };
}
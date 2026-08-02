import "server-only";

import fs from "fs";
import path from "path";

import {
  downloadTripadvisorReviews,
  mapTripadvisorTaskToReviews,
} from "@/lib/dataforseo";

import {
  insertImportedReviewsWithSummary,
} from "@/lib/reviews/review.repository";

import type {
  CaptureBatchResult,
  TripadvisorEntityConfiguration,
} from "./capture.types";

type CaptureTripadvisorBatchInput = {
  entity: TripadvisorEntityConfiguration;

  depth: number;

  languageName?: string;

  sortBy?:
    | "most_recent"
    | "detailed_reviews";
};

function createSafeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDownloadedItems(
  downloadResult: unknown
): unknown[] {
  const typedResult = downloadResult as {
    taskGet?: {
      tasks?: Array<{
        result?: Array<{
          items?: unknown[];
        }>;
      }>;
    };
  };

  return (
    typedResult.taskGet
      ?.tasks?.[0]
      ?.result?.[0]
      ?.items ?? []
  );
}

export async function captureTripadvisorBatch({
  entity,
  depth,
  languageName = "English",
  sortBy = "most_recent",
}: CaptureTripadvisorBatchInput): Promise<CaptureBatchResult> {
  if (!Number.isInteger(depth) || depth <= 0) {
    throw new Error(
      "El depth debe ser un número entero mayor que cero."
    );
  }

  if (!entity.tripadvisorUrlPath.trim()) {
    throw new Error(
      `La entidad ${entity.name} no tiene configurada la URL de Tripadvisor.`
    );
  }

  const downloadResult =
    await downloadTripadvisorReviews({
      urlPath:
        entity.tripadvisorUrlPath.trim(),

      languageName,
      depth,
      sortBy,
    });

  const downloadedItems =
    getDownloadedItems(downloadResult);

  const downloadedCount =
    downloadedItems.length;

  const outputDirectory = path.join(
    process.cwd(),
    "data",
    "tripadvisor"
  );

  fs.mkdirSync(outputDirectory, {
    recursive: true,
  });

  const entitySlug =
    createSafeSlug(entity.name) ||
    `entity-${entity.id}`;

  const outputPath = path.join(
    outputDirectory,
    `${entitySlug}-depth-${depth}-${downloadResult.taskId}.json`
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      downloadResult,
      null,
      2
    ),
    "utf8"
  );

  const normalizedReviews =
    mapTripadvisorTaskToReviews(
      downloadResult.taskGet
    );

  const importSummary =
    await insertImportedReviewsWithSummary(
      normalizedReviews
    );

  if (
    importSummary.normalizedCount !==
    downloadedCount
  ) {
    throw new Error(
      [
        "La cantidad de reseñas normalizadas no coincide",
        "con la cantidad descargada.",
        `Descargadas: ${downloadedCount}.`,
        `Normalizadas: ${importSummary.normalizedCount}.`,
      ].join(" ")
    );
  }

  const expectedCount =
    importSummary.insertedCount +
    importSummary.duplicateCount;

  if (
    expectedCount !==
    importSummary.normalizedCount
  ) {
    throw new Error(
      [
        "La validación de la importación no coincide.",
        `Normalizadas: ${importSummary.normalizedCount}.`,
        `Insertadas: ${importSummary.insertedCount}.`,
        `Duplicadas: ${importSummary.duplicateCount}.`,
      ].join(" ")
    );
  }

  return {
    taskId: downloadResult.taskId,

    entityId: entity.id,
    entityName: entity.name,

    requestedDepth: depth,
    downloadedCount,
    normalizedCount:
      importSummary.normalizedCount,
    insertedCount:
      importSummary.insertedCount,
    duplicateCount:
      importSummary.duplicateCount,

    jsonPath: outputPath,
  };
}
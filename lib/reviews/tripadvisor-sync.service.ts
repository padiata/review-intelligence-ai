import fs from "fs";
import path from "path";

import {
  downloadTripadvisorReviews,
  mapTripadvisorTaskToReviews,
} from "../dataforseo";

import { insertImportedReviews } from "./review.repository";
import {
  getEntityConfigById,
  updateEntitySyncResult,
} from "../entities/entity.repository";

export async function syncTripadvisorEntity(entityId: number) {
  const entity = await getEntityConfigById(entityId);

  if (!entity?.tripadvisor_url_path) {
    throw new Error(`Entity ${entityId} does not have tripadvisor_url_path configured.`);
  }

  const depth = entity.recommended_depth ?? 10;

  await updateEntitySyncResult(entityId, {
    sync_status: "running",
    dataforseo_last_sync_at: new Date().toISOString(),
  });

  const result = await downloadTripadvisorReviews({
    urlPath: entity.tripadvisor_url_path,
    languageName: "English",
    depth,
    sortBy: "most_recent",
  });

  const outputDir = path.join(process.cwd(), "data", "tripadvisor");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const safeName = String(entity.entity_name ?? `entity-${entityId}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const outputPath = path.join(
    outputDir,
    `${safeName}-${result.taskId}.json`
  );

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf8");

  const reviews = mapTripadvisorTaskToReviews(result.taskGet);

  const inserted = await insertImportedReviews(reviews);

  await updateEntitySyncResult(entityId, {
    dataforseo_last_task_id: result.taskId,
    dataforseo_last_success_at: new Date().toISOString(),
    sync_status: "success",
  });

  return {
    entityId,
    entityName: entity.entity_name,
    taskId: result.taskId,
    outputPath,
    depth,
    reviewsDownloaded: reviews.length,
    reviewsInserted: inserted?.length ?? 0,
  };
}
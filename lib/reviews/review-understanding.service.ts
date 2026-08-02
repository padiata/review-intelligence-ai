/**
 * Compatibility export.
 * Keeps old imports working while the implementation lives in /services.
 */
console.log("paso 1");
export {
  processAllPendingReviews,
  processPendingReviews,
} from "./services/review-understanding.service";

console.log("Paso 2");
export type {
  ProcessAllPendingReviewsInput,
  ReviewProcessingItem,
  ReviewUnderstandingResult,
} from "./types/review-understanding.types";
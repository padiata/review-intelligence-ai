export type TripadvisorEntityConfiguration = {
  id: number;

  name: string;

  domainId: number;

  tripadvisorUrlPath: string;
};

export type CaptureBatchResult = {
  taskId: string;

  entityId: number;
  entityName: string;

  requestedDepth: number;

  downloadedCount: number;
  normalizedCount: number;

  insertedCount: number;
  duplicateCount: number;

  jsonPath: string;
};

export type CaptureStopReason =
  | "SOURCE_EXHAUSTED"
  | "NO_NEW_REVIEWS"
  | "MAX_DEPTH_REACHED";

export type UnderstandingPipelineResult = {
  pendingAtStart: number;

  processedCount: number;
  analyzedCount: number;
  failedCount: number;

  findingsCreated: number;

  batchesProcessed: number;
  pendingAtEnd: number;
};

export type ReviewCapturePipelineResult = {
  success: true;

  entityId: number;
  entityName: string;

  initialDepth: number;
  finalDepth: number;

  depthStep: number;
  maxDepth: number;

  totalInserted: number;

  stopReason:
    CaptureStopReason;

  rounds:
    CaptureBatchResult[];

  understanding:
    UnderstandingPipelineResult;
};
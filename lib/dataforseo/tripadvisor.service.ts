import dataForSeoClient from "./client";

const TRIPADVISOR_REVIEWS_TASK_POST =
  "/business_data/tripadvisor/reviews/task_post";

const TRIPADVISOR_REVIEWS_TASK_GET =
  "/business_data/tripadvisor/reviews/task_get";

export type TripadvisorTaskPostInput = {
  urlPath: string;
  languageName?: string;
  depth?: number;
  sortBy?: "most_recent" | "detailed_reviews";
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createTripadvisorReviewsTask(
  input: TripadvisorTaskPostInput
) {
  const payload = [
    {
      url_path: input.urlPath,
      language_name: input.languageName ?? "English",
      ...(input.depth ? { depth: input.depth } : {}),
      ...(input.sortBy ? { sort_by: input.sortBy } : {}),
    },
  ];

  const response = await dataForSeoClient.post(
    TRIPADVISOR_REVIEWS_TASK_POST,
    payload
  );

  return response.data;
}

export async function getTripadvisorReviewsTask(taskId: string) {
  const response = await dataForSeoClient.get(
    `${TRIPADVISOR_REVIEWS_TASK_GET}/${taskId}`
  );

  return response.data;
}

export async function waitForTripadvisorReviewsTask(
  taskId: string,
  options?: {
    maxAttempts?: number;
    delayMs?: number;
  }
) {
  const maxAttempts = options?.maxAttempts ?? 30;
  const delayMs = options?.delayMs ?? 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const taskGet = await getTripadvisorReviewsTask(taskId);

    const task = taskGet?.tasks?.[0];
    const statusCode = task?.status_code;
    const statusMessage = task?.status_message;

    if (statusCode === 20000 && task?.result) {
      return taskGet;
    }

    if (statusCode === 40602) {
      console.log(
        `Task ${taskId} still in queue. Attempt ${attempt}/${maxAttempts}.`
      );

      await sleep(delayMs);
      continue;
    }

    throw new Error(
      `DataForSEO task failed. Status: ${statusCode} - ${statusMessage}`
    );
  }

  throw new Error(
    `DataForSEO task timeout. Task ${taskId} was not completed in time.`
  );
}

export async function downloadTripadvisorReviews(
  input: TripadvisorTaskPostInput
) {
  const taskPost = await createTripadvisorReviewsTask(input);

  const taskId = taskPost?.tasks?.[0]?.id;

  if (!taskId) {
    throw new Error("DataForSEO did not return a task_id.");
  }

  const taskGet = await waitForTripadvisorReviewsTask(taskId, {
    maxAttempts: 30,
    delayMs: 2000,
  });

  return {
    taskId,
    taskPost,
    taskGet,
  };
}
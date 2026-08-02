export const REVIEW_UNDERSTANDING_MODEL =
  process.env.REVIEW_UNDERSTANDING_MODEL ?? "gpt-4.1-mini";

export const REVIEW_UNDERSTANDING_PROMPT_VERSION = "3.0.0";

export const REVIEW_UNDERSTANDING_DEBUG = true;
// process.env.REVIEW_UNDERSTANDING_DEBUG === "true";


export const SENTIMENT_VALUES = [
  "positive",
  "neutral",
  "negative",
  "mixed",
] as const;

export const OPERATIONAL_PRIORITY_VALUES = [
  "low",
  "medium",
  "high",
] as const;

export const RELATIONSHIP_TYPE_VALUES = [
  "contrast",
  "concession",
  "addition",
  "exception",
  "cause",
  "effect",
  "condition",
  "comparison",
  "sequence",
  "emphasis",
  "clarification",
  "alternative",
  "unknown",
] as const;

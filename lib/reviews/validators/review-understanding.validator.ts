import {
  OPERATIONAL_PRIORITY_VALUES,
  RELATIONSHIP_TYPE_VALUES,
  SENTIMENT_VALUES,
} from "../constants/review-understanding.constants";
import type {
  FindingRelationshipType,
  OperationalPriority,
  ReviewUnderstandingAnalysis,
  ReviewUnderstandingFinding,
  ReviewUnderstandingRelationship,
  Sentiment,
} from "../types/review-understanding.types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function readNullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string or null.`);
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be boolean.`);
  }
  return value;
}

function readInteger(value: unknown, field: string, minimum = 0): number {
  if (!Number.isInteger(value) || (value as number) < minimum) {
    throw new Error(`${field} must be an integer greater than or equal to ${minimum}.`);
  }
  return value as number;
}

function readScore(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  nullable = false
): number | null {
  if (nullable && (value === null || value === undefined)) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number${nullable ? " or null" : ""}.`);
  }
  if (value < minimum || value > maximum) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

function readEnum<T extends readonly string[]>(
  value: unknown,
  field: string,
  values: T
): T[number] {
  if (typeof value !== "string" || !values.includes(value)) {
    throw new Error(`${field} must be one of: ${values.join(", ")}.`);
  }
  return value as T[number];
}

function validateFinding(value: unknown, index: number): ReviewUnderstandingFinding {
  if (!isObject(value)) {
    throw new Error(`findings[${index}] must be an object.`);
  }

  return {
    finding_order: readInteger(value.finding_order, `findings[${index}].finding_order`, 1),
    area_code: readNullableString(value.area_code, `findings[${index}].area_code`),
    cause_code: readNullableString(value.cause_code, `findings[${index}].cause_code`),
    subcause_code: readNullableString(value.subcause_code, `findings[${index}].subcause_code`),
    sentiment: readEnum(value.sentiment, `findings[${index}].sentiment`, SENTIMENT_VALUES) as Sentiment,
    sentiment_score: readScore(value.sentiment_score, `findings[${index}].sentiment_score`, -1, 1, true),
    intensity_score: readScore(value.intensity_score, `findings[${index}].intensity_score`, 0, 1) as number,
    severity_score: readScore(value.severity_score, `findings[${index}].severity_score`, 0, 1) as number,
    confidence: readScore(value.confidence, `findings[${index}].confidence`, 0, 1) as number,
    impact_score: readScore(value.impact_score, `findings[${index}].impact_score`, 0, 1) as number,
    finding_summary: readString(value.finding_summary, `findings[${index}].finding_summary`),
    evidence_text: readString(value.evidence_text, `findings[${index}].evidence_text`),
    operational_priority: readEnum(
      value.operational_priority,
      `findings[${index}].operational_priority`,
      OPERATIONAL_PRIORITY_VALUES
    ) as OperationalPriority,
    requires_response: readBoolean(value.requires_response, `findings[${index}].requires_response`),
  };
}

function validateRelationship(
  value: unknown,
  index: number,
  findingOrders: Set<number>
): ReviewUnderstandingRelationship {
  if (!isObject(value)) {
    throw new Error(`relationships[${index}] must be an object.`);
  }

  const rootOrder = readInteger(
    value.root_finding_order,
    `relationships[${index}].root_finding_order`,
    1
  );
  const connectedOrder = readInteger(
    value.connected_finding_order,
    `relationships[${index}].connected_finding_order`,
    1
  );

  if (rootOrder === connectedOrder) {
    throw new Error(`relationships[${index}] cannot connect a finding to itself.`);
  }
  if (!findingOrders.has(rootOrder) || !findingOrders.has(connectedOrder)) {
    throw new Error(`relationships[${index}] references an unknown finding_order.`);
  }

  const connectorPosition =
    value.connector_position === null || value.connector_position === undefined
      ? null
      : readInteger(value.connector_position, `relationships[${index}].connector_position`, 0);

  return {
    root_finding_order: rootOrder,
    connected_finding_order: connectedOrder,
    connector: readString(value.connector, `relationships[${index}].connector`),
    relationship_type: readEnum(
      value.relationship_type,
      `relationships[${index}].relationship_type`,
      RELATIONSHIP_TYPE_VALUES
    ) as FindingRelationshipType,
    connector_position: connectorPosition,
    notes: readNullableString(value.notes, `relationships[${index}].notes`),
  };
}

export function validateReviewUnderstandingAnalysis(value: unknown): ReviewUnderstandingAnalysis {
  if (!isObject(value)) {
    throw new Error("OpenAI returned an invalid Review Understanding object.");
  }
  if (!Array.isArray(value.findings)) {
    throw new Error("OpenAI output does not contain a findings array.");
  }
  if (!Array.isArray(value.relationships)) {
    throw new Error("OpenAI output does not contain a relationships array.");
  }

  const findings = value.findings.map(validateFinding);
  const orders = findings.map((finding) => finding.finding_order);
  const uniqueOrders = new Set(orders);

  if (orders.length !== uniqueOrders.size) {
    throw new Error("finding_order values must be unique.");
  }

  for (let index = 0; index < orders.length; index += 1) {
    if (orders[index] !== index + 1) {
      throw new Error("finding_order values must be consecutive, ordered, and start at 1.");
    }
  }

  const relationships = value.relationships.map((relationship, index) =>
    validateRelationship(relationship, index, uniqueOrders)
  );

  const relationshipKeys = new Set<string>();
  for (const relationship of relationships) {
    const key = [
      relationship.root_finding_order,
      relationship.connected_finding_order,
      relationship.relationship_type,
      relationship.connector.toLowerCase(),
    ].join(":");
    if (relationshipKeys.has(key)) {
      throw new Error(`Duplicate finding relationship detected: ${key}.`);
    }
    relationshipKeys.add(key);
  }

  return { findings, relationships };
}

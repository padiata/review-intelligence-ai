import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  ReviewUnderstandingFindingRowInput,
  ReviewUnderstandingRelationshipRowInput,
} from "../mappers/review-understanding.mapper";
import type {
  SavedReviewFinding,
  SavedReviewRelationship,
  SavedReviewUnderstanding,
} from "../types/review-understanding.types";

const FINDINGS_TABLE = "review_intelligence_findings";
const RELATIONSHIPS_TABLE = "review_finding_relationships";

function validateReviewId(reviewId: number): void {
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    throw new Error("A valid reviewId is required.");
  }
}

function validateFindingOrders(
  findings: ReviewUnderstandingFindingRowInput[]
): void {
  const orders = findings.map((finding) => finding.finding_order);
  const uniqueOrders = new Set(orders);

  if (uniqueOrders.size !== orders.length) {
    throw new Error("Findings contain duplicated finding_order values.");
  }

  for (const order of orders) {
    if (!Number.isInteger(order) || order <= 0) {
      throw new Error(
        `Invalid finding_order "${String(order)}". It must be a positive integer.`
      );
    }
  }
}

function validateRelationshipReferences(
  findings: ReviewUnderstandingFindingRowInput[],
  relationships: ReviewUnderstandingRelationshipRowInput[]
): void {
  const availableOrders = new Set(
    findings.map((finding) => finding.finding_order)
  );

  for (const relationship of relationships) {
    const rootOrder = relationship.root_finding_order;
    const connectedOrder = relationship.connected_finding_order;

    if (!availableOrders.has(rootOrder)) {
      throw new Error(
        `Relationship references unknown root_finding_order ${rootOrder}.`
      );
    }

    if (!availableOrders.has(connectedOrder)) {
      throw new Error(
        `Relationship references unknown connected_finding_order ${connectedOrder}.`
      );
    }

    if (rootOrder === connectedOrder) {
      throw new Error(
        `A finding cannot be related to itself (finding_order ${rootOrder}).`
      );
    }
  }
}

async function deleteExistingReviewUnderstanding(
  reviewId: number
): Promise<void> {
  /*
   * review_finding_relationships uses ON DELETE CASCADE from both finding
   * foreign keys. Deleting the findings therefore removes their relationships.
   */
  const { error } = await supabaseAdmin
    .from(FINDINGS_TABLE)
    .delete()
    .eq("imported_review_id", reviewId);

  if (error) {
    throw new Error(
      `Could not delete the previous Review Understanding for review ${reviewId}: ${error.message}`
    );
  }
}

async function insertFindings(
  reviewId: number,
  findings: ReviewUnderstandingFindingRowInput[]
): Promise<SavedReviewFinding[]> {
  if (findings.length === 0) {
    return [];
  }

  /*
   * Always impose reviewId here. This prevents a mapper or caller from
   * accidentally inserting a finding under a different imported review.
   */
  const rows = findings
    .slice()
    .sort((a, b) => a.finding_order - b.finding_order)
    .map((finding) => ({
      ...finding,
      imported_review_id: reviewId,
    }));

  const { data, error } = await supabaseAdmin
    .from(FINDINGS_TABLE)
    .insert(rows)
    .select("id, imported_review_id, finding_order");

  if (error) {
    throw new Error(
      `Could not insert Review Understanding findings for review ${reviewId}: ${error.message}`
    );
  }

  return (data ?? []) as SavedReviewFinding[];
}

function buildFindingIdByOrder(
  savedFindings: SavedReviewFinding[]
): Map<number, number> {
  const findingIdByOrder = new Map<number, number>();

  for (const finding of savedFindings) {
    findingIdByOrder.set(finding.finding_order, finding.id);
  }

  return findingIdByOrder;
}

async function insertRelationships(
  reviewId: number,
  relationships: ReviewUnderstandingRelationshipRowInput[],
  findingIdByOrder: Map<number, number>
): Promise<SavedReviewRelationship[]> {
  if (relationships.length === 0) {
    return [];
  }

  const rows = relationships.map((relationship) => {
    const rootFindingId = findingIdByOrder.get(
      relationship.root_finding_order
    );
    const connectedFindingId = findingIdByOrder.get(
      relationship.connected_finding_order
    );

    if (!rootFindingId || !connectedFindingId) {
      throw new Error(
        `Could not resolve finding IDs for relationship ` +
          `${relationship.root_finding_order} -> ` +
          `${relationship.connected_finding_order} in review ${reviewId}.`
      );
    }

    return {
      source_finding_id: rootFindingId,
      target_finding_id: connectedFindingId,
      connector: relationship.connector,
      relationship_type: relationship.relationship_type,
      connector_position: relationship.connector_position,
      notes: relationship.notes,
    };
  });

  const { data, error } = await supabaseAdmin
    .from(RELATIONSHIPS_TABLE)
    .insert(rows)
    .select("id, source_finding_id, target_finding_id");

  if (error) {
    throw new Error(
      `Could not insert finding relationships for review ${reviewId}: ${error.message}`
    );
  }

  return (data ?? []) as SavedReviewRelationship[];
}

/**
 * Replaces all semantic findings and relationships for one imported review.
 *
 * The operation is performed directly with the Supabase client:
 * 1. Delete previous findings (relationships are removed by ON DELETE CASCADE).
 * 2. Insert the new findings and retrieve their database IDs.
 * 3. Resolve finding_order references to those IDs.
 * 4. Insert the relationships.
 *
 * This implementation intentionally does not call a PostgreSQL RPC.
 */
export async function replaceReviewUnderstanding(
  reviewId: number,
  findings: ReviewUnderstandingFindingRowInput[],
  relationships: ReviewUnderstandingRelationshipRowInput[]
): Promise<SavedReviewUnderstanding> {
  validateReviewId(reviewId);
  validateFindingOrders(findings);
  validateRelationshipReferences(findings, relationships);

  await deleteExistingReviewUnderstanding(reviewId);

  let savedFindings: SavedReviewFinding[] = [];

  try {
    savedFindings = await insertFindings(reviewId, findings);

    const findingIdByOrder = buildFindingIdByOrder(savedFindings);

    if (findingIdByOrder.size !== findings.length) {
      throw new Error(
        `Expected ${findings.length} saved findings for review ${reviewId}, ` +
          `but Supabase returned ${findingIdByOrder.size}.`
      );
    }

    const savedRelationships = await insertRelationships(
      reviewId,
      relationships,
      findingIdByOrder
    );

    return {
      findings: savedFindings,
      relationships: savedRelationships,
    };
  } catch (error) {
    /*
     * The Supabase JavaScript client does not provide a multi-request database
     * transaction. If insertion fails after findings were created, remove those
     * new findings so the review is not left with a partial analysis.
     */
    if (savedFindings.length > 0) {
      const { error: cleanupError } = await supabaseAdmin
        .from(FINDINGS_TABLE)
        .delete()
        .eq("imported_review_id", reviewId);

      if (cleanupError) {
        console.error(
          `[ReviewUnderstanding] Cleanup failed for review ${reviewId}:`,
          cleanupError
        );
      }
    }

    throw error;
  }
}

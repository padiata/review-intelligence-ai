import type {
  OperationalPriority,
  PositiveHighlight,
  ReportDataset,
  ReportFinding,
} from "./report.types";

export type PreparedReportData = {
  entity: ReportDataset["entity"];
  period: ReportDataset["period"];

  synchronizedUntil: string | null;

  reviewCount: number;
  findingCount: number;

  highPriorityFindings: ReportFinding[];
  mediumPriorityFindings: ReportFinding[];
  lowPriorityFindings: ReportFinding[];

  negativeFindings: ReportFinding[];
  positiveFindings: ReportFinding[];

  groupedOperationalPriorities: OperationalPriority[];
  positiveHighlights: PositiveHighlight[];

  recommendationsContext: {
    areaCode: string | null;
    causeCode: string | null;
    priority: string;
    summaries: string[];
    evidence: string[];
  }[];

  findings: ReportFinding[];
};

const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function normalizePriority(
  value: string | null
) {
  return value?.trim().toLowerCase() || "low";
}

function normalizeSentiment(
  value: string | null
) {
  return value?.trim().toLowerCase() || "";
}

function compareFindings(
  left: ReportFinding,
  right: ReportFinding
) {
  const leftPriority =
    priorityOrder[
      normalizePriority(left.priority)
    ] ?? 99;

  const rightPriority =
    priorityOrder[
      normalizePriority(right.priority)
    ] ?? 99;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftDate =
    left.reviewDate
      ? new Date(left.reviewDate).getTime()
      : 0;

  const rightDate =
    right.reviewDate
      ? new Date(right.reviewDate).getTime()
      : 0;

  return rightDate - leftDate;
}

function uniqueStrings(
  values: Array<string | null | undefined>,
  limit?: number
) {
  const unique = Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter(
          (value): value is string =>
            Boolean(value)
        )
    )
  );

  return typeof limit === "number"
    ? unique.slice(0, limit)
    : unique;
}

function groupKey(
  finding: ReportFinding
) {
  return [
    finding.areaCode ?? "UNCLASSIFIED_AREA",
    finding.causeCode ?? "UNCLASSIFIED_CAUSE",
    normalizePriority(finding.priority),
  ].join("::");
}

function groupFindings(
  findings: ReportFinding[]
) {
  const groups = new Map<
    string,
    ReportFinding[]
  >();

  for (const finding of findings) {
    const key = groupKey(finding);

    const current =
      groups.get(key) ?? [];

    current.push(finding);
    groups.set(key, current);
  }

  return Array.from(groups.values());
}

function buildPriorityTitle(
  findings: ReportFinding[]
) {
  const first = findings[0];

  if (!first) {
    return "Hallazgo operativo";
  }

  if (
    first.causeCode &&
    first.areaCode
  ) {
    return `${first.areaCode} · ${first.causeCode}`;
  }

  return (
    first.causeCode ??
    first.areaCode ??
    "Hallazgo operativo"
  );
}

function buildGroupedOperationalPriorities(
  findings: ReportFinding[]
): OperationalPriority[] {
  const grouped = groupFindings(findings);

  return grouped
    .map((group) => {
      const first = group[0];

      const evidence = uniqueStrings(
        group.map(
          (finding) =>
            finding.evidenceText
        ),
        5
      );

      const summaries = uniqueStrings(
        group.map(
          (finding) =>
            finding.findingSummary
        ),
        5
      );

      return {
        title:
          buildPriorityTitle(group),

        areaCode:
          first?.areaCode ?? null,

        causeCode:
          first?.causeCode ?? null,

        priority:
          normalizePriority(
            first?.priority ?? null
          ),

        summary:
          summaries.join(" "),

        impact: "",

        evidence,

        recommendedAction: "",
      };
    })
    .sort((left, right) => {
      const leftOrder =
        priorityOrder[
          normalizePriority(left.priority)
        ] ?? 99;

      const rightOrder =
        priorityOrder[
          normalizePriority(right.priority)
        ] ?? 99;

      return leftOrder - rightOrder;
    });
}

function buildPositiveHighlights(
  findings: ReportFinding[]
): PositiveHighlight[] {
  const grouped = groupFindings(findings);

  return grouped.map((group) => {
    const first = group[0];

    const summaries = uniqueStrings(
      group.map(
        (finding) =>
          finding.findingSummary
      ),
      4
    );

    const evidence = uniqueStrings(
      group.map(
        (finding) =>
          finding.evidenceText
      ),
      4
    );

    return {
      title:
        buildPriorityTitle(group),

      summary:
        summaries.join(" "),

      evidence,
    };
  });
}

function buildRecommendationsContext(
  priorities: OperationalPriority[]
) {
  return priorities.map(
    (priority) => ({
      areaCode:
        priority.areaCode,

      causeCode:
        priority.causeCode,

      priority:
        priority.priority,

      summaries:
        priority.summary
          ? [priority.summary]
          : [],

      evidence:
        priority.evidence,
    })
  );
}

export function buildPreparedReportData(
  dataset: ReportDataset
): PreparedReportData {
  const sortedFindings = [
    ...dataset.findings,
  ].sort(compareFindings);

  const negativeFindings =
    sortedFindings.filter(
      (finding) =>
        normalizeSentiment(
          finding.sentiment
        ) === "negative" ||
        normalizeSentiment(
          finding.sentiment
        ) === "negativo"
    );

  const positiveFindings =
    sortedFindings.filter(
      (finding) =>
        normalizeSentiment(
          finding.sentiment
        ) === "positive" ||
        normalizeSentiment(
          finding.sentiment
        ) === "positivo"
    );

  const highPriorityFindings =
    sortedFindings.filter((finding) =>
      ["critical", "high"].includes(
        normalizePriority(
          finding.priority
        )
      )
    );

  const mediumPriorityFindings =
    sortedFindings.filter(
      (finding) =>
        normalizePriority(
          finding.priority
        ) === "medium"
    );

  const lowPriorityFindings =
    sortedFindings.filter(
      (finding) =>
        normalizePriority(
          finding.priority
        ) === "low"
    );

  const groupedOperationalPriorities =
    buildGroupedOperationalPriorities(
      negativeFindings
    );

  const positiveHighlights =
    buildPositiveHighlights(
      positiveFindings
    );

  const recommendationsContext =
    buildRecommendationsContext(
      groupedOperationalPriorities
    );

  return {
    entity:
      dataset.entity,

    period:
      dataset.period,

    synchronizedUntil:
      dataset.synchronizedUntil,

    reviewCount:
      dataset.reviewCount,

    findingCount:
      dataset.findingCount,

    highPriorityFindings,
    mediumPriorityFindings,
    lowPriorityFindings,

    negativeFindings,
    positiveFindings,

    groupedOperationalPriorities,
    positiveHighlights,

    recommendationsContext,

    findings:
      sortedFindings,
  };
}
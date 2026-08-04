export type ReportPeriod = {
  startDate: string;
  endDate: string;
};

export type ReportFinding = {
  id: number;
  reviewId: number;

  reviewDate: string | null;
  reviewerName: string | null;
  rating: number | null;

  areaCode: string | null;
  causeCode: string | null;
  subcauseCode: string | null;

  sentiment: string | null;
  priority: string | null;

  findingSummary: string;
  evidenceText: string | null;
};

export type ReportDataset = {
  entity: {
    id: number;
    name: string;
    reportLanguageCode: string;
  };

  period: ReportPeriod;

  synchronizedUntil: string | null;

  reviewCount: number;
  findingCount: number;

  findings: ReportFinding[];
};

export type OperationalPriority = {
  title: string;

  areaCode: string | null;
  causeCode: string | null;

  priority: string;

  summary: string;
  impact: string;

  evidence: string[];

  recommendedAction: string;
};

export type PositiveHighlight = {
  title: string;
  summary: string;
  evidence: string[];
};

export type ExecutiveReport = {
  entityId: number;
  entityName: string;

  period: ReportPeriod;

  generatedAt: string;
  synchronizedUntil: string | null;

  reviewCount: number;
  findingCount: number;

  executiveSummary: string;

  operationalPriorities:
    OperationalPriority[];

  positiveHighlights:
    PositiveHighlight[];

  recommendations: string[];

  findings: ReportFinding[];
};

export type GenerateReportRequest = {
  entityId: number;
  startDate: string;
  endDate: string;
};

export type GenerateReportResponse = {
  report?: ExecutiveReport;
  error?: string;
};

export type GenerateReportResponse = {
  report?: ExecutiveReport;
  reportHistoryId?: number;
  error?: string;
};
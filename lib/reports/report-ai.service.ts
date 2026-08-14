import "server-only";

import type {
  ExecutiveReport,
} from "./report.types";

import type {
  PreparedReportData,
} from "./report-builder.service";

import {
  getAIProvider,
} from "@/lib/ai";

export async function generateExecutiveReport(
  prepared: PreparedReportData
): Promise<ExecutiveReport> {
  if (
    prepared.findingCount === 0
  ) {
    throw new Error(
      "No existen findings para generar el informe."
    );
  }

  const ai =
    getAIProvider();

  return await ai.generateExecutiveReport(
    prepared
  );
}
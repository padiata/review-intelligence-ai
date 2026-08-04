import "server-only";

import {
  buildPreparedReportData,
} from "./report-builder.service";

import {
  generateExecutiveReport,
} from "./report-ai.service";

import {
  getReportDataset,
} from "./report.repository";

import type {
  ExecutiveReport,
  GenerateReportRequest,
} from "./report.types";

function validateGenerateReportRequest(
  input: GenerateReportRequest
) {
  if (
    !Number.isInteger(input.entityId) ||
    input.entityId <= 0
  ) {
    throw new Error(
      "Se requiere un entityId válido."
    );
  }

  if (!input.startDate) {
    throw new Error(
      "Debe indicar la fecha inicial."
    );
  }

  if (!input.endDate) {
    throw new Error(
      "Debe indicar la fecha final."
    );
  }

  const startDate =
    new Date(input.startDate);

  const endDate =
    new Date(input.endDate);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error(
      "El período contiene fechas no válidas."
    );
  }

  if (startDate > endDate) {
    throw new Error(
      "La fecha inicial no puede ser posterior a la fecha final."
    );
  }

  const maximumPeriodEnd =
    new Date(startDate);

  maximumPeriodEnd.setUTCFullYear(
    maximumPeriodEnd.getUTCFullYear() + 1
  );

  if (endDate > maximumPeriodEnd) {
    throw new Error(
      "El período del informe no puede superar un año."
    );
  }
}

export async function generateReportOnDemand(
  input: GenerateReportRequest
): Promise<ExecutiveReport> {
  validateGenerateReportRequest(input);

  const dataset =
    await getReportDataset({
      entityId:
        input.entityId,

      startDate:
        input.startDate,

      endDate:
        input.endDate,
    });

  if (dataset.reviewCount === 0) {
    throw new Error(
      "No existen reviews para el período seleccionado."
    );
  }

  if (dataset.findingCount === 0) {
    throw new Error(
      "Las reviews del período todavía no tienen findings disponibles."
    );
  }

  const preparedData =
    buildPreparedReportData(
      dataset
    );

  const report =
    await generateExecutiveReport(
      preparedData
    );

  return report;
}
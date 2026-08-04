import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

import {
  generateReportOnDemand,
} from "@/lib/reports/report.service";

import type {
  GenerateReportRequest,
  GenerateReportResponse,
} from "@/lib/reports/report.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedRoles = new Set([
  "super_admin",
  "hotel_admin",
  "manager",
]);

export async function POST(
  request: Request
) {
  const startedAt = Date.now();

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Sesión no válida.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("user_profiles")
      .select(
        `
          role,
          active,
          entity_id
        `
      )
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      !profile.active
    ) {
      return NextResponse.json(
        {
          error: "Usuario no autorizado.",
        },
        {
          status: 403,
        }
      );
    }

    if (!allowedRoles.has(profile.role)) {
      return NextResponse.json(
        {
          error:
            "Su rol no permite generar informes.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as Partial<GenerateReportRequest>;

    let entityId = Number(body.entityId);

    if (profile.role !== "super_admin") {
      if (!profile.entity_id) {
        return NextResponse.json(
          {
            error:
              "El usuario no tiene un hotel asignado.",
          },
          {
            status: 403,
          }
        );
      }

      entityId = profile.entity_id;
    }

    const startDate =
      body.startDate?.trim();

    const endDate =
      body.endDate?.trim();

    if (
      !Number.isInteger(entityId) ||
      entityId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Debe indicar una entidad válida.",
        },
        {
          status: 400,
        }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Debe indicar la fecha inicial y la fecha final.",
        },
        {
          status: 400,
        }
      );
    }

    const report =
      await generateReportOnDemand({
        entityId,
        startDate,
        endDate,
      });

    const generationMs =
      Date.now() - startedAt;

    const reportName =
      `Informe ejecutivo ${startDate} a ${endDate}`;

    const {
      data: historyRow,
      error: historyError,
    } = await supabaseAdmin
      .from("report_history")
      .insert({
        entity_id: entityId,
        created_by: user.id,

        report_type: "EXECUTIVE",

        report_name: reportName,

        period_start: startDate,
        period_end: endDate,

        review_count:
          report.reviewCount,

        finding_count:
          report.findingCount,

        model_name: "gpt-4",

        prompt_version: "v1",

        pipeline_version: "v1",

        status: "COMPLETED",

        generation_ms:
          generationMs,

        report_json:
          report,
      })
      .select("id")
      .single();

    if (historyError) {
      console.error(
        "El informe se generó, pero no se pudo guardar en el histórico:",
        historyError
      );

      return NextResponse.json(
        {
          error:
            `El informe se generó, pero no pudo guardarse en el histórico: ${historyError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      report,
      reportHistoryId:
        historyRow.id,
    });
  } catch (error) {
    console.error(
      "Error generando informe:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "No se pudo generar el informe.";

    const status =
      message.includes(
        "No existen reviews"
      ) ||
      message.includes(
        "todavía no tienen findings"
      )
        ? 404
        : 500;

    return NextResponse.json<GenerateReportResponse>(
      {
        error: message,
      },
      {
        status,
      }
    );
  }
}
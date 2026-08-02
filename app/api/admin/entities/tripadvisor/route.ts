import { NextResponse } from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Ajusta solamente estas constantes
 * si tu tabla o columnas tienen otros nombres.
 */
const ENTITY_TABLE =
  "entity_config";

const ENTITY_ID_COLUMN =
  "id";

const ENTITY_NAME_COLUMN =
  "entity_name";

const TRIPADVISOR_URL_COLUMN =
  "tripadvisor_url_path";

const ENTITY_ACTIVE_COLUMN =
  "active";

export async function GET() {
  try {
    const { data, error } =
      await supabaseAdmin
        .from(ENTITY_TABLE)
        .select(
          [
            ENTITY_ID_COLUMN,
            ENTITY_NAME_COLUMN,
            TRIPADVISOR_URL_COLUMN,
            ENTITY_ACTIVE_COLUMN,
          ].join(",")
        )
        .eq(ENTITY_ACTIVE_COLUMN, true)
        .not(
          TRIPADVISOR_URL_COLUMN,
          "is",
          null
        )
        .order(ENTITY_NAME_COLUMN, {
          ascending: true,
        });

    if (error) {
      throw new Error(error.message);
    }

    const rows =
      (data ?? []) as unknown as Array<
        Record<string, unknown>
      >;

    const entities = rows.map((row) => ({
      id: Number(
        row[ENTITY_ID_COLUMN]
      ),

      name: String(
        row[ENTITY_NAME_COLUMN] ?? ""
      ),

      tripadvisorUrlPath: String(
        row[TRIPADVISOR_URL_COLUMN] ?? ""
      ),
    }));

    return NextResponse.json({
      entities,
    });
  } catch (error) {
    console.error(
      "LIST TRIPADVISOR ENTITIES ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las entidades.",
      },
      {
        status: 500,
      }
    );
  }
}
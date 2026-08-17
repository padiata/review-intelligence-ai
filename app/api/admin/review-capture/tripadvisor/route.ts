import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  runReviewCapturePipeline,
} from "@/lib/capture/review-capture-pipeline.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENTITY_TABLE = "entity_config";

const ENTITY_ID_COLUMN = "id";
const ENTITY_NAME_COLUMN = "entity_name";
const ENTITY_DOMAIN_COLUMN = "domain_id";
const TRIPADVISOR_URL_COLUMN =
  "tripadvisor_url_path";
const ENTITY_ACTIVE_COLUMN = "active";

const CAPTURE_INITIAL_DEPTH_COLUMN =
  "capture_initial_depth";

const CAPTURE_DEPTH_STEP_COLUMN =
  "capture_depth_step";

const CAPTURE_MAX_DEPTH_COLUMN =
  "capture_max_depth";

const UNDERSTANDING_BATCH_SIZE_COLUMN =
  "understanding_batch_size";

const UNDERSTANDING_MAX_REVIEWS_COLUMN =
  "understanding_max_reviews_per_run";

type EntityConfigRow = {
  id: number;
  entity_name: string | null;
  domain_id: number | null;
  tripadvisor_url_path: string | null;
  active: boolean;

  capture_initial_depth: number | null;
  capture_depth_step: number | null;
  capture_max_depth: number | null;

  understanding_batch_size: number | null;
  understanding_max_reviews_per_run:
    | number
    | null;
};

type UserProfileRow = {
  entity_id: number | null;
  active: boolean;
};

export async function POST() {
  try {
    /*
     * 1. Obtener la sesión autenticada.
     */
    const supabase =
      await createClient();

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error:
            "No existe una sesión autenticada válida.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 2. Obtener la entidad asignada
     *    al usuario autenticado.
     */
    const {
      data: profileData,
      error: profileError,
    } =
      await supabaseAdmin
        .from("user_profiles")
        .select(
          "entity_id, active"
        )
        .eq(
          "id",
          authData.user.id
        )
        .single();

    if (
      profileError ||
      !profileData
    ) {
      console.error(
        "USER PROFILE LOOKUP ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "No se encontró el perfil del usuario autenticado.",
        },
        {
          status: 403,
        }
      );
    }

    const profile =
      profileData as UserProfileRow;

    if (!profile.active) {
      return NextResponse.json(
        {
          error:
            "El usuario se encuentra inactivo.",
        },
        {
          status: 403,
        }
      );
    }

    const entityId =
      Number(
        profile.entity_id
      );

    if (
      !Number.isInteger(
        entityId
      ) ||
      entityId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "El usuario no tiene una entidad válida asignada.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 3. Obtener la configuración
     *    de la entidad del usuario.
     */
    const {
      data,
      error: entityError,
    } =
      await supabaseAdmin
        .from(ENTITY_TABLE)
        .select(
          [
            ENTITY_ID_COLUMN,
            ENTITY_NAME_COLUMN,
            ENTITY_DOMAIN_COLUMN,
            TRIPADVISOR_URL_COLUMN,
            ENTITY_ACTIVE_COLUMN,

            CAPTURE_INITIAL_DEPTH_COLUMN,
            CAPTURE_DEPTH_STEP_COLUMN,
            CAPTURE_MAX_DEPTH_COLUMN,

            UNDERSTANDING_BATCH_SIZE_COLUMN,
            UNDERSTANDING_MAX_REVIEWS_COLUMN,
          ].join(",")
        )
        .eq(
          ENTITY_ID_COLUMN,
          entityId
        )
        .eq(
          ENTITY_ACTIVE_COLUMN,
          true
        )
        .single();

    if (
      entityError ||
      !data
    ) {
      console.error(
        "ENTITY LOOKUP ERROR:",
        entityError
      );

      return NextResponse.json(
        {
          error:
            "No se encontró la entidad asignada al usuario o se encuentra inactiva.",
        },
        {
          status: 404,
        }
      );
    }

    const entityRow =
      data as EntityConfigRow;

    const entity = {
      id:
        Number(
          entityRow.id
        ),

      name:
        String(
          entityRow.entity_name ??
            ""
        ).trim(),

      domainId:
        Number(
          entityRow.domain_id
        ),

      tripadvisorUrlPath:
        String(
          entityRow
            .tripadvisor_url_path ??
            ""
        ).trim(),
    };

    const initialDepth =
      Number(
        entityRow
          .capture_initial_depth
      );

    const depthStep =
      Number(
        entityRow
          .capture_depth_step
      );

    const maxDepth =
      Number(
        entityRow
          .capture_max_depth
      );

    const understandingBatchSize =
      Number(
        entityRow
          .understanding_batch_size
      );

    const maxReviewsToAnalyze =
      Number(
        entityRow
          .understanding_max_reviews_per_run
      );

    /*
     * 4. Validar configuración.
     */
    if (!entity.name) {
      return NextResponse.json(
        {
          error:
            "La entidad no tiene un nombre válido configurado.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        entity.domainId
      ) ||
      entity.domainId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La entidad no tiene un dominio válido configurado.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !entity.tripadvisorUrlPath
    ) {
      return NextResponse.json(
        {
          error:
            "La entidad no tiene configurada una URL de Tripadvisor.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        initialDepth
      ) ||
      initialDepth <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La entidad no tiene configurado un capture_initial_depth válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        depthStep
      ) ||
      depthStep <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La entidad no tiene configurado un capture_depth_step válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        maxDepth
      ) ||
      maxDepth < initialDepth
    ) {
      return NextResponse.json(
        {
          error:
            "La entidad no tiene configurado un capture_max_depth válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        understandingBatchSize
      ) ||
      understandingBatchSize <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La entidad no tiene configurado un understanding_batch_size válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        maxReviewsToAnalyze
      ) ||
      maxReviewsToAnalyze <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La entidad no tiene configurado un understanding_max_reviews_per_run válido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 5. Ejecutar pipeline.
     *
     * A partir de aquí la entidad ya
     * proviene del usuario autenticado.
     */
    const result =
      await runReviewCapturePipeline({
        entity,

        initialDepth,

        depthStep,

        maxDepth,

        languageName:
          "English",

        sortBy:
          "most_recent",

        understandingBatchSize,

        maxReviewsToAnalyze,
      });

    return NextResponse.json(
      result,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "REVIEW CAPTURE PIPELINE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo ejecutar el proceso de captura y análisis.",
      },
      {
        status: 500,
      }
    );
  }
}
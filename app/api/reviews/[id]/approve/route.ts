import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

type UserRole =
  | "super_admin"
  | "hotel_admin"
  | "manager"
  | "operator";

type UserProfile = {
  role: UserRole;
  active: boolean;
  entity_id: number | null;
};

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    const reviewId =
      Number(id);

    if (
      !Number.isInteger(
        reviewId
      ) ||
      reviewId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "El identificador de la review no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      (await request.json()) as {
        response?: string;
      };

    const cleanResponse =
      body.response?.trim() ??
      "";

    if (!cleanResponse) {
      return NextResponse.json(
        {
          error:
            "La respuesta no puede estar vacía.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "No autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: profileData,
      error: profileError,
    } =
      await supabase
        .from(
          "user_profiles"
        )
        .select(
          `
            role,
            active,
            entity_id
          `
        )
        .eq(
          "id",
          user.id
        )
        .single();

    const profile =
      profileData as
        | UserProfile
        | null;

    if (
      profileError ||
      !profile ||
      !profile.active
    ) {
      return NextResponse.json(
        {
          error:
            "Acceso denegado.",
        },
        {
          status: 403,
        }
      );
    }

    const canApprove =
      profile.role ===
        "super_admin" ||
      profile.role ===
        "hotel_admin" ||
      profile.role ===
        "manager";

    if (!canApprove) {
      return NextResponse.json(
        {
          error:
            "Su rol no tiene permisos para aprobar respuestas.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      data: review,
      error: reviewError,
    } =
      await supabase
        .from(
          "imported_reviews"
        )
        .select(
          `
            id,
            entity_id,
            review_status
          `
        )
        .eq(
          "id",
          reviewId
        )
        .single();

    if (
      reviewError ||
      !review
    ) {
      return NextResponse.json(
        {
          error:
            "No se encontró la review.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Un super_admin puede aprobar
     * reviews de cualquier entidad.
     *
     * Los demás roles autorizados
     * solo pueden aprobar reviews
     * de su propia entidad.
     */

    if (
      profile.role !==
        "super_admin" &&
      profile.entity_id !==
        review.entity_id
    ) {
      return NextResponse.json(
        {
          error:
            "No tiene permisos para aprobar esta review.",
        },
        {
          status: 403,
        }
      );
    }

    const approvedAt =
      new Date().toISOString();

    const {
      data: updatedReview,
      error: updateError,
    } =
      await supabase
        .from(
          "imported_reviews"
        )
        .update({
          owner_response_text:
            cleanResponse,

          review_status:
            "approved",

          approved_at:
            approvedAt,
        })
        .eq(
          "id",
          reviewId
        )
        .select(
          `
            id,
            review_status,
            owner_response_text,
            approved_at
          `
        )
        .single();

    if (
      updateError ||
      !updatedReview
    ) {
      throw (
        updateError ??
        new Error(
          "No se pudo aprobar la respuesta."
        )
      );
    }

    return NextResponse.json(
      {
        review:
          updatedReview,
      }
    );
  } catch (error) {
    console.error(
      "Error aprobando respuesta:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo aprobar la respuesta.",
      },
      {
        status: 500,
      }
    );
  }
}
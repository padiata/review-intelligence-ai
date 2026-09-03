import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SUPPORTED_LANGUAGES = new Set([
  "es",
  "en",
  "fr",
  "de",
  "it",
  "pt",
]);

type AuthorizationResult =
  | {
      userId: string;
    }
  | {
      error: string;
      status: 401 | 403;
    };

async function requireSuperAdmin(): Promise<AuthorizationResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "No autenticado.",
      status: 401,
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("user_profiles")
    .select("role, active")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !profile.active ||
    profile.role !== "super_admin"
  ) {
    return {
      error: "Acceso denegado.",
      status: 403,
    };
  }

  return {
    userId: user.id,
  };
}

function normalizeCodePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function validDomainId(value: unknown) {
  const domainId = Number(value);

  return Number.isInteger(domainId) && domainId > 0
    ? domainId
    : null;
}

async function buildAreaCodes(
  domainId: number,
  preferredName: string
) {
  const {
    data: domain,
    error: domainError,
  } = await supabaseAdmin
    .from("business_domains")
    .select("id, domain_code, active")
    .eq("id", domainId)
    .single();

  if (
    domainError ||
    !domain ||
    !domain.active
  ) {
    throw new Error(
      "El dominio no existe o no está activo."
    );
  }

  const {
    data: areas,
    error: areasError,
  } = await supabaseAdmin
    .from("areas_catalog")
    .select("area_code, cod_numerico")
    .eq("domain_id", domainId);

  if (areasError) {
    throw new Error(areasError.message);
  }

  const sevenDigitCodes = (areas ?? [])
    .map((area) =>
      String(
        area.cod_numerico ?? ""
      ).padStart(7, "0")
    )
    .filter((code) =>
      /^\d{7}$/.test(code)
    );

  const environmentDigits = Array.from(
    new Set(
      sevenDigitCodes.map((code) =>
        code.slice(0, 1)
      )
    )
  );

  let environmentDigit: string;

  if (environmentDigits.length === 1) {
    environmentDigit =
      environmentDigits[0];
  } else if (
    environmentDigits.length === 0 &&
    domainId >= 1 &&
    domainId <= 9
  ) {
    environmentDigit =
      String(domainId);
  } else {
    throw new Error(
      "No se pudo determinar de forma segura el dígito del entorno."
    );
  }

  const areaNumbers = sevenDigitCodes
    .filter(
      (code) =>
        code.startsWith(
          environmentDigit
        ) &&
        code.slice(3) === "0000"
    )
    .map((code) =>
      Number(code.slice(1, 3))
    )
    .filter(
      (value) =>
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 99
    );

  const nextAreaNumber =
    areaNumbers.length > 0
      ? Math.max(...areaNumbers) + 1
      : 1;

  if (nextAreaNumber > 99) {
    throw new Error(
      "El dominio alcanzó el máximo de 99 áreas."
    );
  }

  const numericCode = Number(
    `${environmentDigit}${String(
      nextAreaNumber
    ).padStart(2, "0")}0000`
  );

  const domainPrefix =
    normalizeCodePart(
      domain.domain_code
    );

  const namePart =
    normalizeCodePart(
      preferredName
    );

  if (!namePart) {
    throw new Error(
      "El nombre no permite generar un código válido."
    );
  }

  const baseCode = domainPrefix
    ? `${domainPrefix}_${namePart}`
    : namePart;

  const existingCodes = new Set(
    (areas ?? []).map(
      (area) => area.area_code
    )
  );

  let areaCode = baseCode;
  let suffix = 2;

  while (
    existingCodes.has(areaCode)
  ) {
    areaCode =
      `${baseCode}_${suffix}`;
    suffix += 1;
  }

  return {
    areaCode,
    numericCode,
  };
}

export async function GET(
  request: NextRequest
) {
  const authorization =
    await requireSuperAdmin();

  if ("error" in authorization) {
    return NextResponse.json(
      {
        error:
          authorization.error,
      },
      {
        status:
          authorization.status,
      }
    );
  }

  try {
    const domainId =
      validDomainId(
        request.nextUrl.searchParams.get(
          "domainId"
        )
      );

    const name =
      request.nextUrl.searchParams
        .get("name")
        ?.trim();

    if (!domainId || !name) {
      return NextResponse.json(
        {
          error:
            "domainId y name son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    const codes =
      await buildAreaCodes(
        domainId,
        name
      );

    return NextResponse.json(
      codes
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron generar los códigos.",
      },
      {
        status: 400,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  const authorization =
    await requireSuperAdmin();

  if ("error" in authorization) {
    return NextResponse.json(
      {
        error:
          authorization.error,
      },
      {
        status:
          authorization.status,
      }
    );
  }

  try {
    const body =
      (await request.json()) as {
        domainId?: number;
        language?: string;
        name?: string;
        description?:
          string | null;
      };

    const domainId =
      validDomainId(
        body.domainId
      );

    const language =
      body.language
        ?.trim()
        .toLowerCase();

    const name =
      body.name?.trim();

    const description =
      body.description
        ?.trim() || null;

    if (
      !domainId ||
      !language ||
      !SUPPORTED_LANGUAGES.has(
        language
      ) ||
      !name
    ) {
      return NextResponse.json(
        {
          error:
            "Dominio, idioma y nombre son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      name.length > 120 ||
      (
        description &&
        description.length > 500
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Uno de los campos excede la longitud permitida.",
        },
        {
          status: 400,
        }
      );
    }

    const codes =
      await buildAreaCodes(
        domainId,
        name
      );

    const {
      data: duplicateTranslation,
      error: duplicateTranslationError,
    } = await supabaseAdmin
      .from("taxonomy_translations")
      .select("node_code")
      .eq("domain_id", domainId)
      .eq("node_type", "area")
      .eq(
        "language_code",
        language
      )
      .ilike("name", name)
      .eq("active", true)
      .limit(1);

    if (
      duplicateTranslationError
    ) {
      throw new Error(
        duplicateTranslationError.message
      );
    }

    if (
      (duplicateTranslation ?? [])
        .length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Ya existe un área con ese nombre en el idioma seleccionado.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: numericDuplicate,
      error:
        numericDuplicateError,
    } = await supabaseAdmin
      .from("areas_catalog")
      .select("area_code")
      .eq(
        "domain_id",
        domainId
      )
      .eq(
        "cod_numerico",
        codes.numericCode
      )
      .limit(1);

    if (
      numericDuplicateError
    ) {
      throw new Error(
        numericDuplicateError.message
      );
    }

    if (
      (numericDuplicate ?? [])
        .length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "El código numérico calculado ya está en uso. Recargue la página e inténtelo nuevamente.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      Compatibility decision:
      areas_catalog currently requires a canonical display name.
      We store the text entered in the active UI language there as the
      fallback text, while taxonomy_translations remains the authoritative
      language-specific layer.
    */
    const {
      error: insertError,
    } = await supabaseAdmin
      .from("areas_catalog")
      .insert({
        area_code:
          codes.areaCode,
        area_name:
          name,
        description,
        active: true,
        cod_numerico:
          codes.numericCode,
        domain_id:
          domainId,
      });

    if (insertError) {
      throw new Error(
        insertError.message
      );
    }

    const {
      error:
        translationError,
    } = await supabaseAdmin
      .from(
        "taxonomy_translations"
      )
      .upsert(
        {
          domain_id:
            domainId,
          node_type:
            "area",
          node_code:
            codes.areaCode,
          language_code:
            language,
          name,
          description,
          active: true,
          created_by:
            authorization.userId,
          updated_by:
            authorization.userId,
        },
        {
          onConflict:
            "domain_id,node_type,node_code,language_code",
        }
      );

    if (translationError) {
      await supabaseAdmin
        .from("areas_catalog")
        .delete()
        .eq(
          "area_code",
          codes.areaCode
        )
        .eq(
          "domain_id",
          domainId
        );

      throw new Error(
        translationError.message
      );
    }

    return NextResponse.json(
      {
        area: {
          areaCode:
            codes.areaCode,
          numericCode:
            codes.numericCode,
          language,
          name,
          description,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el área.",
      },
      {
        status: 500,
      }
    );
  }
}

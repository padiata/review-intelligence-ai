import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../../lib/supabase/admin";

const SUPPORTED_LANGUAGES =
  new Set([
    "es",
    "en",
    "fr",
    "de",
    "it",
    "pt",
  ]);

type TaxonomyTranslation = {
  node_type:
    | "area"
    | "cause"
    | "subcause";
  node_code: string;
  name: string;
  description: string | null;
};

function translationKey(
  nodeType:
    | "area"
    | "cause"
    | "subcause",
  nodeCode: string
) {
  return `${nodeType}:${nodeCode}`;
}

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const rawDomainId =
      searchParams.get("domainId");

    const requestedLanguage =
      (
        searchParams.get(
          "language"
        ) ?? "es"
      )
        .trim()
        .toLowerCase();

    if (!rawDomainId) {
      return NextResponse.json(
        {
          error:
            "domainId es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    const domainId =
      Number(rawDomainId);

    if (
      !Number.isInteger(
        domainId
      ) ||
      domainId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "domainId inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !SUPPORTED_LANGUAGES.has(
        requestedLanguage
      )
    ) {
      return NextResponse.json(
        {
          error:
            "language inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: areas,
      error: areasError,
    } =
      await supabaseAdmin
        .from("areas_catalog")
        .select(`
          area_code,
          area_name,
          description,
          cod_numerico
        `)
        .eq(
          "domain_id",
          domainId
        )
        .eq("active", true)
        .order(
          "cod_numerico",
          {
            ascending: true,
          }
        );

    if (areasError) {
      throw new Error(
        areasError.message
      );
    }

    const areaCodes =
      (areas ?? []).map(
        (area) =>
          area.area_code
      );

    if (
      areaCodes.length === 0
    ) {
      return NextResponse.json({
        language:
          requestedLanguage,
        areas: [],
      });
    }

    const {
      data: causes,
      error: causesError,
    } =
      await supabaseAdmin
        .from("causes_catalog")
        .select(`
          cause_code,
          area_code,
          cause_name,
          description,
          cod_numerico
        `)
        .in(
          "area_code",
          areaCodes
        )
        .eq("active", true)
        .order(
          "cod_numerico",
          {
            ascending: true,
          }
        );

    if (causesError) {
      throw new Error(
        causesError.message
      );
    }

    const causeCodes =
      (causes ?? []).map(
        (cause) =>
          cause.cause_code
      );

    let subcauses:
      any[] = [];

    if (
      causeCodes.length > 0
    ) {
      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            "subcauses_catalog"
          )
          .select(`
            subcause_code,
            cause_code,
            subcause_name,
            description,
            cod_numerico
          `)
          .in(
            "cause_code",
            causeCodes
          )
          .eq(
            "active",
            true
          )
          .order(
            "cod_numerico",
            {
              ascending: true,
            }
          );

      if (error) {
        throw new Error(
          error.message
        );
      }

      subcauses =
        data ?? [];
    }

    const allCodes = [
      ...areaCodes,
      ...causeCodes,
      ...subcauses.map(
        (subcause) =>
          subcause.subcause_code
      ),
    ];

    const translations =
      new Map<
        string,
        TaxonomyTranslation
      >();

    if (
      requestedLanguage !==
        "es" &&
      allCodes.length > 0
    ) {
      const {
        data:
          translationRows,
        error:
          translationsError,
      } =
        await supabaseAdmin
          .from(
            "taxonomy_translations"
          )
          .select(`
            node_type,
            node_code,
            name,
            description
          `)
          .eq(
            "domain_id",
            domainId
          )
          .eq(
            "language_code",
            requestedLanguage
          )
          .eq(
            "active",
            true
          )
          .in(
            "node_code",
            allCodes
          );

      if (
        translationsError
      ) {
        throw new Error(
          translationsError.message
        );
      }

      for (
        const row of
          (translationRows ??
            []) as TaxonomyTranslation[]
      ) {
        translations.set(
          translationKey(
            row.node_type,
            row.node_code
          ),
          row
        );
      }
    }

    const getTranslation = (
      nodeType:
        | "area"
        | "cause"
        | "subcause",
      nodeCode: string
    ) =>
      translations.get(
        translationKey(
          nodeType,
          nodeCode
        )
      );

    const result =
      (areas ?? []).map(
        (area) => {
          const areaTranslation =
            getTranslation(
              "area",
              area.area_code
            );

          return {
            areaCode:
              area.area_code,

            areaName:
              areaTranslation
                ?.name ??
              area.area_name,

            areaDescription:
              areaTranslation
                ?.description ??
              area.description,

            areaNumericCode:
              area.cod_numerico,

            causes:
              (causes ?? [])
                .filter(
                  (cause) =>
                    cause.area_code ===
                    area.area_code
                )
                .map(
                  (cause) => {
                    const causeTranslation =
                      getTranslation(
                        "cause",
                        cause.cause_code
                      );

                    return {
                      causeCode:
                        cause.cause_code,

                      causeName:
                        causeTranslation
                          ?.name ??
                        cause.cause_name,

                      description:
                        causeTranslation
                          ?.description ??
                        cause.description,

                      numericCode:
                        cause.cod_numerico,

                      subcauses:
                        subcauses
                          .filter(
                            (
                              subcause
                            ) =>
                              subcause.cause_code ===
                              cause.cause_code
                          )
                          .map(
                            (
                              subcause
                            ) => {
                              const subcauseTranslation =
                                getTranslation(
                                  "subcause",
                                  subcause.subcause_code
                                );

                              return {
                                subcauseCode:
                                  subcause.subcause_code,

                                subcauseName:
                                  subcauseTranslation
                                    ?.name ??
                                  subcause.subcause_name,

                                description:
                                  subcauseTranslation
                                    ?.description ??
                                  subcause.description,

                                numericCode:
                                  subcause.cod_numerico,
                              };
                            }
                          ),
                    };
                  }
                ),
          };
        }
      );

    return NextResponse.json({
      language:
        requestedLanguage,
      areas: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar la taxonomía.",
      },
      {
        status: 500,
      }
    );
  }
}

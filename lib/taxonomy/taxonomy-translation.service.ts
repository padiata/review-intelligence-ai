import {
  getAIProvider,
} from "@/lib/ai";
import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

export type TaxonomyLocale = {
  localeCode: string;
  languageCode: string;
  localeName: string;
  nativeName: string;
  aiTranslationEnabled: boolean;
};

export type TaxonomyTranslation = {
  languageCode: string;
  name: string;
  description: string | null;
  generatedByAi: boolean;
};

export type TaxonomyTranslationFailure = {
  languageCode: string;
  error: string;
};

type GenerateTaxonomyTranslationsInput = {
  sourceLanguage: string;
  name: string;
  description?: string | null;
  nodeType: "area" | "cause" | "subcause";
  domainName?: string | null;
};

export async function getTaxonomyLocales(): Promise<
  TaxonomyLocale[]
> {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("locales_catalog")
    .select(
      [
        "locale_code",
        "language_code",
        "locale_name",
        "native_name",
        "ai_translation_enabled",
      ].join(",")
    )
    .eq(
      "active",
      true
    )
    .eq(
      "available_for_taxonomy",
      true
    )
    .order(
      "sort_order",
      {
        ascending: true,
      }
    )
    .order(
      "locale_code",
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      `No se pudieron cargar los idiomas de taxonomía: ${error.message}`
    );
  }

  return (data ?? []).map(
    (row) => ({
      localeCode:
        row.locale_code,
      languageCode:
        row.language_code,
      localeName:
        row.locale_name,
      nativeName:
        row.native_name,
      aiTranslationEnabled:
        Boolean(
          row.ai_translation_enabled
        ),
    })
  );
}

export async function isTaxonomyLanguageAvailable(
  languageCode: string
) {
  const locales =
    await getTaxonomyLocales();

  return locales.some(
    (locale) =>
      locale.localeCode ===
        languageCode
  );
}

export async function generateTaxonomyTranslations(
  input: GenerateTaxonomyTranslationsInput
) {
  const ai =
    getAIProvider();

  const locales =
    await getTaxonomyLocales();

  const targetLocales =
    locales.filter(
      (locale) =>
        locale.aiTranslationEnabled &&
        locale.localeCode !==
          input.sourceLanguage
    );

  const settled =
    await Promise.allSettled(
      targetLocales.map(
        async (
          targetLocale
        ) => {
          const result =
            await ai.translateTaxonomyNode({
              name:
                input.name,
              description:
                input.description ??
                null,
              sourceLanguage:
                input.sourceLanguage,
              targetLanguage:
                targetLocale.localeCode,
              nodeType:
                input.nodeType,
              domainName:
                input.domainName ??
                null,
            });

          return {
            languageCode:
              targetLocale.localeCode,
            name:
              result.name,
            description:
              result.description,
            generatedByAi:
              true,
          } satisfies TaxonomyTranslation;
        }
      )
    );

  const translations:
    TaxonomyTranslation[] = [];

  const failures:
    TaxonomyTranslationFailure[] =
      [];

  settled.forEach(
    (result, index) => {
      const languageCode =
        targetLocales[index]
          .localeCode;

      if (
        result.status ===
        "fulfilled"
      ) {
        translations.push(
          result.value
        );
      } else {
        failures.push({
          languageCode,
          error:
            result.reason instanceof
            Error
              ? result.reason.message
              : "Error de traducción desconocido.",
        });
      }
    }
  );

  return {
    translations,
    failures,
    totalTargets:
      targetLocales.length,
    locales,
  };
}

import type {
  TranslateTextInput,
} from "../types";

const allowedLanguages: Record<
  string,
  string
> = {
  es: "español",
  en: "inglés",
  fr: "francés",
  de: "alemán",
  it: "italiano",
  pt: "portugués",
  ru: "ruso",
  zh: "chino simplificado",
  vi: "vietnamita",
};

export function buildTranslationPrompt(
  input: TranslateTextInput
) {
  const text =
    input.text?.trim();

  const targetLanguage =
    input.language;

  if (!text) {
    throw new Error(
      "El texto que desea traducir está vacío."
    );
  }

  if (
    !targetLanguage ||
    !allowedLanguages[targetLanguage]
  ) {
    throw new Error(
      "El idioma seleccionado no es válido."
    );
  }

  const languageName =
    allowedLanguages[
      targetLanguage
    ];

  const instructions = `
Eres un traductor profesional especializado en respuestas
institucionales para huéspedes de hoteles.

Traduce el texto al ${languageName}.

Reglas:
- Conserva exactamente el significado.
- Mantén el tono profesional y cordial.
- Conserva los párrafos y los saltos de línea.
- No agregues explicaciones.
- No escribas etiquetas como "Traducción".
- Devuelve únicamente el texto traducido.
  `.trim();

  return {
    instructions,
    input: text,
    targetLanguage,
  };
}
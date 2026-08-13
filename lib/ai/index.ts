import type {
  AIProvider,
} from "./types";

import {
  OpenAIProvider,
} from "./providers/openai";

export function getAIProvider(): AIProvider {
  const provider =
    process.env.AI_PROVIDER ??
    "openai";

  switch (
    provider
      .trim()
      .toLowerCase()
  ) {
    case "openai":
      return new OpenAIProvider();

    default:
      throw new Error(
        `Proveedor de IA no soportado: ${provider}`
      );
  }
}
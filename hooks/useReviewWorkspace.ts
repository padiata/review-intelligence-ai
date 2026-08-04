"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import type {
  DisplayReview,
  ImportedReview,
  ReviewAnalysis,
  ReviewSource,
  ReviewStatus,
  Tone,
  TranslationLanguage,
} from "@/components/reviews/review-types";

import {
  emptyAnalysis,
  emptyReview,
  hasStoredAnalysis,
  mapImportedReview,
  mapStoredAnalysis,
  normalizeRating,
} from "@/components/reviews/review-utils";

export const translationLanguages = [
  { code: "es" as const, name: "Español" },
  { code: "en" as const, name: "Inglés" },
  { code: "fr" as const, name: "Francés" },
  { code: "de" as const, name: "Alemán" },
  { code: "it" as const, name: "Italiano" },
  { code: "pt" as const, name: "Portugués" },
  { code: "ru" as const, name: "Ruso" },
  { code: "zh" as const, name: "Chino simplificado" },
  { code: "vi" as const, name: "Vietnamita" },
];

type UseReviewWorkspaceOptions = {
  reviewId: number;
};

export function useReviewWorkspace({
  reviewId,
}: UseReviewWorkspaceOptions) {
  const supabase = useMemo(() => createClient(), []);

  const [sources, setSources] = useState<ReviewSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] =
    useState<number | "">("");

  const [review, setReview] =
    useState<DisplayReview>(emptyReview);

  const [importedReview, setImportedReview] =
    useState<ImportedReview | null>(null);

  const [analysis, setAnalysis] =
    useState<ReviewAnalysis>(emptyAnalysis);

  const [status, setStatus] =
    useState<ReviewStatus>("En revisión");

  const [tone, setTone] =
    useState<Tone>("Profesional");

  const [context, setContext] = useState("");
  const [response, setResponse] = useState("");
  const [originalResponse, setOriginalResponse] = useState("");

  const [translationLanguage, setTranslationLanguage] =
    useState<TranslationLanguage>("en");

  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingReview, setLoadingReview] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] =
    useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [isTranslated, setIsTranslated] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [saved, setSaved] = useState(false);

  const [sourceError, setSourceError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [translationError, setTranslationError] = useState("");

  const selectedSource = useMemo(
    () =>
      sources.find(
        (source) => source.id === selectedSourceId
      ),
    [sources, selectedSourceId]
  );

  const analyzeReview = useCallback(
    async (targetReview: ImportedReview) => {
      if (hasStoredAnalysis(targetReview)) {
        setAnalysis(mapStoredAnalysis(targetReview));
        setAnalysisError("");
        return;
      }

      const reviewText =
        targetReview.review_text ??
        targetReview.review_title ??
        "";

      if (!reviewText.trim()) {
        setAnalysis(emptyAnalysis);
        setAnalysisError(
          "La review no contiene texto para analizar."
        );
        return;
      }

      setIsAnalyzing(true);
      setAnalysisError("");
      setAnalysis(emptyAnalysis);

      try {
        const apiResponse = await fetch(
          "/api/review-analysis",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              review: {
                id: targetReview.id,
                guest:
                  targetReview.reviewer_name ??
                  "Huésped",
                score: normalizeRating(
                  targetReview.rating
                ),
                title:
                  targetReview.review_title ?? "",
                text: reviewText,
                language:
                  targetReview.language ??
                  targetReview.original_language ??
                  "",
                property:
                  targetReview.property_name ??
                  "Propiedad no especificada",
                source: targetReview.source,
              },
            }),
          }
        );

        const data = (await apiResponse.json()) as {
          analysis?: ReviewAnalysis;
          error?: string;
        };

        if (!apiResponse.ok || !data.analysis) {
          throw new Error(
            data.error ||
              "No se pudo analizar la review."
          );
        }

        setAnalysis(data.analysis);

        const analyzedAt = new Date().toISOString();

        const { error: saveError } = await supabase
          .from("imported_reviews")
          .update({
            sentiment: data.analysis.sentiment,
            priority: data.analysis.priority,
            detected_areas:
              data.analysis.detected_areas,
            positive_aspects:
              data.analysis.positive_aspects,
            negative_aspects:
              data.analysis.negative_aspects,
            predominant_emotion:
              data.analysis.predominant_emotion,
            recommendation_probability:
              data.analysis.recommendation_probability,
            analysis_summary:
              data.analysis.summary,
            analyzed_at: analyzedAt,
          })
          .eq("id", targetReview.id);

        if (saveError) {
          console.error(
            "No se pudo guardar el análisis:",
            saveError
          );
        }
      } catch (error) {
        console.error(
          "Error analizando la review:",
          error
        );

        setAnalysisError(
          error instanceof Error
            ? error.message
            : "No se pudo analizar la review."
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    async function loadWorkspace() {
      if (!Number.isInteger(reviewId) || reviewId <= 0) {
        setReviewError(
          "El identificador de la review no es válido."
        );
        setLoadingReview(false);
        setLoadingSources(false);
        return;
      }

      setLoadingSources(true);
      setLoadingReview(true);
      setSourceError("");
      setReviewError("");

      const [sourcesResult, reviewResult] =
        await Promise.all([
          supabase
            .from("review_sources")
            .select(
              "id, source_code, source_name, description, active"
            )
            .eq("active", true)
            .order("source_name", {
              ascending: true,
            }),

          supabase
            .from("imported_reviews")
            .select("*")
            .eq("id", reviewId)
            .single(),
        ]);

      if (sourcesResult.error) {
        setSourceError(
          `No se pudieron cargar las fuentes: ${sourcesResult.error.message}`
        );
        setSources([]);
      } else {
        setSources(
          (sourcesResult.data as ReviewSource[] | null) ??
            []
        );
      }

      setLoadingSources(false);

      if (reviewResult.error || !reviewResult.data) {
        setReviewError(
          reviewResult.error?.message ||
            "No se encontró la review."
        );
        setReview(emptyReview);
        setLoadingReview(false);
        return;
      }

      const loadedReview =
        reviewResult.data as ImportedReview;

      setImportedReview(loadedReview);
      setReview(mapImportedReview(loadedReview));

      const matchingSource =
        (
          sourcesResult.data as ReviewSource[] | null
        )?.find(
          (source) =>
            source.source_code.toUpperCase() ===
            loadedReview.source.toUpperCase()
        );

      if (matchingSource) {
        setSelectedSourceId(matchingSource.id);
      }

      const existingResponse =
        loadedReview.owner_response_text?.trim() ?? "";

      setResponse(existingResponse);
      setOriginalResponse(existingResponse);
      setIsTranslated(false);
      setTranslationLanguage("en");
      setSaved(false);

      if (
        loadedReview.analysis_status === "approved"
      ) {
        setStatus("Aprobada");
      } else if (
        loadedReview.analysis_status === "published"
      ) {
        setStatus("Publicada");
      } else if (
        loadedReview.analysis_status === "new"
      ) {
        setStatus("Nueva");
      } else {
        setStatus("En revisión");
      }

      if (
        loadedReview.analysis_status === "new" ||
        loadedReview.analysis_status === "pending"
      ) {
        const { error: statusError } = await supabase
          .from("imported_reviews")
          .update({
            analysis_status: "in_review",
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", loadedReview.id);

        if (!statusError) {
          setStatus("En revisión");
        }
      }

      setLoadingReview(false);
      void analyzeReview(loadedReview);
    }

    void loadWorkspace();
  }, [analyzeReview, reviewId, supabase]);

  async function generateResponse() {
    if (!review.id || !review.text.trim()) {
      setGenerationError(
        "La review seleccionada no contiene texto válido."
      );
      return;
    }

    setIsGeneratingResponse(true);
    setGenerationError("");
    setTranslationError("");
    setSaved(false);

    try {
      const apiResponse = await fetch(
        "/api/review-response",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            review: {
              id: review.id,
              guest: review.guest,
              score: review.score,
              title: review.title,
              text: review.text,
              language: review.language,
              property: review.property,
              source:
                selectedSource?.source_name ??
                selectedSource?.source_code ??
                review.source,
            },
            context: context.trim(),
            tone,
          }),
        }
      );

      const data = (await apiResponse.json()) as {
        response?: string;
        error?: string;
      };

      if (!apiResponse.ok || !data.response?.trim()) {
        throw new Error(
          data.error ||
            "No se pudo generar la respuesta."
        );
      }

      const generatedResponse = data.response.trim();

      setResponse(generatedResponse);
      setOriginalResponse(generatedResponse);
      setIsTranslated(false);
      setTranslationLanguage("en");
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "No se pudo generar la respuesta."
      );
    } finally {
      setIsGeneratingResponse(false);
    }
  }

  async function translateResponse() {
    if (!response.trim()) {
      setTranslationError(
        "La respuesta no puede estar vacía."
      );
      return;
    }

    if (translationLanguage === "es") {
      restoreOriginalResponse();
      return;
    }

    setIsTranslating(true);
    setTranslationError("");
    setSaved(false);

    const baseResponse = isTranslated
      ? originalResponse
      : response;

    if (!isTranslated) {
      setOriginalResponse(response);
    }

    try {
      const apiResponse = await fetch(
        "/api/translate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: baseResponse,
            language: translationLanguage,
          }),
        }
      );

      const data = (await apiResponse.json()) as {
        translation?: string;
        translatedText?: string;
        error?: string;
      };

      const translatedText =
        data.translation ?? data.translatedText;

      if (!apiResponse.ok || !translatedText?.trim()) {
        throw new Error(
          data.error ||
            "No se pudo traducir la respuesta."
        );
      }

      setResponse(translatedText.trim());
      setIsTranslated(true);
    } catch (error) {
      setTranslationError(
        error instanceof Error
          ? error.message
          : "No se pudo traducir la respuesta."
      );
    } finally {
      setIsTranslating(false);
    }
  }

  function restoreOriginalResponse() {
    setResponse(originalResponse);
    setTranslationLanguage("es");
    setIsTranslated(false);
    setTranslationError("");
    setSaved(false);
  }

  async function copyAndOpenSourceReview() {
    if (!review.id || !response.trim()) {
      setGenerationError(
        "Primero debe generar o escribir una respuesta."
      );
      return;
    }

    if (!review.source_review_url) {
      setGenerationError(
        "Esta review no tiene una URL de origen."
      );
      return;
    }

    setGenerationError("");

    try {
      await navigator.clipboard.writeText(
        response.trim()
      );

      window.open(
        review.source_review_url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch {
      setGenerationError(
        "No se pudo copiar la respuesta o abrir la review."
      );
    }
  }

  async function saveDraft() {
    if (!review.id || !response.trim()) {
      setGenerationError(
        "La respuesta no puede estar vacía."
      );
      return;
    }

    setIsSavingDraft(true);
    setGenerationError("");
    setSaved(false);

    const cleanResponse = response.trim();

    const { error } = await supabase
      .from("imported_reviews")
      .update({
        owner_response_text: cleanResponse,
        analysis_status: "in_review",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", review.id);

    if (error) {
      setGenerationError(
        `No se pudo guardar el borrador: ${error.message}`
      );
      setIsSavingDraft(false);
      return;
    }

    setOriginalResponse(cleanResponse);
    setStatus("En revisión");
    setSaved(true);
    setIsSavingDraft(false);
  }

  function changeResponse(value: string) {
    setResponse(value);

    if (!isTranslated) {
      setOriginalResponse(value);
    }

    setSaved(false);
  }

  function changeTone(value: Tone) {
    setTone(value);
    setSaved(false);
  }

  function changeTranslationLanguage(
    value: TranslationLanguage
  ) {
    setTranslationLanguage(value);
    setTranslationError("");
  }

  function changeContext(value: string) {
    setContext(value);
    setSaved(false);
  }

  function toggleVoice() {
    setVoiceActive((current) => !current);
  }

  return {
    sources,
    selectedSource,
    selectedSourceId,

    review,
    importedReview,
    analysis,
    status,
    tone,
    context,
    response,
    translationLanguage,

    loadingSources,
    loadingReview,
    isAnalyzing,
    isGeneratingResponse,
    isTranslating,
    isSavingDraft,
    isTranslated,
    voiceActive,
    saved,

    sourceError,
    reviewError,
    analysisError,
    generationError,
    translationError,

    setSelectedSourceId,
    setStatus,
    changeTone,
    changeContext,
    changeResponse,
    changeTranslationLanguage,
    toggleVoice,

    generateResponse,
    translateResponse,
    restoreOriginalResponse,
    copyAndOpenSourceReview,
    saveDraft,
  };
}

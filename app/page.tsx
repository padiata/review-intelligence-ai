"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type ReviewStatus =
  | "Nueva"
  | "En revisión"
  | "Aprobada"
  | "Publicada";

type Tone = "Profesional" | "Cálida" | "Breve";

type ViewMode = "inbox" | "review";

type TranslationLanguage =
  | "es"
  | "en"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ru"
  | "zh"
  | "vi";

type TranslationLanguageOption = {
  code: TranslationLanguage;
  name: string;
};

const translationLanguages: TranslationLanguageOption[] = [
  { code: "es", name: "Español" },
  { code: "en", name: "Inglés" },
  { code: "fr", name: "Francés" },
  { code: "de", name: "Alemán" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Portugués" },
  { code: "ru", name: "Ruso" },
  { code: "zh", name: "Chino simplificado" },
  { code: "vi", name: "Vietnamita" },
];

type ReviewSource = {
  id: number;
  source_code: string;
  source_name: string;
  description: string | null;
  active: boolean;
};

type ImportedReview = {
  id: number;
  created_at: string;
  entity_id: number | null;
  source: string;
  source_review_id: string;
  source_review_url: string | null;
  property_name: string | null;
  property_url: string | null;
  review_title: string | null;
  review_text: string | null;
  rating: number | string | null;
  review_date: string | null;
  visit_date: string | null;
  language: string | null;
  original_language: string | null;
  reviewer_name: string | null;
  reviewer_url: string | null;
  reviewer_reviews_count: number | null;
  owner_response_text: string | null;
  owner_response_date: string | null;
  owner_response_author: string | null;
  raw_payload: Record<string, unknown> | null;
  analysis_status: string;
  sentiment?: string | null;
  priority?: string | null;
  detected_areas?: string[] | null;
  positive_aspects?: string[] | null;
  negative_aspects?: string[] | null;
  predominant_emotion?: string | null;
  recommendation_probability?: string | null;
  analysis_summary?: string | null;
  analyzed_at?: string | null;
};

type DisplayReview = {
  id: number | null;
  source: string;
  source_review_url: string | null;
  score: number;
  date: string;
  property: string;
  guest: string;
  language: string;
  title: string;
  text: string;
};

type ReviewAnalysis = {
  sentiment: string;
  priority: string;
  summary: string;
  positive_aspects: string[];
  negative_aspects: string[];
  detected_areas: string[];
  predominant_emotion: string;
  recommendation_probability: string;
};

const emptyAnalysis: ReviewAnalysis = {
  sentiment: "Sin analizar",
  priority: "Sin analizar",
  summary: "",
  positive_aspects: [],
  negative_aspects: [],
  detected_areas: [],
  predominant_emotion: "Sin analizar",
  recommendation_probability: "Sin analizar",
};

const emptyReview: DisplayReview = {
  id: null,
  source: "",
  source_review_url: null,
  score: 0,
  date: "Sin fecha",
  property: "Propiedad no especificada",
  guest: "Huésped",
  language: "Idioma no identificado",
  title: "",
  text: "No hay reviews disponibles para esta fuente.",
};

function formatReviewDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeRating(value: number | string | null) {
  const numericRating = Number(value ?? 0);

  if (!Number.isFinite(numericRating)) {
    return 0;
  }

  return Math.min(5, Math.max(0, Math.round(numericRating)));
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "H";
}


export default function Home() {
  const router = useRouter();
  const authSupabase = useMemo(() => createClient(), []);
  const supabase = authSupabase;

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [viewMode, setViewMode] =
    useState<ViewMode>("inbox");

  const [sources, setSources] = useState<ReviewSource[]>([]);
  const [inboxReviews, setInboxReviews] =
    useState<ImportedReview[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [inboxError, setInboxError] = useState("");
  const [selectedInboxReviewId, setSelectedInboxReviewId] =
    useState<number | null>(null);
  const [selectedSourceId, setSelectedSourceId] =
    useState<number | "">("");

  const [loadingSources, setLoadingSources] = useState(true);
  const [sourceError, setSourceError] = useState("");

  const [review, setReview] =
    useState<DisplayReview>(emptyReview);

  const [analysis, setAnalysis] =
    useState<ReviewAnalysis>(emptyAnalysis);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [context, setContext] = useState("");
  const [status, setStatus] =
    useState<ReviewStatus>("En revisión");

  const [tone, setTone] =
    useState<Tone>("Profesional");

  const [response, setResponse] = useState("");
  const [originalResponse, setOriginalResponse] = useState("");

  const [translationLanguage, setTranslationLanguage] =
    useState<TranslationLanguage>("en");

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const [isTranslated, setIsTranslated] = useState(false);

  const [isGeneratingResponse, setIsGeneratingResponse] =
    useState(false);
  const [generationError, setGenerationError] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [voiceActive, setVoiceActive] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadCurrentProfile() {
      const {
        data: { user },
      } = await authSupabase.auth.getUser();

      if (!user) {
        setIsSuperAdmin(false);
        return;
      }

      const { data: profile } = await authSupabase
        .from("user_profiles")
        .select("role, active")
        .eq("id", user.id)
        .single();

      setIsSuperAdmin(
        Boolean(
          profile?.active &&
            profile.role === "super_admin"
        )
      );
    }

    void loadCurrentProfile();
  }, [authSupabase]);

  useEffect(() => {
    async function loadSources() {
      setLoadingSources(true);
      setSourceError("");

      const { data, error } = await supabase
        .from("review_sources")
        .select(
          "id, source_code, source_name, description, active"
        )
        .eq("active", true)
        .order("source_name", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Error cargando las fuentes:",
          error
        );

        setSourceError(
          `No se pudieron cargar las fuentes: ${error.message}`
        );

        setSources([]);
        setLoadingSources(false);
        return;
      }

      const loadedSources =
        (data as ReviewSource[] | null) ?? [];

      setSources(loadedSources);

      const tripadvisorSource = loadedSources.find(
        (source) =>
          source.source_code.toUpperCase() ===
          "TRIPADVISOR"
      );

      if (tripadvisorSource) {
        setSelectedSourceId(tripadvisorSource.id);
      } else if (loadedSources.length > 0) {
        setSelectedSourceId(loadedSources[0].id);
      }

      setLoadingSources(false);
    }

    void loadSources();
  }, []);

  useEffect(() => {
    async function loadInbox() {
      setLoadingInbox(true);
      setInboxError("");

      const { data, error } = await supabase
        .from("imported_reviews")
        .select("*")
        .in("analysis_status", [
          "new",
          "pending",
          "in_review",
        ])
        .order("review_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando la bandeja:", error);
        setInboxReviews([]);
        setInboxError(
          `No se pudo cargar la bandeja: ${error.message}`
        );
      } else {
        setInboxReviews(
          (data as ImportedReview[] | null) ?? []
        );
      }

      setLoadingInbox(false);
    }

    void loadInbox();
  }, []);

  const selectedSource = useMemo(() => {
    return sources.find(
      (source) =>
        source.id === selectedSourceId
    );
  }, [sources, selectedSourceId]);

  useEffect(() => {
    async function loadReview() {
      if (selectedInboxReviewId) {
        return;
      }

      if (!selectedSource) {
        setReview(emptyReview);
        setReviewError("");
        return;
      }

      setLoadingReview(true);
      setReviewError("");
      setSaved(false);

      const { data, error } = await supabase
        .from("imported_reviews")
        .select(
          `
            id,
            created_at,
            entity_id,
            source,
            source_review_id,
            source_review_url,
            property_name,
            property_url,
            review_title,
            review_text,
            rating,
            review_date,
            visit_date,
            language,
            original_language,
            reviewer_name,
            reviewer_url,
            reviewer_reviews_count,
            owner_response_text,
            owner_response_date,
            owner_response_author,
            raw_payload,
            analysis_status,
            sentiment,
            priority,
            detected_areas,
            positive_aspects,
            negative_aspects,
            predominant_emotion,
            recommendation_probability,
            analysis_summary,
            analyzed_at
          `
        )
        .eq(
          "source",
          selectedSource.source_code
        )
        .order("review_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "Error cargando la review:",
          error
        );

        setReview(emptyReview);
        setReviewError(
          `No se pudo cargar la review: ${error.message}`
        );
        setLoadingReview(false);
        return;
      }

      if (!data) {
        setReview({
          ...emptyReview,
          text: `No hay reviews disponibles para ${selectedSource.source_name}.`,
        });
        setLoadingReview(false);
        return;
      }

      const importedReview =
        data as ImportedReview;

      setReview({
        id: importedReview.id,
        source: importedReview.source,
        source_review_url: importedReview.source_review_url,
        score: normalizeRating(
          importedReview.rating
        ),
        date: formatReviewDate(
          importedReview.review_date ??
            importedReview.created_at
        ),
        property:
          importedReview.property_name ??
          "Propiedad no especificada",
        guest:
          importedReview.reviewer_name ??
          "Huésped",
        language:
          importedReview.language ??
          importedReview.original_language ??
          "Idioma no identificado",
        title:
          importedReview.review_title ?? "",
        text:
          importedReview.review_text ??
          importedReview.review_title ??
          "La review no contiene texto.",
      });

      const existingResponse =
        importedReview.owner_response_text?.trim() ?? "";

      setResponse(existingResponse);
      setOriginalResponse(existingResponse);
      setIsTranslated(false);
      setTranslationLanguage("en");
      setGenerationError("");
      setTranslationError("");

      void analyzeReview(importedReview);

      setLoadingReview(false);
    }

    void loadReview();
  }, [selectedSource, selectedInboxReviewId]);

  const stars = useMemo(() => {
    return (
      "★".repeat(review.score) +
      "☆".repeat(5 - review.score)
    );
  }, [review.score]);

  function mapImportedReview(
    importedReview: ImportedReview
  ): DisplayReview {
    return {
      id: importedReview.id,
      source: importedReview.source,
      source_review_url: importedReview.source_review_url,
      score: normalizeRating(importedReview.rating),
      date: formatReviewDate(
        importedReview.review_date ??
          importedReview.created_at
      ),
      property:
        importedReview.property_name ??
        "Propiedad no especificada",
      guest:
        importedReview.reviewer_name ?? "Huésped",
      language:
        importedReview.language ??
        importedReview.original_language ??
        "Idioma no identificado",
      title: importedReview.review_title ?? "",
      text:
        importedReview.review_text ??
        importedReview.review_title ??
        "La review no contiene texto.",
    };
  }

  function applyStoredAnalysis(
    importedReview: ImportedReview
  ) {
    setAnalysis({
      sentiment:
        importedReview.sentiment ?? "Sin analizar",
      priority:
        importedReview.priority ?? "Sin analizar",
      summary:
        importedReview.analysis_summary ?? "",
      positive_aspects:
        importedReview.positive_aspects ?? [],
      negative_aspects:
        importedReview.negative_aspects ?? [],
      detected_areas:
        importedReview.detected_areas ?? [],
      predominant_emotion:
        importedReview.predominant_emotion ??
        "Sin analizar",
      recommendation_probability:
        importedReview.recommendation_probability ??
        "Sin analizar",
    });
  }

  async function analyzeReview(
    importedReview: ImportedReview
  ) {
    const hasStoredAnalysis =
      Boolean(importedReview.sentiment) &&
      Boolean(importedReview.priority) &&
      Boolean(importedReview.analysis_summary);

    if (hasStoredAnalysis) {
      applyStoredAnalysis(importedReview);
      setAnalysisError("");
      return;
    }

    const reviewText =
      importedReview.review_text ??
      importedReview.review_title ??
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
              id: importedReview.id,
              guest:
                importedReview.reviewer_name ??
                "Huésped",
              score: normalizeRating(
                importedReview.rating
              ),
              title:
                importedReview.review_title ?? "",
              text: reviewText,
              language:
                importedReview.language ??
                importedReview.original_language ??
                "",
              property:
                importedReview.property_name ??
                "Propiedad no especificada",
              source: importedReview.source,
            },
          }),
        }
      );

      const data = (await apiResponse.json()) as {
        analysis?: ReviewAnalysis;
        error?: string;
      };

      if (!apiResponse.ok) {
        throw new Error(
          data.error ||
            "No se pudo analizar la review."
        );
      }

      if (!data.analysis) {
        throw new Error(
          "La API no devolvió un análisis válido."
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
        .eq("id", importedReview.id);

      if (saveError) {
        console.error(
          "No se pudo guardar el análisis:",
          saveError
        );
      }

      setInboxReviews((current) =>
        current.map((item) =>
          item.id === importedReview.id
            ? {
                ...item,
                sentiment:
                  data.analysis?.sentiment ?? null,
                priority:
                  data.analysis?.priority ?? null,
                detected_areas:
                  data.analysis?.detected_areas ?? [],
                positive_aspects:
                  data.analysis?.positive_aspects ?? [],
                negative_aspects:
                  data.analysis?.negative_aspects ?? [],
                predominant_emotion:
                  data.analysis
                    ?.predominant_emotion ?? null,
                recommendation_probability:
                  data.analysis
                    ?.recommendation_probability ??
                  null,
                analysis_summary:
                  data.analysis?.summary ?? null,
                analyzed_at: analyzedAt,
              }
            : item
        )
      );
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
  }

  async function openInboxReview(
    importedReview: ImportedReview
  ) {
    const matchingSource = sources.find(
      (source) =>
        source.source_code.toUpperCase() ===
        importedReview.source.toUpperCase()
    );

    setSelectedInboxReviewId(importedReview.id);

    if (matchingSource) {
      setSelectedSourceId(matchingSource.id);
    }

    setReview(mapImportedReview(importedReview));

    const existingResponse =
      importedReview.owner_response_text?.trim() ?? "";

    setResponse(existingResponse);
    setOriginalResponse(existingResponse);
    setIsTranslated(false);
    setTranslationLanguage("en");
    setGenerationError("");
    setTranslationError("");

    setViewMode("review");
    setReviewError("");
    setSaved(false);

    void analyzeReview(importedReview);

    if (
      importedReview.analysis_status === "new" ||
      importedReview.analysis_status === "pending"
    ) {
      const { error } = await supabase
        .from("imported_reviews")
        .update({ analysis_status: "in_review" })
        .eq("id", importedReview.id);

      if (!error) {
        setInboxReviews((current) =>
          current.map((item) =>
            item.id === importedReview.id
              ? { ...item, analysis_status: "in_review" }
              : item
          )
        );
        setStatus("En revisión");
      }
    }
  }

  async function generateResponse() {
    if (!review.id) {
      setGenerationError(
        "Seleccione una review antes de generar la respuesta."
      );
      return;
    }

    if (!review.text.trim()) {
      setGenerationError(
        "La review seleccionada no contiene texto."
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
                "",
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

      if (!apiResponse.ok) {
        throw new Error(
          data.error ||
            "No se pudo generar la respuesta."
        );
      }

      const generatedResponse =
        data.response?.trim();

      if (!generatedResponse) {
        throw new Error(
          "La API no devolvió una respuesta válida."
        );
      }

      setResponse(generatedResponse);
      setOriginalResponse(generatedResponse);
      setIsTranslated(false);
      setTranslationLanguage("en");
    } catch (error) {
      console.error(
        "Error generando la respuesta:",
        error
      );

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
    const textToTranslate = response.trim();

    if (!textToTranslate) {
      setTranslationError(
        "La respuesta no puede estar vacía."
      );
      return;
    }

    if (translationLanguage === "es") {
      if (isTranslated) {
        restoreOriginalResponse();
      }

      setTranslationError("");
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

      if (!apiResponse.ok) {
        throw new Error(
          data.error ||
            "No se pudo traducir la respuesta."
        );
      }

      const translatedText =
        data.translation ?? data.translatedText;

      if (!translatedText?.trim()) {
        throw new Error(
          "La API no devolvió una traducción válida."
        );
      }

      setResponse(translatedText);
      setIsTranslated(true);
    } catch (error) {
      console.error(
        "Error traduciendo la respuesta:",
        error
      );

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

  function toggleVoice() {
    setVoiceActive((current) => !current);
  }

  async function copyAndOpenSourceReview() {
    if (!review.id) {
      setGenerationError(
        "No hay una review cargada para publicar."
      );
      return;
    }

    const cleanResponse = response.trim();

    if (!cleanResponse) {
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
      await navigator.clipboard.writeText(cleanResponse);

      window.open(
        review.source_review_url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(
        "No se pudo copiar o abrir la review:",
        error
      );

      setGenerationError(
        "No se pudo copiar la respuesta o abrir la review."
      );
    }
  }

  async function saveDraft() {
    if (!review.id) {
      setGenerationError(
        "No hay una review cargada para guardar."
      );
      return;
    }

    const cleanResponse = response.trim();

    if (!cleanResponse) {
      setGenerationError(
        "La respuesta no puede estar vacía."
      );
      return;
    }

    setIsSavingDraft(true);
    setGenerationError("");
    setSaved(false);

    const { error } = await supabase
      .from("imported_reviews")
      .update({
        owner_response_text: cleanResponse,
        analysis_status: "in_review",
      })
      .eq("id", review.id);

    if (error) {
      console.error(
        "Error guardando el borrador:",
        error
      );

      setGenerationError(
        `No se pudo guardar el borrador: ${error.message}`
      );
      setIsSavingDraft(false);
      return;
    }

    setInboxReviews((current) =>
      current.map((item) =>
        item.id === review.id
          ? {
              ...item,
              owner_response_text: cleanResponse,
              analysis_status: "in_review",
            }
          : item
      )
    );

    setStatus("En revisión");
    setOriginalResponse(cleanResponse);
    setSaved(true);
    setIsSavingDraft(false);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError("");

    const { error } = await authSupabase.auth.signOut();

    if (error) {
      console.error("Error cerrando la sesión:", error);
      setLogoutError(
        `No se pudo cerrar la sesión: ${error.message}`
      );
      setIsLoggingOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">RI</div>

          <div>
            <strong>
              Review Intelligence
            </strong>

            <span>Lab</span>
          </div>
        </div>

        <nav
          className="nav-list"
          aria-label="Navegación principal"
        >
          <button
            type="button"
            className={
              viewMode === "inbox"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setViewMode("inbox")}
          >
            Bandeja <span>{inboxReviews.length}</span>
          </button>

          <button
            type="button"
            className={
              viewMode === "review"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setViewMode("review")}
            disabled={!review.id}
          >
            En revisión
          </button>

          <button className="nav-item">
            Aprobadas
          </button>

          <button className="nav-item">
            Publicadas
          </button>

          <button className="nav-item">
            Reportes
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              className="nav-item"
              onClick={() => router.push("/admin/users")}
            >
              Administración
            </button>
          )}

          <button className="nav-item">
            Configuración
          </button>
        </nav>

        <div className="hotel-card">
          <span>Hotel activo</span>

          <strong>
            Hotel Habana Central
          </strong>

          <small>
            Cuenta de demostración
          </small>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              Asistente de respuestas
            </p>

            <h1>
              {viewMode === "inbox"
                ? "Bandeja de reviews"
                : "Revisión de opinión"}
            </h1>
          </div>

          <div className="top-actions">
            {viewMode === "review" && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setViewMode("inbox")}
              >
                Volver a la bandeja
              </button>
            )}

            <span className="user-chip">
              TZ
            </span>

            <button
              type="button"
              className="secondary-button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut
                ? "Cerrando..."
                : "Cerrar sesión"}
            </button>
          </div>
        </header>

        {logoutError && (
          <p
            role="alert"
            style={{
              margin: "0 0 16px",
              color: "#b42318",
              fontSize: "13px",
            }}
          >
            {logoutError}
          </p>
        )}

        {viewMode === "inbox" ? (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  Reviews recibidas
                </p>
                <h2>
                  Seleccione una review para trabajar
                </h2>
              </div>

              <span className="optional">
                {loadingInbox
                  ? "Cargando..."
                  : `${inboxReviews.length} disponibles`}
              </span>
            </div>

            {inboxError && (
              <p
                role="alert"
                style={{ color: "#b42318" }}
              >
                {inboxError}
              </p>
            )}

            {!loadingInbox &&
              !inboxError &&
              inboxReviews.length === 0 && (
                <p>
                  No hay reviews nuevas, pendientes o en revisión.
                </p>
              )}

            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              {inboxReviews.map((item) => {
                const score = normalizeRating(item.rating);
                const sourceName =
                  sources.find(
                    (source) =>
                      source.source_code.toUpperCase() ===
                      item.source.toUpperCase()
                  )?.source_name ?? item.source;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      void openInboxReview(item)
                    }
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "18px",
                      border:
                        "1px solid rgba(15, 23, 42, 0.12)",
                      borderRadius: "14px",
                      background: "#ffffff",
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong>
                            {item.reviewer_name ?? "Huésped"}
                          </strong>
                          <span className="optional">
                            {sourceName}
                          </span>
                          <span className="optional">
                            {item.analysis_status}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: "8px 0 4px",
                            fontWeight: 600,
                          }}
                        >
                          {item.review_title ??
                            item.property_name ??
                            "Review sin título"}
                        </p>

                        <p
                          style={{
                            margin: 0,
                            opacity: 0.75,
                            lineHeight: 1.5,
                          }}
                        >
                          {(item.review_text ??
                            "La review no contiene texto.").slice(
                            0,
                            180
                          )}
                          {(item.review_text ?? "").length >
                          180
                            ? "…"
                            : ""}
                        </p>
                      </div>

                      <div
                        style={{
                          minWidth: "120px",
                          textAlign: "right",
                        }}
                      >
                        <div className="stars">
                          {"★".repeat(score)}
                          {"☆".repeat(5 - score)}
                        </div>
                        <span className="date">
                          {formatReviewDate(
                            item.review_date ??
                              item.created_at
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="content-grid">
          <section className="main-column">
            <article className="panel review-card">
              <div className="review-header">
                <div>
                  <div className="platform-row">
                    <select
                      aria-label="Fuente de la review"
                      value={selectedSourceId}
                      disabled={
                        loadingSources ||
                        loadingReview
                      }
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        setSelectedInboxReviewId(null);

                        setSelectedSourceId(
                          value === ""
                            ? ""
                            : Number(value)
                        );

                        setSaved(false);
                      }}
                    >
                      <option value="">
                        {loadingSources
                          ? "Cargando fuentes..."
                          : "Seleccione una fuente"}
                      </option>

                      {sources.map((source) => (
                        <option
                          key={source.id}
                          value={source.id}
                        >
                          {source.source_name}
                        </option>
                      ))}
                    </select>

                    <span className="date">
                      {loadingReview
                        ? "Cargando..."
                        : review.date}
                    </span>
                  </div>

                  <div
                    className="stars"
                    aria-label={`${review.score} de 5 estrellas`}
                  >
                    {stars}
                  </div>

                  {sourceError && (
                    <p
                      style={{
                        marginTop: "10px",
                        marginBottom: 0,
                        color: "#b42318",
                        fontSize: "13px",
                      }}
                    >
                      {sourceError}
                    </p>
                  )}

                  {reviewError && (
                    <p
                      style={{
                        marginTop: "10px",
                        marginBottom: 0,
                        color: "#b42318",
                        fontSize: "13px",
                      }}
                    >
                      {reviewError}
                    </p>
                  )}
                </div>

                <select
                  aria-label="Estado de la review"
                  value={status}
                  onChange={(event) => {
                    setStatus(
                      event.target
                        .value as ReviewStatus
                    );

                    setSaved(false);
                  }}
                >
                  <option>Nueva</option>
                  <option>En revisión</option>
                  <option>Aprobada</option>
                  <option>Publicada</option>
                </select>
              </div>

              <div className="guest-row">
                <div className="avatar">
                  {getInitials(review.guest)}
                </div>

                <div>
                  <strong>
                    {loadingReview
                      ? "Cargando huésped..."
                      : review.guest}
                  </strong>

                  <span>
                    {review.property} ·{" "}
                    {review.language}
                  </span>
                </div>
              </div>

              {review.title && (
                <h3
                  style={{
                    marginTop: "18px",
                    marginBottom: "6px",
                  }}
                >
                  {review.title}
                </h3>
              )}

              <blockquote>
                {loadingReview
                  ? "Cargando review..."
                  : review.text}
              </blockquote>
            </article>

            <article className="panel context-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    Contexto interno
                  </p>

                  <h2>
                    ¿Qué debe saber la IA
                    antes de responder?
                  </h2>
                </div>

                <span className="optional">
                  Opcional
                </span>
              </div>

              <textarea
                value={context}
                onChange={(event) => {
                  setContext(
                    event.target.value
                  );

                  setSaved(false);
                }}
                placeholder="Ejemplo: El huésped llegó tres horas antes del check-in y el aire acondicionado fue reparado esa misma tarde."
                rows={5}
              />

              <div className="context-actions">
                <button
                  type="button"
                  className={
                    voiceActive
                      ? "voice-button recording"
                      : "voice-button"
                  }
                  onClick={toggleVoice}
                >
                  <span className="mic">
                    ●
                  </span>

                  {voiceActive
                    ? "Detener grabación"
                    : "Explicar por voz"}
                </button>

                <span className="helper-text">
                  {voiceActive
                    ? "Grabando demostración…"
                    : "La función de audio se conectará en la siguiente etapa."}
                </span>
              </div>
            </article>

            <article className="panel response-card">
              <div className="section-heading response-heading">
                <div>
                  <p className="eyebrow">
                    Borrador generado
                  </p>

                  <h2>
                    Respuesta propuesta
                  </h2>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <select
                    aria-label="Tono de la respuesta"
                    value={tone}
                    onChange={(event) => {
                      setTone(
                        event.target
                          .value as Tone
                      );

                      setSaved(false);
                    }}
                  >
                    <option>
                      Profesional
                    </option>

                    <option>Cálida</option>

                    <option>Breve</option>
                  </select>

                  <select
                    aria-label="Idioma de traducción"
                    value={translationLanguage}
                    disabled={isTranslating}
                    onChange={(event) => {
                      setTranslationLanguage(
                        event.target
                          .value as TranslationLanguage
                      );

                      setTranslationError("");
                    }}
                  >
                    {translationLanguages.map(
                      (language) => (
                        <option
                          key={language.code}
                          value={language.code}
                        >
                          {language.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <textarea
                className="response-editor"
                value={response}
                placeholder="Pulse Generar respuesta para crear un borrador con IA."
                onChange={(event) => {
                  const nextResponse =
                    event.target.value;

                  setResponse(nextResponse);

                  if (!isTranslated) {
                    setOriginalResponse(
                      nextResponse
                    );
                  }

                  setSaved(false);
                }}
                rows={11}
              />

              <div className="response-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void generateResponse()}
                  disabled={
                    isTranslating ||
                    isGeneratingResponse ||
                    isSavingDraft ||
                    loadingReview ||
                    !review.id
                  }
                >
                  {isGeneratingResponse
                    ? "Generando..."
                    : response.trim()
                      ? "Regenerar respuesta"
                      : "Generar respuesta"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={translateResponse}
                  disabled={
                    isTranslating ||
                    isGeneratingResponse ||
                    isSavingDraft ||
                    loadingReview ||
                    !review.id ||
                    !response.trim()
                  }
                >
                  {isTranslating
                    ? "Traduciendo..."
                    : "Traducir"}
                </button>

                {isTranslated && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={restoreOriginalResponse}
                    disabled={isTranslating}
                  >
                    Restaurar original
                  </button>
                )}

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    void copyAndOpenSourceReview()
                  }
                  disabled={
                    isTranslating ||
                    isGeneratingResponse ||
                    isSavingDraft ||
                    loadingReview ||
                    !review.id ||
                    !response.trim() ||
                    !review.source_review_url
                  }
                >
                  Copiar y abrir fuente
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void saveDraft()}
                  disabled={
                    isTranslating ||
                    isGeneratingResponse ||
                    isSavingDraft ||
                    loadingReview ||
                    !review.id ||
                    !response.trim()
                  }
                >
                  {isSavingDraft
                    ? "Guardando..."
                    : "Guardar borrador"}
                </button>
              </div>

              {generationError && (
                <p
                  role="alert"
                  style={{
                    marginTop: "12px",
                    marginBottom: 0,
                    color: "#b42318",
                    fontSize: "13px",
                  }}
                >
                  {generationError}
                </p>
              )}

              {translationError && (
                <p
                  role="alert"
                  style={{
                    marginTop: "12px",
                    marginBottom: 0,
                    color: "#b42318",
                    fontSize: "13px",
                  }}
                >
                  {translationError}
                </p>
              )}

              <div
                className="feedback"
                aria-live="polite"
              >
                {saved
                  ? `Borrador guardado para la fuente ${
                      selectedSource
                        ?.source_name ??
                      ""
                    }.`
                  : ""}
              </div>
            </article>
          </section>

          <aside className="right-column">
            <article className="panel analysis-card">
              <p className="eyebrow">
                Análisis automático
              </p>

              <h2>
                Resumen de la review
              </h2>

              {isAnalyzing && (
                <p
                  style={{
                    marginTop: "0",
                    color: "#667085",
                    fontSize: "14px",
                  }}
                >
                  Analizando la review...
                </p>
              )}

              {analysisError && (
                <p
                  role="alert"
                  style={{
                    marginTop: "0",
                    color: "#b42318",
                    fontSize: "13px",
                  }}
                >
                  {analysisError}
                </p>
              )}

              <div className="analysis-item">
                <span>Fuente</span>

                <strong>
                  {loadingSources
                    ? "Cargando..."
                    : selectedSource?.source_name ??
                      "Sin seleccionar"}
                </strong>
              </div>

              <div className="analysis-item">
                <span>Sentimiento</span>

                <strong>
                  {isAnalyzing
                    ? "Analizando..."
                    : analysis.sentiment}
                </strong>
              </div>

              <div className="analysis-item">
                <span>Prioridad</span>

                <strong>
                  {isAnalyzing
                    ? "Analizando..."
                    : analysis.priority}
                </strong>
              </div>

              <div className="analysis-item">
                <span>Emoción</span>

                <strong>
                  {isAnalyzing
                    ? "Analizando..."
                    : analysis.predominant_emotion}
                </strong>
              </div>

              <div className="analysis-item">
                <span>
                  Probabilidad de recomendación
                </span>

                <strong>
                  {isAnalyzing
                    ? "Analizando..."
                    : analysis.recommendation_probability}
                </strong>
              </div>

              <div className="analysis-item stacked">
                <span>Áreas detectadas</span>

                <div className="tag-list">
                  {analysis.detected_areas.length > 0 ? (
                    analysis.detected_areas.map(
                      (area) => (
                        <span key={area}>{area}</span>
                      )
                    )
                  ) : (
                    <span>
                      {isAnalyzing
                        ? "Analizando..."
                        : "Sin resultados"}
                    </span>
                  )}
                </div>
              </div>

              {analysis.positive_aspects.length > 0 && (
                <div className="analysis-item stacked">
                  <span>Aspectos positivos</span>

                  <div className="tag-list">
                    {analysis.positive_aspects.map(
                      (aspect) => (
                        <span key={aspect}>
                          {aspect}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {analysis.negative_aspects.length > 0 && (
                <div className="analysis-item stacked">
                  <span>Aspectos negativos</span>

                  <div className="tag-list">
                    {analysis.negative_aspects.map(
                      (aspect) => (
                        <span key={aspect}>
                          {aspect}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {analysis.summary && (
                <div className="analysis-item stacked">
                  <span>Resumen ejecutivo</span>

                  <p
                    style={{
                      margin: 0,
                      lineHeight: 1.55,
                    }}
                  >
                    {analysis.summary}
                  </p>
                </div>
              )}
            </article>

            <article className="panel workflow-card">
              <p className="eyebrow">
                Flujo de trabajo
              </p>

              <h2>
                Estado de gestión
              </h2>

              <ol>
                <li className="done">
                  <span>1</span>
                  Review capturada
                </li>

                <li className="done">
                  <span>2</span>
                  Análisis realizado
                </li>

                <li className="current">
                  <span>3</span>
                  Respuesta en revisión
                </li>

                <li>
                  <span>4</span>
                  Aprobación
                </li>

                <li>
                  <span>5</span>
                  Publicación manual
                </li>
              </ol>
            </article>

            <article className="insight-card">
              <span className="insight-icon">
                ◎
              </span>

              <div>
                <strong>
                  Posible recurrencia
                </strong>

                <p>
                  Se detectaron 4 menciones
                  recientes relacionadas con
                  climatización.
                </p>
              </div>
            </article>
          </aside>
        </div>
        )}
      </section>
    </main>
  );
}
export type ReviewStatus =
  | "Nueva"
  | "En revisión"
  | "Aprobada"
  | "Publicada";

export type Tone =
  | "Profesional"
  | "Cálida"
  | "Breve";

export type TranslationLanguage =
  | "es"
  | "en"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ru"
  | "zh"
  | "vi";

export type TranslationLanguageOption = {
  code: TranslationLanguage;
  name: string;
};

export type ReviewSource = {
  id: number;
  source_code: string;
  source_name: string;
  description: string | null;
  active: boolean;
};

export type ImportedReview = {
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

export type DisplayReview = {
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

export type ReviewAnalysis = {
  sentiment: string;
  priority: string;
  summary: string;
  positive_aspects: string[];
  negative_aspects: string[];
  detected_areas: string[];
  predominant_emotion: string;
  recommendation_probability: string;
};
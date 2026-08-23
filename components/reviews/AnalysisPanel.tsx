"use client";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

import type {
  ReviewAnalysis,
  ReviewSource,
} from "./review-types";

type Props = {
  analysis: ReviewAnalysis;
  selectedSource?: ReviewSource;
  loadingSources: boolean;
  isAnalyzing: boolean;
  analysisError?: string;
};

export default function AnalysisPanel({
  analysis,
  selectedSource,
  loadingSources,
  isAnalyzing,
  analysisError,
}: Props) {
  const {
    messages,
  } = useLanguage();

  const analysisMessages =
    messages.reviewDetail.analysis;

  const translateValue = (
    group:
      | "sentiment"
      | "priority"
      | "emotion"
      | "recommendationProbability"
      | "areas",
    value: string
  ) => {
    const dictionary =
      analysisMessages.values[group] as Record<
        string,
        string
      >;

    return dictionary[value] ?? value;
  };

  return (
    <article className="panel analysis-card">
      <p className="eyebrow">
        {analysisMessages.eyebrow}
      </p>

      <h2>
        {analysisMessages.title}
      </h2>

      {isAnalyzing && (
        <p className="analysis-loading">
          {
            analysisMessages
              .analyzingReview
          }
        </p>
      )}

      {analysisError && (
        <p
          role="alert"
          className="analysis-error"
        >
          {analysisError}
        </p>
      )}

      <div className="analysis-item">
        <span>
          {analysisMessages.source}
        </span>

        <strong>
          {loadingSources
            ? analysisMessages.loading
            : selectedSource
                ?.source_name ??
              analysisMessages
                .noSource}
        </strong>
      </div>

      <div className="analysis-item">
        <span>
          {analysisMessages.sentiment}
        </span>

        <strong>
          {isAnalyzing
            ? analysisMessages
                .analyzing
            : translateValue(
                "sentiment",
                analysis.sentiment
              )}
        </strong>
      </div>

      <div className="analysis-item">
        <span>
          {analysisMessages.priority}
        </span>

        <strong>
          {isAnalyzing
            ? analysisMessages
                .analyzing
            : translateValue(
                "priority",
                analysis.priority
              )}
        </strong>
      </div>

      <div className="analysis-item">
        <span>
          {analysisMessages.emotion}
        </span>

        <strong>
          {isAnalyzing
            ? analysisMessages
                .analyzing
            : translateValue(
                "emotion",
                analysis
                  .predominant_emotion
              )}
        </strong>
      </div>

      <div className="analysis-item">
        <span>
          {
            analysisMessages
              .recommendationProbability
          }
        </span>

        <strong>
          {isAnalyzing
            ? analysisMessages
                .analyzing
            : translateValue(
                "recommendationProbability",
                analysis
                  .recommendation_probability
              )}
        </strong>
      </div>

      <div className="analysis-item stacked">
        <span>
          {
            analysisMessages
              .detectedAreas
          }
        </span>

        <div className="tag-list">
          {analysis.detected_areas.length >
          0 ? (
            analysis.detected_areas.map(
              (area) => (
                <span key={area}>
                  {translateValue(
                    "areas",
                    area
                  )}
                </span>
              )
            )
          ) : (
            <span>
              {isAnalyzing
                ? analysisMessages
                    .analyzing
                : analysisMessages
                    .noResults}
            </span>
          )}
        </div>
      </div>

      {analysis.positive_aspects.length >
        0 && (
        <div className="analysis-item stacked">
          <span>
            {
              analysisMessages
                .positiveAspects
            }
          </span>

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

      {analysis.negative_aspects.length >
        0 && (
        <div className="analysis-item stacked">
          <span>
            {
              analysisMessages
                .negativeAspects
            }
          </span>

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
          <span>
            {
              analysisMessages
                .executiveSummary
            }
          </span>

          <p className="analysis-summary">
            {analysis.summary}
          </p>
        </div>
      )}
    </article>
  );
}
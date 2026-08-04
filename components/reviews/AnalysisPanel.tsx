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
  return (
    <article className="panel analysis-card">
      <p className="eyebrow">
        Análisis automático
      </p>

      <h2>
        Resumen de la review
      </h2>

      {isAnalyzing && (
        <p className="analysis-loading">
          Analizando la review...
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
                <span key={area}>
                  {area}
                </span>
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

          <p className="analysis-summary">
            {analysis.summary}
          </p>
        </div>
      )}
    </article>
  );
}
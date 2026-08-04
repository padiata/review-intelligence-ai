import type {
  Tone,
  TranslationLanguage,
  TranslationLanguageOption,
} from "./review-types";

type Props = {
  tone: Tone;
  translationLanguage: TranslationLanguage;
  translationLanguages: TranslationLanguageOption[];

  response: string;

  isTranslated: boolean;
  isTranslating: boolean;
  isGeneratingResponse: boolean;
  isSavingDraft: boolean;
  loadingReview: boolean;

  reviewId: number | null;
  sourceReviewUrl: string | null;

  generationError?: string;
  translationError?: string;
  saved: boolean;
  sourceName?: string;

  onToneChange: (tone: Tone) => void;

  onTranslationLanguageChange: (
    language: TranslationLanguage
  ) => void;

  onResponseChange: (value: string) => void;

  onGenerateResponse: () => void;
  onTranslateResponse: () => void;
  onRestoreOriginal: () => void;
  onCopyAndOpenSource: () => void;
  onSaveDraft: () => void;
};

export default function ResponseEditor({
  tone,
  translationLanguage,
  translationLanguages,
  response,
  isTranslated,
  isTranslating,
  isGeneratingResponse,
  isSavingDraft,
  loadingReview,
  reviewId,
  sourceReviewUrl,
  generationError,
  translationError,
  saved,
  sourceName,
  onToneChange,
  onTranslationLanguageChange,
  onResponseChange,
  onGenerateResponse,
  onTranslateResponse,
  onRestoreOriginal,
  onCopyAndOpenSource,
  onSaveDraft,
}: Props) {
  const disabled =
    isTranslating ||
    isGeneratingResponse ||
    isSavingDraft ||
    loadingReview ||
    !reviewId;

  return (
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

        <div className="response-editor-options">
          <select
            aria-label="Tono de la respuesta"
            value={tone}
            onChange={(event) =>
              onToneChange(
                event.target.value as Tone
              )
            }
          >
            <option>
              Profesional
            </option>

            <option>
              Cálida
            </option>

            <option>
              Breve
            </option>
          </select>

          <select
            aria-label="Idioma de traducción"
            value={translationLanguage}
            disabled={isTranslating}
            onChange={(event) =>
              onTranslationLanguageChange(
                event.target
                  .value as TranslationLanguage
              )
            }
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
        onChange={(event) =>
          onResponseChange(event.target.value)
        }
        rows={11}
      />

      <div className="response-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onGenerateResponse}
          disabled={disabled}
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
          onClick={onTranslateResponse}
          disabled={
            disabled ||
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
            onClick={onRestoreOriginal}
            disabled={isTranslating}
          >
            Restaurar original
          </button>
        )}

        <button
          type="button"
          className="secondary-button"
          onClick={onCopyAndOpenSource}
          disabled={
            disabled ||
            !response.trim() ||
            !sourceReviewUrl
          }
        >
          Copiar y abrir fuente
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={onSaveDraft}
          disabled={
            disabled ||
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
          className="response-editor-error"
        >
          {generationError}
        </p>
      )}

      {translationError && (
        <p
          role="alert"
          className="response-editor-error"
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
              sourceName ?? ""
            }.`
          : ""}
      </div>
    </article>
  );
}
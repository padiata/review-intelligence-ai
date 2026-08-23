"use client";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

import type {
  Tone,
  TranslationLanguage,
  TranslationLanguageOption,
} from "./review-types";

type Props = {
  tone: Tone;

  translationLanguage:
    TranslationLanguage;

  translationLanguages:
    TranslationLanguageOption[];

  response: string;

  isTranslated: boolean;
  isTranslating: boolean;

  isGeneratingResponse: boolean;

  isSavingDraft: boolean;

  isApproving: boolean;

  canApprove: boolean;

  loadingReview: boolean;

  reviewId: number | null;

  sourceReviewUrl:
    string | null;

  generationError?: string;

  translationError?: string;

  saved: boolean;

  sourceName?: string;

  onToneChange:
    (tone: Tone) => void;

  onTranslationLanguageChange:
    (
      language:
        TranslationLanguage
    ) => void;

  onResponseChange:
    (value: string) => void;

  onGenerateResponse:
    () => void;

  onTranslateResponse:
    () => void;

  onRestoreOriginal:
    () => void;

  onCopyAndOpenSource:
    () => void;

  onSaveDraft:
    () => void;

  onApprove:
    () => void;
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

  isApproving,

  canApprove,

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

  onApprove,
}: Props) {
  const {
    messages,
  } = useLanguage();

  const editor =
    messages.reviewDetail
      .responseEditor;

  const disabled =
    isTranslating ||
    isGeneratingResponse ||
    isSavingDraft ||
    isApproving ||
    loadingReview ||
    !reviewId;

  function getLanguageLabel(
    code: TranslationLanguage
  ) {
    return (
      editor.languages[
        code
      ]
    );
  }

  return (
    <article className="panel response-card">
      <div className="section-heading response-heading">
        <div>
          <p className="eyebrow">
            {editor.eyebrow}
          </p>

          <h2>
            {editor.title}
          </h2>
        </div>

        <div className="response-editor-options">
          <select
            aria-label={
              editor.toneAria
            }
            value={tone}
            disabled={disabled}
            onChange={(event) =>
              onToneChange(
                event.target
                  .value as Tone
              )
            }
          >
            <option value="Profesional">
              {
                editor.tones
                  .professional
              }
            </option>

            <option value="Cálida">
              {
                editor.tones
                  .warm
              }
            </option>

            <option value="Breve">
              {
                editor.tones
                  .brief
              }
            </option>
          </select>

          <select
            aria-label={
              editor
                .translationLanguageAria
            }
            value={
              translationLanguage
            }
            disabled={
              disabled ||
              isTranslating
            }
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
                  key={
                    language.code
                  }
                  value={
                    language.code
                  }
                >
                  {
                    getLanguageLabel(
                      language.code
                    )
                  }
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <textarea
        className="response-editor"
        value={response}
        placeholder={
          editor.placeholder
        }
        disabled={
          loadingReview ||
          isApproving
        }
        onChange={(event) =>
          onResponseChange(
            event.target.value
          )
        }
        rows={11}
      />

      <div className="response-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={
            onGenerateResponse
          }
          disabled={disabled}
        >
          {isGeneratingResponse
            ? editor.generating
            : response.trim()
              ? editor.regenerate
              : editor.generate}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={
            onTranslateResponse
          }
          disabled={
            disabled ||
            !response.trim()
          }
        >
          {isTranslating
            ? editor.translating
            : editor.translate}
        </button>

        {isTranslated && (
          <button
            type="button"
            className="secondary-button"
            onClick={
              onRestoreOriginal
            }
            disabled={
              disabled
            }
          >
            {
              editor
                .restoreOriginal
            }
          </button>
        )}

        <button
          type="button"
          className="secondary-button"
          onClick={
            onCopyAndOpenSource
          }
          disabled={
            disabled ||
            !response.trim() ||
            !sourceReviewUrl
          }
        >
          {editor.copyAndOpen}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={
            onSaveDraft
          }
          disabled={
            disabled ||
            !response.trim()
          }
        >
          {isSavingDraft
            ? editor.saving
            : editor.saveDraft}
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={
            onApprove
          }
          disabled={
            disabled ||
            !response.trim() ||
            !canApprove
          }
          title={
            !canApprove
              ? editor
                  .noApprovalPermission
              : undefined
          }
        >
          {isApproving
            ? editor.approving
            : editor.approve}
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
          ? `${editor.savedPrefix} ${
              sourceName ?? ""
            }.`
          : ""}
      </div>
    </article>
  );
}
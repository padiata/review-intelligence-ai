"use client";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

type Props = {
  context: string;
  voiceActive: boolean;

  onContextChange: (
    value: string
  ) => void;

  onToggleVoice: () => void;
};

export default function ContextCard({
  context,
  voiceActive,
  onContextChange,
  onToggleVoice,
}: Props) {
  const {
    messages,
  } = useLanguage();

  const contextMessages =
    messages.reviewDetail
      .context;

  return (
    <article className="panel context-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {
              contextMessages
                .eyebrow
            }
          </p>

          <h2>
            {
              contextMessages
                .title
            }
          </h2>
        </div>

        <span className="optional">
          {
            contextMessages
              .optional
          }
        </span>
      </div>

      <textarea
        value={context}
        onChange={(
          event
        ) =>
          onContextChange(
            event.target.value
          )
        }
        placeholder={
          contextMessages
            .placeholder
        }
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
          onClick={
            onToggleVoice
          }
        >
          <span className="mic">
            ●
          </span>

          {voiceActive
            ? contextMessages
                .stopRecording
            : contextMessages
                .explainByVoice}
        </button>

        <span className="helper-text">
          {voiceActive
            ? contextMessages
                .recording
            : contextMessages
                .audioFuture}
        </span>
      </div>
    </article>
  );
}
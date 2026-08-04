type Props = {
  context: string;
  voiceActive: boolean;

  onContextChange: (value: string) => void;
  onToggleVoice: () => void;
};

export default function ContextCard({
  context,
  voiceActive,
  onContextChange,
  onToggleVoice,
}: Props) {
  return (
    <article className="panel context-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            Contexto interno
          </p>

          <h2>
            ¿Qué debe saber la IA antes de responder?
          </h2>
        </div>

        <span className="optional">
          Opcional
        </span>
      </div>

      <textarea
        value={context}
        onChange={(event) =>
          onContextChange(event.target.value)
        }
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
          onClick={onToggleVoice}
        >
          <span className="mic">●</span>

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
  );
}
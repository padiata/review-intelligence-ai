type WorkflowStep = {
  number: number;
  label: string;
  state?: "done" | "current" | "pending";
};

type Props = {
  steps?: WorkflowStep[];
};

const defaultSteps: WorkflowStep[] = [
  {
    number: 1,
    label: "Review capturada",
    state: "done",
  },
  {
    number: 2,
    label: "Análisis realizado",
    state: "done",
  },
  {
    number: 3,
    label: "Respuesta en revisión",
    state: "current",
  },
  {
    number: 4,
    label: "Aprobación",
    state: "pending",
  },
  {
    number: 5,
    label: "Publicación manual",
    state: "pending",
  },
];

export default function WorkflowPanel({
  steps = defaultSteps,
}: Props) {
  return (
    <article className="panel workflow-card">
      <p className="eyebrow">
        Flujo de trabajo
      </p>

      <h2>
        Estado de gestión
      </h2>

      <ol>
        {steps.map((step) => (
          <li
            key={step.number}
            className={
              step.state === "done"
                ? "done"
                : step.state === "current"
                  ? "current"
                  : undefined
            }
          >
            <span>{step.number}</span>
            {step.label}
          </li>
        ))}
      </ol>
    </article>
  );
}
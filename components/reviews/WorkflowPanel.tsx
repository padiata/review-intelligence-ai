"use client";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

type WorkflowStep = {
  number: number;
  label: string;
  state?: "done" | "current" | "pending";
};

type Props = {
  steps?: WorkflowStep[];
};

export default function WorkflowPanel({
  steps,
}: Props) {
  const {
    messages,
  } = useLanguage();

  const workflow =
    messages.reviewDetail.workflow;

  const defaultSteps: WorkflowStep[] = [
    {
      number: 1,
      label:
        workflow.steps.captured,
      state: "done",
    },
    {
      number: 2,
      label:
        workflow.steps.analyzed,
      state: "done",
    },
    {
      number: 3,
      label:
        workflow.steps.responseReview,
      state: "current",
    },
    {
      number: 4,
      label:
        workflow.steps.approval,
      state: "pending",
    },
    {
      number: 5,
      label:
        workflow.steps
          .manualPublication,
      state: "pending",
    },
  ];

  const resolvedSteps =
    steps ?? defaultSteps;

  return (
    <article className="panel workflow-card">
      <p className="eyebrow">
        {workflow.eyebrow}
      </p>

      <h2>
        {workflow.title}
      </h2>

      <ol>
        {resolvedSteps.map(
          (step) => (
            <li
              key={step.number}
              className={
                step.state === "done"
                  ? "done"
                  : step.state ===
                      "current"
                    ? "current"
                    : undefined
              }
            >
              <span>
                {step.number}
              </span>

              {step.label}
            </li>
          )
        )}
      </ol>
    </article>
  );
}
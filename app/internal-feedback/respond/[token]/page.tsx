import {
  getInternalFeedbackCaseByToken,
} from "@/lib/reviews/repositories/internal-feedback-access.repository";

import ResponseForm from "./response-form";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InternalFeedbackResponsePage({
  params,
}: PageProps) {
  const { token } = await params;

  const result =
    await getInternalFeedbackCaseByToken(token);

  if (!result) {
    return (
      <main
        style={{
          maxWidth: 720,
          margin: "40px auto",
          padding: 24,
        }}
      >
        <h1>Solicitud no encontrada</h1>

        <p>
          El enlace utilizado no corresponde a una
          solicitud válida.
        </p>
      </main>
    );
  }

  const {
    feedbackCase,
    findings,
  } = result;

  const tokenExpired =
    feedbackCase.token_expires_at &&
    new Date(
      feedbackCase.token_expires_at
    ).getTime() < Date.now();

  if (tokenExpired) {
    return (
      <main
        style={{
          maxWidth: 720,
          margin: "40px auto",
          padding: 24,
        }}
      >
        <h1>Enlace expirado</h1>

        <p>
          Este enlace ya no está disponible.
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Solicitud de información</h1>

      <p>
        <strong>Área:</strong>{" "}
        {feedbackCase.area_code}
      </p>

      <p>
        Se han identificado los siguientes aspectos
        en una reseña de huésped.
      </p>

      <div
        style={{
          marginTop: 24,
        }}
      >
        {findings.map((finding) => (
          <div
            key={finding.id}
            style={{
              marginBottom: 20,
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            {finding.finding_summary && (
              <>
                <strong>Aspecto identificado</strong>

                <p>
                  {finding.finding_summary}
                </p>
              </>
            )}

            {finding.evidence_text && (
              <>
                <strong>Evidencia de la reseña</strong>

                <p>
                  {finding.evidence_text}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      <ResponseForm token={token} />
    </main>
  );
}
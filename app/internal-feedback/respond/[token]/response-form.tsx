"use client";

import { useState } from "react";

type Props = {
  token: string;
};

export default function ResponseForm({
  token,
}: Props) {
  const [responseText, setResponseText] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    const cleanResponse =
      responseText.trim();

    if (!cleanResponse) {
      setError(
        "Escriba sus consideraciones antes de enviar."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/internal-feedback/respond/${token}/response`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            responseText:
              cleanResponse,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo guardar la respuesta."
        );
      }

      setSuccess(true);
      setResponseText("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error desconocido."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          marginTop: 32,
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h2>
          Respuesta registrada
        </h2>

        <p>
          Gracias. Sus consideraciones
          han sido guardadas correctamente.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: "1px solid #ddd",
      }}
    >
      <label
        htmlFor="responseText"
        style={{
          display: "block",
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        Sus consideraciones
      </label>

      <textarea
        id="responseText"
        name="responseText"
        value={responseText}
        onChange={(event) =>
          setResponseText(
            event.target.value
          )
        }
        rows={7}
        placeholder="Describa brevemente qué ocurrió o cualquier información que considere relevante."
        disabled={submitting}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 12,
          fontSize: 16,
          lineHeight: 1.5,
          border: "1px solid #ccc",
          borderRadius: 8,
          resize: "vertical",
        }}
      />

      {error && (
        <p
          style={{
            marginTop: 10,
            color: "crimson",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 16,
          padding: "12px 20px",
          fontSize: 16,
          borderRadius: 8,
          cursor:
            submitting
              ? "not-allowed"
              : "pointer",
        }}
      >
        {submitting
          ? "Enviando..."
          : "Enviar respuesta"}
      </button>
    </form>
  );
}
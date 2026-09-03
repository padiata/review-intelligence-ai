"use client";

import {
  useState,
} from "react";

type Props = {
  token: string;
};

export default function ResponseForm({
  token,
}: Props) {
  const [
    responseText,
    setResponseText,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError(null);

    const clean =
      responseText.trim();

    if (!clean) {
      setError(
        "Escriba sus consideraciones antes de enviar."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          `/api/internal-feedback/respond/${token}/response`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              responseText: clean,
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginTop: 24,
        }}
      >
        <strong>
          Gracias.
        </strong>

        <p>
          Su respuesta ha sido registrada
          correctamente.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 24,
      }}
    >
      <label
        htmlFor="responseText"
        style={{
          display: "block",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        Sus consideraciones
      </label>

      <textarea
        id="responseText"
        value={responseText}
        onChange={(event) =>
          setResponseText(
            event.target.value
          )
        }
        rows={7}
        placeholder="Describa brevemente qué ocurrió o cualquier información que considere relevante."
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          boxSizing: "border-box",
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      {error && (
        <p
          style={{
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
          marginTop: 12,
          padding: "12px 20px",
          fontSize: 16,
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
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "No se pudo identificar al usuario."
        );
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("user_profiles")
          .select("id, role, active, entity_id")
          .eq("id", data.user.id)
          .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        throw new Error(
          "El usuario no tiene un perfil configurado."
        );
      }

      if (!profile.active) {
        await supabase.auth.signOut();

        throw new Error(
          "Este usuario está desactivado."
        );
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">RI</div>

          <div>
            <strong>Review Intelligence</strong>
            <span>Lab</span>
          </div>
        </div>

        <div className="login-heading">
          <p className="eyebrow">
            Acceso a la plataforma
          </p>

          <h1>Iniciar sesión</h1>

          <p>
            Introduce tus credenciales para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              autoComplete="email"
              required
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="usuario@hotel.com"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              required
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
            />
          </label>

          {errorMessage && (
            <p role="alert" className="login-error">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
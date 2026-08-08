import Link from "next/link";

import PageHeader from "@/components/layout/PageHeader";

export default function DashboardHomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Inicio"
        title="Panel principal"
        description="Seleccione una de las áreas del sistema para comenzar."
      />

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "18px",
          marginTop: "24px",
        }}
      >
        <Link
          href="/capture"
          style={{
            display: "block",
            padding: "22px",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#ffffff",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            Operación
          </p>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "20px",
            }}
          >
            Captura
          </h2>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.6,
            }}
          >
            Descargue e importe nuevas reviews desde
            las fuentes configuradas.
          </p>
        </Link>

        <Link
          href="/reviews"
          style={{
            display: "block",
            padding: "22px",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#ffffff",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            Gestión
          </p>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "20px",
            }}
          >
            Reviews
          </h2>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.6,
            }}
          >
            Revise las opiniones recibidas, analice su
            contenido y gestione las respuestas.
          </p>
        </Link>

        <Link
          href="/reports"
          style={{
            display: "block",
            padding: "22px",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#ffffff",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            Inteligencia
          </p>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "20px",
            }}
          >
            Informes
          </h2>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.6,
            }}
          >
            Genere informes ejecutivos a partir de los
            hallazgos del período seleccionado.
          </p>
        </Link>

        <Link
          href="/admin/users"
          style={{
            display: "block",
            padding: "22px",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#ffffff",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            Administración
          </p>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "20px",
            }}
          >
            Usuarios
          </h2>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.6,
            }}
          >
            Gestione usuarios, roles y accesos del
            sistema.
          </p>
        </Link>
      </section>
    </>
  );
}
"use client";

import Link from "next/link";

import PageHeader from "@/components/layout/PageHeader";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

export default function DashboardHomePage() {
  const {
    messages,
  } = useLanguage();

  const home =
    messages.home;

  return (
    <>
      <PageHeader
        eyebrow={
          home.eyebrow
        }
        title={
          home.title
        }
        description={
          home.description
        }
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
            border:
              "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#ffffff",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          <p
            style={{
              margin:
                "0 0 8px",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              textTransform:
                "uppercase",
              letterSpacing:
                ".08em",
            }}
          >
            {
              home.capture
                .category
            }
          </p>

          <h2
            style={{
              margin:
                "0 0 10px",
              fontSize: "20px",
            }}
          >
            {
              home.capture
                .title
            }
          </h2>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.6,
            }}
          >
            {
              home.capture
                .description
            }
          </p>
        </Link>

        <Link
          href="/reviews"
          style={{
            display: "block",
            padding: "22px",
            border:
              "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#ffffff",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          <p
            style={{
              margin:
                "0 0 8px",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              textTransform:
                "uppercase",
              letterSpacing:
                ".08em",
            }}
          >
            {
              home.reviews
                .category
            }
          </p>

          <h2
            style={{
              margin:
                "0 0 10px",
              fontSize: "20px",
            }}
          >
            {
              home.reviews
                .title
            }
          </h2>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.6,
            }}
          >
            {
              home.reviews
                .description
            }
          </p>
        </Link>

        <Link
          href="/reports"
          style={{
            display: "block",
            padding: "22px",
            border:
              "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#ffffff",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          <p
            style={{
              margin:
                "0 0 8px",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              textTransform:
                "uppercase",
              letterSpacing:
                ".08em",
            }}
          >
            {
              home.reports
                .category
            }
          </p>

          <h2
            style={{
              margin:
                "0 0 10px",
              fontSize: "20px",
            }}
          >
            {
              home.reports
                .title
            }
          </h2>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.6,
            }}
          >
            {
              home.reports
                .description
            }
          </p>
        </Link>

        <Link
          href="/admin/users"
          style={{
            display: "block",
            padding: "22px",
            border:
              "1px solid #e5e7eb",
            borderRadius: "16px",
            background: "#ffffff",
            color: "#111827",
            textDecoration: "none",
          }}
        >
          <p
            style={{
              margin:
                "0 0 8px",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              textTransform:
                "uppercase",
              letterSpacing:
                ".08em",
            }}
          >
            {
              home.users
                .category
            }
          </p>

          <h2
            style={{
              margin:
                "0 0 10px",
              fontSize: "20px",
            }}
          >
            {
              home.users
                .title
            }
          </h2>

          <p
            style={{
              margin: 0,
              color: "#667085",
              lineHeight: 1.6,
            }}
          >
            {
              home.users
                .description
            }
          </p>
        </Link>
      </section>
    </>
  );
}
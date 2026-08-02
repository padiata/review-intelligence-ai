"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";



type ReviewSource = {
  id: number;
  source_code: string;
  source_name: string;
  description: string | null;
  active: boolean;
};

type SourceSelectProps = {
  value: number | "";
  onChange: (sourceId: number | "") => void;
};

export default function SourceSelect({
  value,
  onChange,
}: SourceSelectProps) {
  const [sources, setSources] = useState<ReviewSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSources() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("review_sources")
        .select(
          "id, source_code, source_name, description, active"
        )
        .eq("active", true)
        .order("source_name", { ascending: true });

      if (error) {
        console.error("Error cargando las fuentes:", error);

        setErrorMessage(
          `No se pudieron cargar las fuentes: ${error.message}`
        );

        setSources([]);
        setLoading(false);
        return;
      }

      setSources(data ?? []);
      setLoading(false);
    }

    loadSources();
  }, []);

  return (
    <div className="space-y-2">
      <label
        htmlFor="review-source"
        className="block text-sm font-medium text-slate-700"
      >
        Fuente de la review
      </label>

      <select
        id="review-source"
        value={value}
        disabled={loading}
        onChange={(event) => {
          const selectedValue = event.target.value;

          onChange(
            selectedValue === ""
              ? ""
              : Number(selectedValue)
          );
        }}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">
          {loading
            ? "Cargando fuentes..."
            : "Seleccione una fuente"}
        </option>

        {sources.map((source) => (
          <option key={source.id} value={source.id}>
            {source.source_name}
          </option>
        ))}
      </select>

      {errorMessage && (
        <p className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
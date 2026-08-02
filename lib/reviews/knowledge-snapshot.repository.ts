import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getTaxonomyMetadata(
  dimension: "AREA" | "CAUSE" | "SUBCAUSE",
  taxonomyCode: string
) {
  if (dimension === "AREA") {
    const { data, error } = await supabase
      .from("areas_catalog")
      .select("area_name, cod_numerico")
      .eq("area_code", taxonomyCode)
      .single();

    if (error) throw error;

    return {
      name: data.area_name,
      numericCode: data.cod_numerico,
    };
  }

  if (dimension === "CAUSE") {
    const { data, error } = await supabase
      .from("causes_catalog")
      .select("cause_name, cod_numerico")
      .eq("cause_code", taxonomyCode)
      .single();

    if (error) throw error;

    return {
      name: data.cause_name,
      numericCode: data.cod_numerico,
    };
  }

  const { data, error } = await supabase
    .from("subcauses_catalog")
    .select("subcause_name, cod_numerico")
    .eq("subcause_code", taxonomyCode)
    .single();

  if (error) throw error;

  return {
    name: data.subcause_name,
    numericCode: data.cod_numerico,
  };
}

export async function saveKnowledgeSnapshotRows(rows: any[]) {
  if (rows.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("review_knowledge_snapshot")
    .upsert(rows, {
      onConflict:
        "entity_id,source_id,period_type,period_start,period_end,dimension,taxonomy_code,snapshot_version",
    })
    .select();

  if (error) throw error;

  return data ?? [];
}
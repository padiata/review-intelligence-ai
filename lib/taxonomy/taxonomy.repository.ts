import "server-only";

import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function getTaxonomyByDomain(domainId: number) {
  const { data: areas, error: areasError } = await supabase
    .from("areas_catalog")
    .select("area_code, area_name, description, cod_numerico")
    .eq("domain_id", domainId)
    .eq("active", true)
    .order("cod_numerico", { ascending: true });

  if (areasError) {
    throw areasError;
  }

  const areaCodes = (areas ?? []).map(
    (area) => area.area_code
  );

  const { data: causes, error: causesError } =
    await supabase
      .from("causes_catalog")
      .select(
        "cause_code, area_code, cause_name, description, cod_numerico"
      )
      .in("area_code", areaCodes)
      .eq("active", true)
      .order("cod_numerico", {
        ascending: true,
      });

  if (causesError) {
    throw causesError;
  }

  const causeCodes = (causes ?? []).map(
    (cause) => cause.cause_code
  );

  const {
    data: subcauses,
    error: subcausesError,
  } = await supabase
    .from("subcauses_catalog")
    .select(
      "subcause_code, cause_code, subcause_name, description, cod_numerico"
    )
    .in("cause_code", causeCodes)
    .eq("active", true)
    .order("cod_numerico", {
      ascending: true,
    });

  if (subcausesError) {
    throw subcausesError;
  }

  return {
    areas: areas ?? [],
    causes: causes ?? [],
    subcauses: subcauses ?? [],
  };
}
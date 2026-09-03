import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabase/admin";

export async function GET() {
  try {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("business_domains")
      .select(`
        id,
        domain_code,
        domain_name,
        description
      `)
      .eq("active", true)
      .order("domain_name", {
        ascending: true,
      });

    if (error) {
      throw new Error(
        error.message
      );
    }

    const domains =
      (data ?? []).map(
        (domain) => ({
          id: domain.id,
          domainCode:
            domain.domain_code,
          domainName:
            domain.domain_name,
          description:
            domain.description,
        })
      );

    return NextResponse.json({
      domains,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los dominios.",
      },
      {
        status: 500,
      }
    );
  }
}

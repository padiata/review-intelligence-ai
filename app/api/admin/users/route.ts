import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
type UserRole =
  | "super_admin"
  | "hotel_admin"
  | "manager"
  | "operator";

const allowedRoles: UserRole[] = [
  "super_admin",
  "hotel_admin",
  "manager",
  "operator",
];

async function requireSuperAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado.", status: 401 as const };
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("role, active")
    .eq("id", user.id)
    .single();

  if (
    error ||
    !profile ||
    !profile.active ||
    profile.role !== "super_admin"
  ) {
    return { error: "Acceso denegado.", status: 403 as const };
  }

  return { user };
}

export async function GET() {
  const authorization = await requireSuperAdmin();

  if ("error" in authorization) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status }
    );
  }

  try {
    const admin = createAdminClient();

    const {
      data: { users },
      error: authError,
    } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authError) {
      throw authError;
    }

    const { data: profiles, error: profileError } = await admin
      .from("user_profiles")
      .select(
        "id, entity_id, full_name, role, active, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (profileError) {
      throw profileError;
    }

    const authUsersById = new Map(
      users.map((user) => [user.id, user])
    );

    const result = (profiles ?? []).map((profile) => {
      const authUser = authUsersById.get(profile.id);

      return {
        ...profile,
        email: authUser?.email ?? "",
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
      };
    });

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("Error cargando usuarios:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los usuarios.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authorization = await requireSuperAdmin();

  if ("error" in authorization) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status }
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      full_name?: string;
      role?: UserRole;
      entity_id?: number | null;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const fullName = body.full_name?.trim();
    const role = body.role ?? "operator";
    const entityId =
      typeof body.entity_id === "number"
        ? body.entity_id
        : null;

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "El correo y el nombre son obligatorios." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "La contraseña temporal debe tener al menos 8 caracteres.",
        },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "El rol seleccionado no es válido." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (createError || !created.user) {
      throw createError ?? new Error("No se creó el usuario.");
    }

    const { error: profileError } = await admin
      .from("user_profiles")
      .insert({
        id: created.user.id,
        entity_id: entityId,
        full_name: fullName,
        role,
        active: true,
      });

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw profileError;
    }

    return NextResponse.json(
      {
        user: {
          id: created.user.id,
          email,
          full_name: fullName,
          role,
          entity_id: entityId,
          active: true,
          created_at: created.user.created_at,
          last_sign_in_at: null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando usuario:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el usuario.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authorization = await requireSuperAdmin();

  if ("error" in authorization) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status }
    );
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      full_name?: string;
      role?: UserRole;
      entity_id?: number | null;
      active?: boolean;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Falta el identificador del usuario." },
        { status: 400 }
      );
    }

    if (body.role && !allowedRoles.includes(body.role)) {
      return NextResponse.json(
        { error: "El rol seleccionado no es válido." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.full_name === "string") {
      updates.full_name = body.full_name.trim();
    }

    if (body.role) {
      updates.role = body.role;
    }

    if (
      typeof body.entity_id === "number" ||
      body.entity_id === null
    ) {
      updates.entity_id = body.entity_id;
    }

    if (typeof body.active === "boolean") {
      updates.active = body.active;
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("user_profiles")
      .update(updates)
      .eq("id", body.id)
      .select(
        "id, entity_id, full_name, role, active, created_at, updated_at"
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Error actualizando usuario:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el usuario.",
      },
      { status: 500 }
    );
  }
}

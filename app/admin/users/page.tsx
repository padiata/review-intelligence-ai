"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type UserRole =
  | "super_admin"
  | "hotel_admin"
  | "manager"
  | "operator";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  entity_id: number | null;
  active: boolean;
  created_at: string;
  updated_at?: string;
  last_sign_in_at: string | null;
};

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super administrador",
  hotel_admin: "Administrador de hotel",
  manager: "Manager",
  operator: "Operador",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Nunca";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("operator");
  const [entityId, setEntityId] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const data = (await response.json()) as {
        users?: AdminUser[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar los usuarios.");
      }

      setUsers(data.users ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los usuarios."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [
        user.full_name,
        user.email,
        roleLabels[user.role],
        user.entity_id?.toString() ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [search, users]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          entity_id: entityId ? Number(entityId) : null,
        }),
      });

      const data = (await response.json()) as {
        user?: AdminUser;
        error?: string;
      };

      if (!response.ok || !data.user) {
        throw new Error(data.error || "No se pudo crear el usuario.");
      }

      setUsers((current) => [data.user as AdminUser, ...current]);
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("operator");
      setEntityId("");
      setShowForm(false);
      setSuccess("Usuario creado correctamente.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear el usuario."
      );
    }
  }

  async function updateUser(
    id: string,
    updates: Partial<Pick<AdminUser, "role" | "active" | "entity_id">>
  ) {
    setSavingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...updates }),
      });

      const data = (await response.json()) as {
        user?: Partial<AdminUser>;
        error?: string;
      };

      if (!response.ok || !data.user) {
        throw new Error(data.error || "No se pudo actualizar el usuario.");
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === id ? { ...user, ...data.user } : user
        )
      );

      setSuccess("Usuario actualizado.");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar el usuario."
      );
    } finally {
      setSavingId("");
    }
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <p>Administración</p>
          <h1>Usuarios</h1>
          <span>
            Crea usuarios, asigna roles y controla el acceso a la plataforma.
          </span>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setShowForm((current) => !current)}
        >
          {showForm ? "Cerrar formulario" : "+ Nuevo usuario"}
        </button>
      </header>

      {showForm && (
        <section className="admin-card admin-create-card">
          <div>
            <h2>Nuevo usuario</h2>
            <p>La contraseña es temporal y puede cambiarse después.</p>
          </div>

          <form className="admin-user-form" onSubmit={createUser}>
            <label>
              Nombre completo
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>

            <label>
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Contraseña temporal
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            <label>
              Rol
              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as UserRole)
                }
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              ID del hotel
              <input
                type="number"
                min="1"
                value={entityId}
                onChange={(event) => setEntityId(event.target.value)}
                placeholder="Vacío para super admin"
              />
            </label>

            <button type="submit" className="admin-primary-button">
              Crear usuario
            </button>
          </form>
        </section>
      )}

      {(error || success) && (
        <div
          className={
            error ? "admin-message admin-error" : "admin-message admin-success"
          }
          role={error ? "alert" : "status"}
        >
          {error || success}
        </div>
      )}

      <section className="admin-card">
        <div className="admin-table-toolbar">
          <div>
            <h2>Usuarios registrados</h2>
            <span>
              {loading ? "Cargando..." : `${filteredUsers.length} usuarios`}
            </span>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
          />
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Hotel</th>
                <th>Último acceso</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}

              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.full_name}</strong>
                    <span>{user.email}</span>
                  </td>

                  <td>
                    <select
                      value={user.role}
                      disabled={savingId === user.id}
                      onChange={(event) =>
                        void updateUser(user.id, {
                          role: event.target.value as UserRole,
                        })
                      }
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    {user.entity_id ? `Hotel #${user.entity_id}` : "Global"}
                  </td>

                  <td>{formatDate(user.last_sign_in_at)}</td>

                  <td>
                    <button
                      type="button"
                      className={
                        user.active
                          ? "admin-status active"
                          : "admin-status inactive"
                      }
                      disabled={savingId === user.id}
                      onClick={() =>
                        void updateUser(user.id, {
                          active: !user.active,
                        })
                      }
                    >
                      {savingId === user.id
                        ? "Guardando..."
                        : user.active
                          ? "Activo"
                          : "Inactivo"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

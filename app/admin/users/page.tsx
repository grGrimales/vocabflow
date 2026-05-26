"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  created_at: string;
  created_by_name?: string;
}

interface NewUserForm {
  email: string;
  name: string;
  password: string;
  role: "user" | "admin";
}

const emptyForm: NewUserForm = { email: "", name: "", password: "", role: "user" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<NewUserForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const set = (k: keyof NewUserForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      setFormSuccess(`Usuario "${data.user.name}" creado correctamente.`);
      setForm(emptyForm);
      fetchUsers();
    } else {
      setFormError(data.error ?? "Error al crear el usuario");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de usuarios</h1>
        <p className="text-gray-500 mt-1">Crea y administra las cuentas de los estudiantes</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Create user form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Crear nuevo usuario</h2>

          {formError && (
            <div className="bg-rose-50 text-rose-700 text-sm px-4 py-2.5 rounded-xl border border-rose-200">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-2.5 rounded-xl border border-emerald-200">
              ✓ {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                required
                placeholder="Nombre completo"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="usuario@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña temporal
              </label>
              <input
                type="text"
                value={form.password}
                onChange={set("password")}
                required
                placeholder="Mínimo 8 caracteres"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-mono transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">
                Muéstrale esta contraseña al usuario para que inicie sesión.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                value={form.role}
                onChange={set("role")}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 bg-white transition-colors"
              >
                <option value="user">Usuario — solo puede estudiar</option>
                <option value="admin">Admin — puede crear usuarios</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Creando..." : "Crear usuario"}
            </button>
          </form>
        </div>

        {/* User list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Usuarios registrados</h2>
            <span className="text-sm text-gray-400">{users.length} en total</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No hay usuarios todavía</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 shrink-0">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">{u.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    {u.created_by_name && (
                      <p className="text-xs text-gray-300">Creado por {u.created_by_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    disabled={deletingId === u.id}
                    className="text-xs text-gray-300 hover:text-rose-500 transition-colors px-2 py-1 rounded hover:bg-rose-50 disabled:opacity-40"
                  >
                    {deletingId === u.id ? "..." : "Eliminar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

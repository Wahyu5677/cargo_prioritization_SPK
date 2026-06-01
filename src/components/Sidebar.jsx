import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: "📊",
    end: true
  },
  {
    to: "/criteria",
    label: "Criteria",
    icon: "⚖️"
  },
  {
    to: "/cargo",
    label: "Cargo Management",
    icon: "📦"
  },
  {
    to: "/schedule",
    label: "Process & Schedule",
    icon: "🚚"
  }
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, authActionLoading } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    const result = await logout();

    if (result.success) {
      navigate("/login", { replace: true });
    } else {
      alert(result.message);
    }
  }

  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
      isActive
        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    ].join(" ");

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50/60">
      <header className="sticky left-0 right-0 top-0 z-40 w-full max-w-full border-b border-white/70 bg-white/90 px-3 py-3 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xl shadow-sm"
            aria-label="Open navigation"
          >
            ☰
          </button>

          <div className="text-center">
            <p className="text-sm font-black text-slate-950">Cargo SPK</p>
            <p className="text-[11px] font-semibold text-slate-500">
              Weighted Product
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={authActionLoading}
            className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative h-full w-80 max-w-[85vw] bg-white p-4 shadow-2xl">
            <SidebarContent
              user={user}
              linkClass={linkClass}
              onLogout={handleLogout}
              logoutLoading={authActionLoading}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur lg:block">
        <SidebarContent
          user={user}
          linkClass={linkClass}
          onLogout={handleLogout}
          logoutLoading={authActionLoading}
          onNavigate={() => {}}
        />
      </aside>

      <main className="w-full max-w-full overflow-x-hidden px-3 py-5 sm:px-6 lg:ml-72 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function SidebarContent({
  user,
  linkClass,
  onLogout,
  logoutLoading,
  onNavigate
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-600/20">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
          🚢
        </div>
        <h1 className="text-xl font-black leading-tight">
          Cargo Delivery Priority
        </h1>
        <p className="mt-2 text-sm leading-6 text-blue-100">
          SPK using Weighted Product method.
        </p>
      </div>

      <nav className="mt-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={linkClass}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Signed in as
        </p>
        <p className="mt-1 truncate text-sm font-bold text-slate-800">
          {user?.email || "Authenticated User"}
        </p>

        <button
          type="button"
          onClick={onLogout}
          disabled={logoutLoading}
          className="mt-4 w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:bg-red-300"
        >
          {logoutLoading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
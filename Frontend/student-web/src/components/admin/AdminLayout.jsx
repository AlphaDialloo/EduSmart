import {
  BookOpen,
  CreditCard,
  LayoutDashboard,
  FolderTree,
  LogOut,
  Menu,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router";

import { useAuth } from "../../contexts/AuthContext";

const items = [
  {
    to: "/admin",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/admin/users",
    label: "Utilisateurs",
    icon: UsersRound,
  },
  {
    to: "/admin/courses",
    label: "Cours",
    icon: BookOpen,
  },
  {
    label: "Catégories",
    to: "/admin/categories",
    icon: FolderTree,
  },
  {
    to: "/admin/payments",
    label: "Paiements",
    icon: CreditCard,
  },
];

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-6 py-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400">
          EduSmart
        </p>

        <h1 className="mt-2 text-2xl font-black text-white">
          Administration
        </h1>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            style={({ isActive }) => ({
              color: isActive ? "#ffffff" : "#cbd5e1",
              backgroundColor: isActive
                ? "#4f46e5"
                : "transparent",
            })}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition hover:bg-slate-800"
          >
            <Icon size={20} />

            <span>{item.label}</span>
          </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-2xl bg-slate-800 p-4">
          <p className="truncate font-black text-white">
            {user?.firstName || user?.email || "Administrateur"}
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
            {user?.role || "ADMIN"}
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/10"
        >
          <LogOut size={19} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-slate-950 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/55"
          />

          <aside className="relative h-full w-72 bg-slate-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-xl bg-slate-800 p-2 text-white"
            >
              <X size={20} />
            </button>

            <SidebarContent
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/95 px-5 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-700 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <p className="ml-3 text-sm font-black text-slate-500 lg:ml-0">
            Panneau d’administration EduSmart
          </p>
        </header>

        <Outlet />
      </div>
    </div>
  );
}

import { BookOpen, ChevronDown, LayoutDashboard, LogOut, Menu, PlusCircle, Search, ShoppingCart, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
function getDashboardPath(role) {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "INSTRUCTOR":
      return "/instructor/dashboard";
    case "STUDENT":
    default:
      return "/student/dashboard";
  }
}
function getCoursesPath(role) {
  switch (role) {
    case "INSTRUCTOR":
      return "/instructor/courses";
    case "ADMIN":
      return "/admin/courses";
    case "STUDENT":
    default:
      return "/student/courses";
  }
}
function Navbar() {
  const navigate = useNavigate();
  const {
    itemCount
  } = useCart();
  const {
    user,
    isAuthenticated,
    logout
  } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const getNavLinkClass = ({
    isActive
  }) => `text-sm font-semibold transition ${isActive ? "text-emerald-600" : "text-slate-600 hover:text-emerald-600"}`;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase();
  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate("/", {
      replace: true
    });
  };
  useEffect(() => {
    const handleOutsideClick = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);
  return <header className="sticky top-0 z-50 border-b border-emerald-100/80 bg-[#fffdf9]/90 shadow-[0_8px_30px_rgb(41_37_36/0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-5 px-5 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
            <BookOpen size={22} />
          </div>

          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">
              EduSmart
            </p>

            <p className="text-[11px] font-medium text-slate-500">
              Apprendre autrement
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <NavLink to="/" end className={getNavLinkClass}>
            Accueil
          </NavLink>

          <NavLink to="/courses" className={getNavLinkClass}>
            Explorer
          </NavLink>

          {isAuthenticated && user?.role === "STUDENT" && <>
              <NavLink to="/student/courses" className={getNavLinkClass}>
                Mes cours
              </NavLink>

              <NavLink to="/student/dashboard" className={getNavLinkClass}>
                Dashboard
              </NavLink>
            </>}

          {isAuthenticated && user?.role === "INSTRUCTOR" && <>
                <NavLink to="/instructor/courses" className={getNavLinkClass}>
                  Mes cours
                </NavLink>

                <NavLink to="/instructor/dashboard" className={getNavLinkClass}>
                  Dashboard
                </NavLink>
              </>}

          {isAuthenticated && user?.role === "ADMIN" && <NavLink to="/admin/dashboard" className={getNavLinkClass}>
              Administration
            </NavLink>}
        </nav>

        <div className="hidden max-w-sm flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 xl:flex">
          <Search size={18} className="shrink-0 text-slate-400" />

          <input type="search" placeholder="Rechercher un cours..." className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link to="/cart" aria-label={`Ouvrir le panier, ${itemCount} article${itemCount > 1 ? "s" : ""}`} className="relative flex size-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600">
            <ShoppingCart size={21} />

            {itemCount > 0 && <span className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>}
          </Link>

          {!isAuthenticated ? <>
              <Link to="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:block">
                Connexion
              </Link>

              <Link to="/register" className="hidden rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 sm:block">
                S’inscrire
              </Link>
            </> : <div ref={menuRef} className="relative">
              <button type="button" onClick={() => setIsUserMenuOpen(value => !value)} className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-slate-100">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
                  {initials || <UserRound size={19} />}
                </span>

                <div className="hidden max-w-36 text-left sm:block">
                  <p className="truncate text-sm font-black text-slate-900">
                    {fullName || "Utilisateur EduSmart"}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {user?.role}
                  </p>
                </div>

                <ChevronDown size={17} className={`hidden text-slate-400 transition sm:block ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isUserMenuOpen && <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
                  <div className="border-b border-slate-100 p-4">
                    <p className="font-black text-slate-950">
                      {fullName || "Utilisateur EduSmart"}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {user?.email}
                    </p>
                  </div>

                  <div className="p-2">
                    <Link to={getDashboardPath(user?.role)} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
                      <LayoutDashboard size={18} />
                      Dashboard
                    </Link>

                    <Link to={getCoursesPath(user?.role)} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
                      <BookOpen size={18} />
                      {user?.role === "STUDENT" ? "Mes cours" : "Gérer les cours"}
                    </Link>

                    {user?.role === "INSTRUCTOR" && <Link to="/instructor/courses/create" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
                        <PlusCircle size={18} />
                        Créer un cours
                      </Link>}
                  </div>

                  <div className="border-t border-slate-100 p-2">
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50">
                      <LogOut size={18} />
                      Déconnexion
                    </button>
                  </div>
                </div>}
            </div>}

          <button type="button" aria-label="Ouvrir le menu" className="flex size-11 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 lg:hidden">
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>;
}
export default Navbar;

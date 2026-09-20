import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Target,
  Timer,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { SkipLink } from "../components/SkipLink";
import { useToast } from "../components/ToastProvider";
import { usingDemoData } from "../services/serviceFactory";
import { useAuth } from "../state/AuthProvider";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/sessions", label: "Study Sessions", icon: Timer },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/progress", label: "Progress", icon: BarChart3 },
];

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { notifyError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeNav = useCallback(() => {
    setNavOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Choosing a destination on mobile should not leave the drawer covering it.
  useEffect(() => setNavOpen(false), [location.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeNav();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen, closeNav]);

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      notifyError("Sign out failed", "Check your connection and try again.");
    }
  }

  const initials = (user?.displayName ?? "S")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`app-shell${navOpen ? " app-shell--nav-open" : ""}`}>
      <SkipLink />

      <header className="app-topbar">
        <button
          type="button"
          className="icon-button icon-button--light"
          aria-label={navOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={navOpen}
          aria-controls="main-navigation"
          onClick={() => (navOpen ? closeNav() : setNavOpen(true))}
          ref={menuButtonRef}
        >
          {navOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Brand compact />
        <span className="avatar" aria-hidden="true">
          {initials}
        </span>
      </header>

      {navOpen ? <div className="nav-scrim" onClick={closeNav} aria-hidden="true" /> : null}

      <nav className="app-sidebar" id="main-navigation" aria-label="Main">
        <div className="app-sidebar__brand">
          <Brand compact />
        </div>
        <ul className="app-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `app-nav__link${isActive ? " app-nav__link--active" : ""}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="app-sidebar__footer">
          {usingDemoData ? <p className="demo-badge">Demo mode — data stays in this browser</p> : null}
          <div className="app-sidebar__user">
            <span className="avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="app-sidebar__identity">
              <strong>{user?.displayName}</strong>
              <span>{user?.email}</span>
            </span>
          </div>
          <button type="button" className="button button--ghost button--full" onClick={handleSignOut}>
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </nav>

      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}

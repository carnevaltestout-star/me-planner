import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navItems } from "@/routes/nav-items";
import { MenuIcon, SettingsIcon } from "@/components/tab-icons/tab-icons";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Tabs">
      {navItems.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
              isActive
                ? "bg-emerald-50 font-semibold text-emerald-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
        >
          <Icon className="h-[19px] w-[19px] flex-shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function BrandMark() {
  return (
    <div className="flex items-baseline gap-1.5 px-2">
      <span className="text-base font-bold">Me</span>
      <span className="text-xs text-slate-500">planner</span>
    </div>
  );
}

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const currentLabel = navItems.find((item) => item.path === location.pathname)?.label ?? "";

  return (
    <div className="flex h-screen bg-white text-slate-900">
      <aside className="hidden w-60 flex-shrink-0 flex-col gap-5 border-r border-slate-200 p-3 md:flex">
        <BrandMark />
        <NavList />
        <div className="mt-auto flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-500">
          <SettingsIcon className="h-[17px] w-[17px]" />
          <span>
            Settings &amp; theme{" "}
            <span className="ml-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10px] uppercase tracking-wide">
              later task
            </span>
          </span>
        </div>
      </aside>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex w-[76%] max-w-[280px] flex-col gap-5 border-r border-slate-200 bg-white p-3 transition-transform duration-200 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <BrandMark />
        <NavList onNavigate={() => setDrawerOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-slate-200 px-4 py-3">
          <button
            type="button"
            className="-m-1 p-1 text-slate-700 md:hidden"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon className="h-[19px] w-[19px]" />
          </button>
          <h1 className="flex-1 text-center text-sm font-semibold md:text-left">{currentLabel}</h1>
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Settings and theme"
          >
            <SettingsIcon className="h-[19px] w-[19px]" />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

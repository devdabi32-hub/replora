import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Inbox, LayoutDashboard, Users, MessageCircle } from "lucide-react";

const nav = [
  { to: "/", label: "Inbox", icon: Inbox },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
];

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full bg-white text-slate-900">
      <aside className="hidden md:flex w-60 flex-col bg-[#1a1f2e] text-slate-200">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/5">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/90 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">WA Agent</div>
            <div className="text-[11px] text-slate-400">Monitoring Portal</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-[11px] text-slate-500 border-t border-white/5">
          v1.0 · Live
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#1a1f2e] text-slate-300 flex justify-around py-2 border-t border-white/10">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={`flex flex-col items-center text-[11px] px-3 py-1 ${active ? "text-white" : ""}`}>
              <Icon className="h-5 w-5" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
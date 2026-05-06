import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox, LayoutDashboard, Users, MessageCircle, Settings, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

const nav = [
  { to: "/", label: "Inbox", icon: Inbox, key: "inbox" },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/contacts", label: "Contacts", icon: Users, key: "contacts" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [inboxCount, setInboxCount] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from("messages")
        .select("phone_number", { count: "exact", head: true })
        .eq("direction", "inbound");
      setInboxCount(count ?? 0);
    };
    load();
    const ch = supabase
      .channel("layout-msgs")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] text-slate-900">
      <aside className="hidden md:flex w-64 flex-col bg-[#0f1117] text-slate-200 fixed inset-y-0 left-0 z-20">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00c853] border-2 border-[#0f1117]" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-white leading-tight tracking-tight">WA Monitor</div>
            <div className="text-[11px] text-slate-500 mt-0.5">AI Agent Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Main</div>
          {nav.map((n) => {
            const Icon = n.icon;
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-[#0084ff] text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{n.label}</span>
                {n.key === "inbox" && inboxCount > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    active ? "bg-white/20 text-white" : "bg-[#0084ff] text-white"
                  }`}>
                    {inboxCount > 99 ? "99+" : inboxCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="px-3 pt-6 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">System</div>
          <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/[0.04] hover:text-white transition-all">
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </button>
        </nav>

        {/* Profile */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                A
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00c853] border-2 border-[#0f1117]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">Admin</div>
              <div className="text-[11px] text-slate-500 truncate">admin@wamonitor.io</div>
            </div>
            <LogOut className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0f1117] text-slate-300 flex justify-around py-2 border-t border-white/10">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={`flex flex-col items-center text-[11px] px-3 py-1 ${active ? "text-[#0084ff]" : ""}`}>
              <Icon className="h-5 w-5" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 min-w-0 pb-16 md:pb-0 md:ml-64">
        {children}
      </main>
    </div>
  );
}

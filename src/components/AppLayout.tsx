import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox, LayoutDashboard, Users, MessageCircle, Settings, LogOut, Code2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const nav = [
  { to: "/inbox", label: "Inbox", icon: Inbox, key: "inbox" },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/contacts", label: "Contacts", icon: Users, key: "contacts" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
      } else {
        setUserEmail(data.session.user.email ?? "admin@wamonitor.io");
        setAuthChecked(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
      else setUserEmail(session.user.email ?? "");
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

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

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white/60 text-sm">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-black text-white">
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
            <div className="text-[15px] font-semibold text-white leading-tight tracking-tight">Chatora</div>
            <div className="text-[11px] text-white/60 mt-0.5">Your AI talks. You watch.</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">Main</div>
          {nav.map((n) => {
            const Icon = n.icon;
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-[#0084ff] text-white shadow-md shadow-blue-500/20"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
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

          <div className="px-3 pt-6 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">System</div>
          <Link
            to="/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              pathname.startsWith("/settings")
                ? "bg-[#0084ff] text-white shadow-md shadow-blue-500/20"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </Link>
          <Link
            to="/api-docs"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              pathname.startsWith("/api-docs")
                ? "bg-[#0084ff] text-white shadow-md shadow-blue-500/20"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <Code2 className="h-[18px] w-[18px]" />
            API Docs
          </Link>
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
              <div className="text-[11px] text-white/60 truncate">{userEmail}</div>
            </div>
            <button onClick={signOut} title="Sign out" className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0f1117] text-slate-300 flex justify-around py-2 border-t border-white/10">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = pathname.startsWith(n.to);
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

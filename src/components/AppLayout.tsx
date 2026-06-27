import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Inbox, Users, BookOpen, Plug,
  Headphones, LogOut, Trash2, Tag,
  Settings as SettingsIcon, UserPlus, FileDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LogoMark } from "@/components/Logo";
import { UpgradeProvider } from "@/components/UpgradeModal";
import { TrialBanner } from "@/components/TrialBanner";
import { PlanBadge } from "@/components/PlanBadge";
import { PhoneProvider } from "@/contexts/PhoneContext";
import { NumberSwitcher } from "@/components/NumberSwitcher";
import { useAccountStatus } from "@/hooks/useAccountStatus";

const SUPPORT_MAILTO =
  "mailto:care@replora.in?subject=Replora%20Support%20Request&body=Hi%20Replora%20Support%20Team%2C%20I%20need%20help%20with...";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; badgeKey?: "inbox" };
const baseNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", icon: Inbox, badgeKey: "inbox" },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/api-docs", label: "API Docs", icon: BookOpen },
  { to: "/connections", label: "Connections", icon: Plug },
];
const pricingNavItem: NavItem = { to: "/pricing", label: "Pricing", icon: Tag };

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { plan } = useAccountStatus();
  const [inboxCount, setInboxCount] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login" });
      else {
        setUserEmail(data.session.user.email ?? "admin@replora.in");
        setAuthChecked(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
      else setUserEmail(session.user.email ?? "");
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from("messages")
        .select("phone_number", { count: "exact", head: true })
        .eq("direction", "inbound")
        .eq("is_read", false);
      setInboxCount(count ?? 0);
    };
    load();
    const ch = supabase
      .channel("layout-msgs")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const inviteTeam = () => {
    window.location.href = "mailto:?subject=Join%20me%20on%20Replora&body=Hey%2C%20I%27m%20using%20Replora%20to%20monitor%20my%20WhatsApp%20AI%20agent.%20Join%20me%20at%20https%3A%2F%2Freplora.in";
  };

  const downloadPdf = () => {
    window.print();
  };

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white/60 text-sm">Loading…</div>;
  }

  const initial = (userEmail[0] || "A").toUpperCase();
  const hidePricing = plan === "agency";
  const nav = hidePricing ? baseNav : [...baseNav, pricingNavItem];

  return (
    <UpgradeProvider>
    <PhoneProvider>
    <div className="flex min-h-screen w-full bg-black text-white">
      <aside className="hidden md:flex w-64 flex-col bg-[#0f1117] text-slate-200 fixed inset-y-0 left-0 z-20 border-r border-white/[0.06]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <LogoMark className="h-10 w-10" />
          <div>
            <div className="text-[15px] font-semibold text-white leading-tight tracking-tight">Replora</div>
            <div className="text-[11px] text-white/60 mt-0.5">Your AI talks. You watch.</div>
          </div>
        </div>

        {/* Number Switcher */}
        <NumberSwitcher />

        {/* Top nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group flex items-center gap-3 rounded-lg pl-3 pr-3 py-2.5 text-sm font-medium transition-all relative ${
                  active
                    ? "bg-white/[0.06] text-white"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#0084ff]" />}
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{n.label}</span>
                {n.badgeKey === "inbox" && inboxCount > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center bg-[#0084ff] text-white">
                    {inboxCount > 99 ? "99+" : inboxCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Support + Admin */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <div className="pb-2">
            <PlanBadge />
          </div>
          <a
            href={SUPPORT_MAILTO}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <Headphones className="h-[18px] w-[18px]" />
            Support
          </a>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                  {initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00c853] border-2 border-[#0f1117]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-white truncate">{userEmail.split("@")[0]}</div>
                <div className="text-[11px] text-white/60 truncate">{userEmail}</div>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl py-1.5 text-sm overflow-hidden">
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-white/80 hover:bg-white/5 hover:text-white">
                  <SettingsIcon className="h-4 w-4" /> Settings
                </Link>
                <div className="my-1 border-t border-white/10" />
                <button onClick={() => { setMenuOpen(false); inviteTeam(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-white/80 hover:bg-white/5 hover:text-white">
                  <UserPlus className="h-4 w-4" /> Invite Team Member
                </button>
                <button onClick={() => { setMenuOpen(false); downloadPdf(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-white/80 hover:bg-white/5 hover:text-white">
                  <FileDown className="h-4 w-4" /> Download PDF Report
                </button>
                <div className="my-1 border-t border-white/10" />
                <button onClick={() => { setMenuOpen(false); signOut(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-white/80 hover:bg-white/5 hover:text-white">
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" /> Delete Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0f1117] text-slate-300 flex justify-around py-2 border-t border-white/10">
        {nav.slice(0, 5).map((n) => {
          const Icon = n.icon;
          const active = pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={`flex flex-col items-center text-[10px] px-2 py-1 ${active ? "text-[#0084ff]" : "text-white/60"}`}>
              <Icon className="h-5 w-5" />
              {n.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 min-w-0 pb-16 md:pb-0 md:ml-64">
        <TrialBanner />
        {children}
      </main>
    </div>
    </PhoneProvider>
    </UpgradeProvider>
  );
}

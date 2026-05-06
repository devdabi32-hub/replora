import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, subDays, startOfDay, differenceInMinutes } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase, type Message } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { MessageSquare, Users, Bot, Clock, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — WA Monitor" }] }),
  component: () => (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  ),
});

function avatarColor(phone: string) {
  const colors = ["from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-purple-500 to-pink-600","from-orange-500 to-red-600","from-cyan-500 to-blue-600"];
  let h = 0;
  for (const c of phone) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("messages").select("*").order("timestamp", { ascending: false }).then(({ data }) => {
      setMessages((data ?? []) as Message[]);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const inbound = messages.filter((m) => m.direction === "inbound").length;
    const outbound = messages.filter((m) => m.direction === "outbound").length;
    const conversations = new Set(messages.map((m) => m.phone_number)).size;
    const aiRate = inbound > 0 ? Math.round((outbound / inbound) * 100) : 0;

    // avg response time: for each inbound, find the next outbound to same phone
    const sorted = [...messages].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    const byPhone = new Map<string, Message[]>();
    for (const m of sorted) {
      if (!byPhone.has(m.phone_number)) byPhone.set(m.phone_number, []);
      byPhone.get(m.phone_number)!.push(m);
    }
    let totalMin = 0, count = 0;
    for (const arr of byPhone.values()) {
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i].direction === "inbound" && arr[i + 1].direction === "outbound") {
          const diff = differenceInMinutes(new Date(arr[i + 1].timestamp), new Date(arr[i].timestamp));
          if (diff >= 0 && diff < 60 * 24) { totalMin += diff; count++; }
        }
      }
    }
    const avgMin = count > 0 ? totalMin / count : 0;

    // yesterday vs today change for total messages
    const today = startOfDay(new Date());
    const yest = subDays(today, 1);
    const todayCount = messages.filter((m) => new Date(m.timestamp) >= today).length;
    const yestCount = messages.filter((m) => {
      const t = new Date(m.timestamp);
      return t >= yest && t < today;
    }).length;
    const change = yestCount > 0 ? Math.round(((todayCount - yestCount) / yestCount) * 100) : (todayCount > 0 ? 100 : 0);

    return {
      total: messages.length,
      conversations,
      aiRate,
      avgResponse: avgMin,
      change,
      todayCount,
      yestCount,
    };
  }, [messages]);

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
    return days.map((d) => {
      const next = new Date(d.getTime() + 86400000);
      const inbound = messages.filter((m) => {
        const t = new Date(m.timestamp);
        return t >= d && t < next && m.direction === "inbound";
      }).length;
      const outbound = messages.filter((m) => {
        const t = new Date(m.timestamp);
        return t >= d && t < next && m.direction === "outbound";
      }).length;
      return { day: format(d, "EEE"), date: format(d, "MMM d"), Client: inbound, AI: outbound };
    });
  }, [messages]);

  const topContacts = useMemo(() => {
    const map = new Map<string, { count: number; last: string }>();
    for (const m of messages) {
      const e = map.get(m.phone_number);
      if (!e) map.set(m.phone_number, { count: 1, last: m.timestamp });
      else {
        e.count += 1;
        if (new Date(m.timestamp) > new Date(e.last)) e.last = m.timestamp;
      }
    }
    return [...map.entries()].map(([phone, v]) => ({ phone, ...v })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [messages]);

  const statusBreakdown = useMemo(() => {
    const today = startOfDay(new Date());
    const phones = new Set(messages.map((m) => m.phone_number));
    let active = 0, idle = 0, dormant = 0;
    for (const p of phones) {
      const last = messages.filter((m) => m.phone_number === p).reduce((acc, m) => new Date(m.timestamp) > new Date(acc) ? m.timestamp : acc, "1970-01-01");
      const lastDate = new Date(last);
      if (lastDate >= today) active++;
      else if (lastDate >= subDays(today, 7)) idle++;
      else dormant++;
    }
    const total = phones.size || 1;
    return [
      { label: "Active today", count: active, pct: Math.round((active / total) * 100), color: "bg-[#00c853]", text: "text-[#00c853]" },
      { label: "Idle (last 7 days)", count: idle, pct: Math.round((idle / total) * 100), color: "bg-amber-500", text: "text-amber-600" },
      { label: "Dormant", count: dormant, pct: Math.round((dormant / total) * 100), color: "bg-slate-400", text: "text-slate-500" },
    ];
  }, [messages]);

  const fmtResponse = (min: number) => {
    if (min < 1) return "<1m";
    if (min < 60) return `${Math.round(min)}m`;
    return `${(min / 60).toFixed(1)}h`;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time overview of your WhatsApp AI agent performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Conversations" value={stats.conversations.toLocaleString()} icon={Users} iconBg="bg-blue-50" iconColor="text-[#0084ff]" change={stats.change} loading={loading} />
        <MetricCard label="Total Messages" value={stats.total.toLocaleString()} icon={MessageSquare} iconBg="bg-purple-50" iconColor="text-purple-600" change={stats.change} loading={loading} />
        <MetricCard label="AI Response Rate" value={`${stats.aiRate}%`} icon={Bot} iconBg="bg-green-50" iconColor="text-[#00c853]" change={5} loading={loading} />
        <MetricCard label="Avg Response Time" value={fmtResponse(stats.avgResponse)} icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-600" change={-12} loading={loading} inverted />
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Message Volume</h2>
            <p className="text-xs text-slate-500 mt-0.5">Last 7 days · Client vs AI messages</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Client</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#0084ff]" /> AI</span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
              <Bar dataKey="Client" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="AI" fill="#0084ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Most Active Contacts</h2>
            <Link to="/contacts" className="text-xs font-medium text-[#0084ff] hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {topContacts.map((c, i) => {
              const initial = c.phone.replace(/\D/g, "").slice(-1) || "#";
              return (
                <Link key={c.phone} to="/" search={{ phone: c.phone } as never} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarColor(c.phone)} text-white flex items-center justify-center text-sm font-semibold`}>{initial}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">+{c.phone}</div>
                    <div className="text-[11px] text-slate-500">Last seen {format(new Date(c.last), "MMM d, HH:mm")}</div>
                  </div>
                  <span className="text-xs font-semibold bg-blue-50 text-[#0084ff] px-2.5 py-1 rounded-full">{c.count} msgs</span>
                </Link>
              );
            })}
            {topContacts.length === 0 && <div className="py-6 text-center text-slate-400 text-sm">No data yet</div>}
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Conversation Status</h2>
          <p className="text-xs text-slate-500 mb-5">Engagement breakdown</p>
          <div className="space-y-5">
            {statusBreakdown.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-700">{s.label}</span>
                  <span className={`text-sm font-semibold ${s.text}`}>{s.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.pct}%` }} />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{s.pct}% of total</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, icon: Icon, iconBg, iconColor, change, loading, inverted,
}: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; iconBg: string; iconColor: string; change: number; loading: boolean; inverted?: boolean }) {
  const positive = inverted ? change < 0 : change > 0;
  const TrendIcon = change >= 0 ? TrendingUp : TrendingDown;
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          positive ? "bg-green-50 text-[#00c853]" : "bg-red-50 text-red-600"
        }`}>
          <TrendIcon className="h-3 w-3" />
          {Math.abs(change)}%
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{loading ? "—" : value}</div>
      <div className="text-[11px] text-slate-400 mt-1">vs yesterday</div>
    </div>
  );
}

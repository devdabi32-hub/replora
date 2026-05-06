import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase, type Message } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { MessageSquare, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — WA Agent" }] }),
  component: () => (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  ),
});

function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .order("timestamp", { ascending: false })
      .then(({ data }) => {
        setMessages((data ?? []) as Message[]);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const inbound = messages.filter((m) => m.direction === "inbound").length;
    const outbound = messages.filter((m) => m.direction === "outbound").length;
    return { total: messages.length, inbound, outbound };
  }, [messages]);

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
    return days.map((d) => {
      const next = new Date(d.getTime() + 86400000);
      const count = messages.filter((m) => {
        const t = new Date(m.timestamp);
        return t >= d && t < next;
      }).length;
      return { day: format(d, "EEE"), date: format(d, "MMM d"), messages: count };
    });
  }, [messages]);

  const topContacts = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of messages) map.set(m.phone_number, (map.get(m.phone_number) ?? 0) + 1);
    return [...map.entries()]
      .map(([phone, count]) => ({ phone, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [messages]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Overview of your WhatsApp AI agent activity</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Messages" value={stats.total} icon={MessageSquare} color="bg-slate-900" loading={loading} />
        <StatCard label="Inbound (Clients)" value={stats.inbound} icon={ArrowDownLeft} color="bg-slate-500" loading={loading} />
        <StatCard label="Outbound (AI)" value={stats.outbound} icon={ArrowUpRight} color="bg-blue-600" loading={loading} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-1">Messages — Last 7 days</h2>
        <p className="text-xs text-slate-500 mb-4">Daily message volume</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="messages" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Top 5 Active Contacts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">Rank</th>
                <th className="py-2 pr-4 font-medium">Phone Number</th>
                <th className="py-2 pr-4 font-medium text-right">Messages</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {topContacts.map((c, i) => (
                <tr key={c.phone} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4 text-slate-500">#{i + 1}</td>
                  <td className="py-3 pr-4 font-medium">+{c.phone}</td>
                  <td className="py-3 pr-4 text-right">{c.count}</td>
                  <td className="py-3 text-right">
                    <Link to="/" search={{ phone: c.phone } as never} className="text-blue-600 text-xs hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {topContacts.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-400">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color, loading,
}: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; loading: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-lg ${color} text-white flex items-center justify-center`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-semibold mt-0.5">{loading ? "—" : value.toLocaleString()}</div>
      </div>
    </div>
  );
}
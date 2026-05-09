import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, isToday, isThisWeek } from "date-fns";
import { Search, Users, MessageSquare, ArrowRight } from "lucide-react";
import { supabase, type Message } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Chatora" }] }),
  component: () => (
    <AppLayout>
      <ContactsPage />
    </AppLayout>
  ),
});

function avatarColor(phone: string) {
  const colors = ["from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-purple-500 to-pink-600","from-orange-500 to-red-600","from-cyan-500 to-blue-600","from-rose-500 to-pink-600"];
  let h = 0;
  for (const c of phone) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

function ContactsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("messages").select("*").order("timestamp", { ascending: false }).then(({ data }) => {
      setMessages((data ?? []) as Message[]);
      setLoading(false);
    });
  }, []);

  const contacts = useMemo(() => {
    const map = new Map<string, { phone: string; count: number; first: string; last: string }>();
    for (const m of messages) {
      const e = map.get(m.phone_number);
      if (!e) map.set(m.phone_number, { phone: m.phone_number, count: 1, first: m.timestamp, last: m.timestamp });
      else {
        e.count += 1;
        if (new Date(m.timestamp) < new Date(e.first)) e.first = m.timestamp;
        if (new Date(m.timestamp) > new Date(e.last)) e.last = m.timestamp;
      }
    }
    return [...map.values()]
      .filter((c) => c.phone.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => +new Date(b.last) - +new Date(a.last));
  }, [messages, search]);

  const statusOf = (last: string) => {
    const d = new Date(last);
    if (isToday(d)) return { label: "Active", className: "bg-green-50 text-[#00c853] border-green-200" };
    if (isThisWeek(d)) return { label: "Recent", className: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Dormant", className: "bg-slate-50 text-slate-500 border-slate-200" };
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">All contacts that messaged your AI agent</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200/60 rounded-xl px-4 py-2.5 shadow-sm">
          <Users className="h-4 w-4 text-[#0084ff]" />
          <span className="text-sm font-semibold text-slate-900">{contacts.length}</span>
          <span className="text-sm text-slate-500">total contacts</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by phone number..."
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-[#0084ff] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/50 border-b border-slate-100">
                <th className="py-3 px-5 font-semibold">Contact</th>
                <th className="py-3 px-4 font-semibold text-right">Messages</th>
                <th className="py-3 px-4 font-semibold">First Seen</th>
                <th className="py-3 px-4 font-semibold">Last Seen</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading contacts…</td></tr>}
              {!loading && contacts.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No contacts found</td></tr>}
              {contacts.map((c) => {
                const initial = c.phone.replace(/\D/g, "").slice(-1) || "#";
                const status = statusOf(c.last);
                return (
                  <tr key={c.phone} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarColor(c.phone)} text-white flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">+{c.phone}</div>
                          <div className="text-[11px] text-slate-500">WhatsApp</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#0084ff] text-xs font-semibold">
                        <MessageSquare className="h-3 w-3" />
                        {c.count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[13px]">{format(new Date(c.first), "MMM d, yyyy")}<div className="text-[11px] text-slate-400">{format(new Date(c.first), "HH:mm")}</div></td>
                    <td className="py-3 px-4 text-slate-600 text-[13px]">{format(new Date(c.last), "MMM d, yyyy")}<div className="text-[11px] text-slate-400">{format(new Date(c.last), "HH:mm")}</div></td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${status.className}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.label === "Active" ? "bg-[#00c853]" : status.label === "Recent" ? "bg-amber-500" : "bg-slate-400"}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate({ to: "/inbox", search: { phone: c.phone } as never })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-[#0084ff] hover:text-white transition-colors"
                      >
                        View Chat <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { supabase, type Message } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts — WA Agent" }] }),
  component: () => (
    <AppLayout>
      <ContactsPage />
    </AppLayout>
  ),
});

function ContactsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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

  const contacts = useMemo(() => {
    const map = new Map<string, { phone: string; count: number; first: string; last: string }>();
    for (const m of messages) {
      const e = map.get(m.phone_number);
      if (!e) {
        map.set(m.phone_number, { phone: m.phone_number, count: 1, first: m.timestamp, last: m.timestamp });
      } else {
        e.count += 1;
        if (new Date(m.timestamp) < new Date(e.first)) e.first = m.timestamp;
        if (new Date(m.timestamp) > new Date(e.last)) e.last = m.timestamp;
      }
    }
    return [...map.values()]
      .filter((c) => c.phone.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => +new Date(b.last) - +new Date(a.last));
  }, [messages, search]);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Contacts</h1>
      <p className="text-sm text-slate-500 mb-6">All contacts that messaged your AI agent</p>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by phone number"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 font-medium">Phone Number</th>
                <th className="py-3 px-4 font-medium text-right">Messages</th>
                <th className="py-3 px-4 font-medium">First Seen</th>
                <th className="py-3 px-4 font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400">Loading…</td></tr>
              )}
              {!loading && contacts.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400">No contacts found</td></tr>
              )}
              {contacts.map((c) => (
                <tr
                  key={c.phone}
                  onClick={() => navigate({ to: "/", search: { phone: c.phone } as never })}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-medium">+{c.phone}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                      {c.count}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{format(new Date(c.first), "MMM d, yyyy HH:mm")}</td>
                  <td className="py-3 px-4 text-slate-600">{format(new Date(c.last), "MMM d, yyyy HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
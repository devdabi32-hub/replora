import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { supabase, type Message } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Search, Bot, User } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppLayout>
      <InboxPage />
    </AppLayout>
  );
}

type Conversation = {
  phone_number: string;
  last: Message;
  count: number;
};

function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("timestamp", { ascending: false });
      if (!active) return;
      setMessages((data ?? []) as Message[]);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("messages-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  // Read ?phone=... query param to preselect conversation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("phone");
    if (p) setSelected(p);
  }, []);

  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>();
    for (const m of messages) {
      const existing = map.get(m.phone_number);
      if (!existing) {
        map.set(m.phone_number, { phone_number: m.phone_number, last: m, count: 1 });
      } else {
        existing.count += 1;
        if (new Date(m.timestamp) > new Date(existing.last.timestamp)) {
          existing.last = m;
        }
      }
    }
    return [...map.values()]
      .sort((a, b) => +new Date(b.last.timestamp) - +new Date(a.last.timestamp))
      .filter((c) => c.phone_number.toLowerCase().includes(search.toLowerCase()));
  }, [messages, search]);

  const conversationMessages = useMemo(
    () =>
      selected
        ? messages
            .filter((m) => m.phone_number === selected)
            .sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
        : [],
    [messages, selected],
  );

  useEffect(() => {
    if (!selected && conversations.length > 0) {
      setSelected(conversations[0].phone_number);
    }
  }, [conversations, selected]);

  return (
    <div className="flex h-screen md:h-screen">
      {/* Conversations list */}
      <div className={`${selected ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-slate-50`}>
        <div className="p-4 border-b border-slate-200 bg-white">
          <h1 className="text-lg font-semibold mb-3">Inbox</h1>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-6 text-sm text-slate-400">Loading…</div>}
          {!loading && conversations.length === 0 && (
            <div className="p-6 text-sm text-slate-400">No conversations</div>
          )}
          {conversations.map((c) => (
            <button
              key={c.phone_number}
              onClick={() => setSelected(c.phone_number)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 flex gap-3 hover:bg-white transition-colors ${
                selected === c.phone_number ? "bg-white" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {c.phone_number.slice(-2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-medium text-sm text-slate-900 truncate">+{c.phone_number}</span>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">
                    {formatDistanceToNow(new Date(c.last.timestamp), { addSuffix: false })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 truncate mt-0.5">
                  {c.last.direction === "outbound" && <span className="text-blue-600 font-medium">AI:</span>}
                  <span className="truncate">{c.last.message_text}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation panel */}
      <div className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col bg-slate-50`}>
        {selected ? (
          <>
            <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="md:hidden text-sm text-slate-500"
              >
                ←
              </button>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-sm font-semibold">
                {selected.slice(-2)}
              </div>
              <div>
                <div className="font-semibold text-sm">+{selected}</div>
                <div className="text-xs text-slate-500">{conversationMessages.length} messages</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-3">
              {conversationMessages.map((m) => {
                const isOut = m.direction === "outbound";
                return (
                  <div key={m.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] ${isOut ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      {isOut && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 px-1">
                          <Bot className="h-3 w-3" /> AI
                        </div>
                      )}
                      {!isOut && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 px-1">
                          <User className="h-3 w-3" /> Client
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                          isOut
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                        }`}
                      >
                        {m.message_text}
                      </div>
                      <div className="text-[10px] text-slate-400 px-1">
                        {format(new Date(m.timestamp), "MMM d, HH:mm")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
}

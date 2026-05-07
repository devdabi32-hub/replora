import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, format, isToday } from "date-fns";
import { supabase, type Message } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Search, Bot, Phone, Video, MoreVertical, Smile, Paperclip, Send, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/inbox")({
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
  unread: number;
  activeToday: boolean;
};

function avatarColor(phone: string) {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-pink-600",
    "from-orange-500 to-red-600",
    "from-cyan-500 to-blue-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
  ];
  let h = 0;
  for (const c of phone) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("phone");
    if (p) setSelected(p);
  }, []);

  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>();
    for (const m of messages) {
      const e = map.get(m.phone_number);
      const isUnread = m.direction === "inbound" && m.is_read === false;
      const today = isToday(new Date(m.timestamp));
      if (!e) {
        map.set(m.phone_number, {
          phone_number: m.phone_number,
          last: m,
          count: 1,
          unread: isUnread ? 1 : 0,
          activeToday: today,
        });
      } else {
        e.count += 1;
        if (isUnread) e.unread += 1;
        if (today) e.activeToday = true;
        if (new Date(m.timestamp) > new Date(e.last.timestamp)) e.last = m;
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
    if (!selected && conversations.length > 0) setSelected(conversations[0].phone_number);
  }, [conversations, selected]);

  const selectedConv = conversations.find((c) => c.phone_number === selected);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Conversations list */}
      <div className={`${selected ? "hidden md:flex" : "flex"} w-full md:w-[360px] flex-col border-r border-slate-200 bg-white`}>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inbox</h1>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {conversations.length} chats
            </span>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-[#0084ff] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {loading && <div className="p-6 text-sm text-slate-400 text-center">Loading conversations…</div>}
          {!loading && conversations.length === 0 && (
            <div className="p-10 text-sm text-slate-400 text-center">No conversations yet</div>
          )}
          {conversations.map((c) => {
            const initial = c.phone_number.replace(/\D/g, "").slice(-1) || "#";
            const isSelected = selected === c.phone_number;
            return (
              <button
                key={c.phone_number}
                onClick={() => setSelected(c.phone_number)}
                className={`w-full text-left px-3 py-3 rounded-xl flex gap-3 transition-all mb-0.5 ${
                  isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${avatarColor(c.phone_number)} text-white flex items-center justify-center text-base font-semibold shadow-sm`}>
                    {initial}
                  </div>
                  {c.activeToday && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00c853] border-2 border-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className={`font-semibold text-[14px] truncate ${isSelected ? "text-[#0084ff]" : "text-slate-900"}`}>
                      +{c.phone_number}
                    </span>
                    <span className="text-[11px] text-slate-400 flex-shrink-0 font-medium">
                      {formatDistanceToNow(new Date(c.last.timestamp), { addSuffix: false })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-1 text-[13px] text-slate-500 truncate min-w-0 flex-1">
                      {c.last.direction === "outbound" && (
                        <CheckCheck className="h-3.5 w-3.5 text-[#0084ff] flex-shrink-0" />
                      )}
                      <span className="truncate">{c.last.message_text}</span>
                    </div>
                    {c.unread > 0 && (
                      <span className="bg-[#00c853] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation panel */}
      <div className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col bg-[#efeae2] relative`}>
        {selected && selectedConv ? (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3 shadow-sm z-10">
              <button
                onClick={() => setSelected(null)}
                className="md:hidden text-slate-500 text-lg"
              >
                ←
              </button>
              <div className="relative">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarColor(selected)} text-white flex items-center justify-center text-base font-semibold`}>
                  {selected.replace(/\D/g, "").slice(-1) || "#"}
                </div>
                {selectedConv.activeToday && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00c853] border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[15px] text-slate-900">+{selected}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00c853] bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00c853]" />
                    ACTIVE
                  </span>
                </div>
                <div className="text-[12px] text-slate-500 mt-0.5">{selectedConv.count} messages · AI responding</div>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Phone className="h-4 w-4" /></button>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Video className="h-4 w-4" /></button>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-2"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23000000' fill-opacity='0.025'%3E%3Cpath d='M40 40c0-22 18-40 40-40v80C58 80 40 62 40 40zM0 40c0 22 18 40 40 40V0C18 0 0 18 0 40z'/%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              {conversationMessages.map((m, idx) => {
                const isOut = m.direction === "outbound";
                const prev = conversationMessages[idx - 1];
                const showTime = !prev || (new Date(m.timestamp).getTime() - new Date(prev.timestamp).getTime()) > 5 * 60 * 1000;
                return (
                  <div key={m.id}>
                    {showTime && (
                      <div className="flex justify-center my-3">
                        <span className="text-[11px] text-slate-600 bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full font-medium shadow-sm">
                          {format(new Date(m.timestamp), "MMM d, HH:mm")}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] flex flex-col ${isOut ? "items-end" : "items-start"}`}>
                        <div
                          className={`px-3.5 py-2 text-[14px] shadow-sm relative ${
                            isOut
                              ? "bg-[#0084ff] text-white rounded-2xl rounded-br-md"
                              : "bg-white text-slate-800 rounded-2xl rounded-bl-md"
                          }`}
                        >
                          {isOut && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-white/90 mb-1">
                              <span className="inline-flex items-center gap-1 bg-[#00c853] px-1.5 py-0.5 rounded">
                                <Bot className="h-2.5 w-2.5" /> AI
                              </span>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap break-words leading-relaxed">{m.message_text}</div>
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOut ? "text-white/70" : "text-slate-400"}`}>
                            {format(new Date(m.timestamp), "HH:mm")}
                            {isOut && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input bar (read-only) */}
            <div className="px-4 py-3 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors" disabled>
                <Smile className="h-5 w-5" />
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors" disabled>
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                readOnly
                placeholder="Read-only — monitoring view"
                className="flex-1 px-4 py-2.5 rounded-full bg-white text-sm text-slate-500 border border-transparent outline-none cursor-not-allowed"
              />
              <button className="p-2.5 bg-[#0084ff] text-white rounded-full opacity-50 cursor-not-allowed" disabled>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}

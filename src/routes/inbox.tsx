import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { format, isToday, isYesterday, differenceInHours } from "date-fns";
import { supabase, type Message } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import {
  Search, Phone, Video, MoreVertical, Smile, Paperclip, Send,
  CheckCheck, Star, Trash2, StickyNote, Lock, MessageCircle, X, ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/inbox")({ component: Index });

function Index() { return <AppLayout><InboxPage /></AppLayout>; }

type Category = "hot" | "warm" | "cold";
type FilterKey = "all" | "important" | Category;
type Note = { text: string; created_at: string };
type Contact = {
  phone_number: string;
  is_important: boolean;
  lead_category: Category | null;
  notes: Note[];
};
type Conversation = {
  phone_number: string;
  last: Message;
  count: number;
  unread: number;
  activeToday: boolean;
  autoCategory: Category;
  category: Category | null;
  isImportant: boolean;
  notes: Note[];
  lastInboundAt: Date | null;
};

const CAT: Record<Category, { label: string; emoji: string; cls: string; activeCls: string; dot: string }> = {
  hot:  { label: "Hot",  emoji: "🔥", cls: "bg-red-500/15 text-red-300 border-red-500/30",       activeCls: "bg-red-500 text-white border-red-500",       dot: "bg-red-500" },
  warm: { label: "Warm", emoji: "🟡", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30", activeCls: "bg-amber-500 text-white border-amber-500",   dot: "bg-amber-500" },
  cold: { label: "Cold", emoji: "🔵", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30",       activeCls: "bg-sky-500 text-white border-sky-500",       dot: "bg-sky-500" },
};

function avatarColor(p: string) {
  const colors = ["from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-purple-500 to-pink-600","from-orange-500 to-red-600","from-cyan-500 to-blue-600","from-rose-500 to-pink-600","from-amber-500 to-orange-600"];
  let h = 0; for (const c of p) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}
function autoCat(count: number, last: Date | null): Category {
  if (!last) return "cold";
  const hrs = differenceInHours(new Date(), last);
  if (hrs <= 24 && count >= 5) return "hot";
  if (hrs <= 72) return "warm";
  return "cold";
}
function dayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}
function timeShort(d: Date) {
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  const days = (Date.now() - d.getTime()) / 86400000;
  if (days < 7) return format(d, "EEEE");
  return format(d, "dd/MM/yyyy");
}

function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    const { data } = await supabase.from("messages").select("*").order("timestamp", { ascending: false });
    setMessages((data ?? []) as Message[]);
    setLoading(false);
  };
  const loadContacts = async () => {
    const { data } = await supabase.from("contacts").select("*");
    const map: Record<string, Contact> = {};
    for (const c of (data ?? []) as any[]) {
      map[c.phone_number] = {
        phone_number: c.phone_number,
        is_important: !!c.is_important,
        lead_category: c.lead_category ?? null,
        notes: Array.isArray(c.notes) ? c.notes : [],
      };
    }
    setContacts(map);
  };

  useEffect(() => {
    loadMessages(); loadContacts();
    const ch = supabase.channel("inbox-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, loadMessages)
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, loadContacts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("phone");
    if (p) setSelected(p);
  }, []);

  const upsertContact = async (phone: string, patch: Partial<Contact>) => {
    const existing = contacts[phone] ?? { phone_number: phone, is_important: false, lead_category: null, notes: [] };
    const next: Contact = { ...existing, ...patch };
    setContacts((prev) => ({ ...prev, [phone]: next }));
    await supabase.from("contacts").upsert({
      phone_number: phone,
      is_important: next.is_important,
      lead_category: next.lead_category,
      notes: next.notes,
      updated_at: new Date().toISOString(),
    });
  };

  const toggleStar = (phone: string) => {
    const cur = contacts[phone];
    upsertContact(phone, { is_important: !(cur?.is_important) });
  };
  const setTag = (phone: string, cat: Category | null) => {
    upsertContact(phone, { lead_category: cat });
  };
  const addNote = async (phone: string, text: string) => {
    const t = text.trim(); if (!t) return;
    const cur = contacts[phone] ?? { phone_number: phone, is_important: false, lead_category: null, notes: [] };
    const next = [...cur.notes, { text: t, created_at: new Date().toISOString() }];
    await upsertContact(phone, { notes: next });
    setNoteDraft("");
  };
  const deleteConv = async (phone: string) => {
    setConfirmDelete(null);
    await supabase.from("messages").delete().eq("phone_number", phone);
    await supabase.from("contacts").delete().eq("phone_number", phone);
    setMessages((prev) => prev.filter((m) => m.phone_number !== phone));
    setContacts((prev) => { const n = { ...prev }; delete n[phone]; return n; });
    if (selected === phone) setSelected(null);
  };

  const allConversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>();
    for (const m of messages) {
      const e = map.get(m.phone_number);
      const isUnread = m.direction === "inbound" && m.is_read === false;
      const today = isToday(new Date(m.timestamp));
      const ts = new Date(m.timestamp);
      if (!e) {
        map.set(m.phone_number, {
          phone_number: m.phone_number, last: m, count: 1,
          unread: isUnread ? 1 : 0, activeToday: today,
          autoCategory: "cold", category: null, isImportant: false, notes: [],
          lastInboundAt: m.direction === "inbound" ? ts : null,
        });
      } else {
        e.count += 1;
        if (isUnread) e.unread += 1;
        if (today) e.activeToday = true;
        if (ts > new Date(e.last.timestamp)) e.last = m;
        if (m.direction === "inbound" && (!e.lastInboundAt || ts > e.lastInboundAt)) e.lastInboundAt = ts;
      }
    }
    const list = [...map.values()];
    for (const c of list) {
      const ct = contacts[c.phone_number];
      c.autoCategory = autoCat(c.count, c.lastInboundAt);
      c.category = ct?.lead_category ?? null;
      c.isImportant = !!ct?.is_important;
      c.notes = ct?.notes ?? [];
    }
    return list.sort((a, b) => +new Date(b.last.timestamp) - +new Date(a.last.timestamp));
  }, [messages, contacts]);

  const conversations = useMemo(() => {
    return allConversations
      .filter((c) => {
        if (filter === "all") return true;
        if (filter === "important") return c.isImportant;
        return (c.category ?? c.autoCategory) === filter;
      })
      .filter((c) => c.phone_number.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0));
  }, [allConversations, filter, search]);

  const counts = useMemo(() => {
    const c = { all: allConversations.length, important: 0, hot: 0, warm: 0, cold: 0 };
    for (const x of allConversations) {
      if (x.isImportant) c.important++;
      const cat = x.category ?? x.autoCategory;
      c[cat]++;
    }
    return c;
  }, [allConversations]);

  const conversationMessages = useMemo(
    () => selected ? messages.filter((m) => m.phone_number === selected).sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)) : [],
    [messages, selected],
  );

  // mark inbound as read
  useEffect(() => {
    if (!selected) return;
    const unread = messages.filter((m) => m.phone_number === selected && m.direction === "inbound" && m.is_read === false);
    if (!unread.length) return;
    supabase.from("messages").update({ is_read: true }).in("id", unread.map((u) => u.id)).then(() => {});
  }, [selected, messages]);

  useEffect(() => {
    if (!selected && conversations.length > 0) setSelected(conversations[0].phone_number);
  }, [conversations, selected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected, conversationMessages.length]);

  const selectedConv = allConversations.find((c) => c.phone_number === selected);
  const selectedContact = selected ? contacts[selected] : undefined;
  const effectiveCat = selectedConv ? (selectedConv.category ?? selectedConv.autoCategory) : null;

  const tabs: { key: FilterKey; label: string; icon?: string }[] = [
    { key: "all", label: "All" },
    { key: "important", label: "Important", icon: "⭐" },
    { key: "hot", label: "Hot", icon: "🔥" },
    { key: "warm", label: "Warm", icon: "🟡" },
    { key: "cold", label: "Cold", icon: "🔵" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B141A]">
      {/* LEFT SIDEBAR */}
      <div className={`${selected ? "hidden md:flex" : "flex"} w-full md:w-[400px] flex-col bg-[#111B21] border-r border-black/40`}>
        {/* Header */}
        <div className="px-4 h-[60px] bg-[#202C33] flex items-center justify-between flex-shrink-0">
          <h1 className="text-[#E9EDEF] font-semibold text-base tracking-tight">WA Monitor</h1>
          <div className="flex items-center gap-1 text-[#AEBAC1]">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><MessageCircle className="h-5 w-5" /></button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><MoreVertical className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-2 pb-2 bg-[#111B21]">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8696A0]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full pl-12 pr-3 py-2 text-[14px] rounded-lg bg-[#202C33] text-[#E9EDEF] placeholder:text-[#8696A0] border border-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {tabs.map((t) => {
            const isActive = filter === t.key;
            const count = counts[t.key];
            return (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium border transition-all flex-shrink-0 ${
                  isActive ? "bg-[#00A884]/20 text-[#00A884] border-[#00A884]/40" : "bg-[#202C33] text-[#AEBAC1] border-transparent hover:bg-[#2A3942]"
                }`}>
                {t.icon && <span>{t.icon}</span>}
                <span>{t.label}</span>
                <span className="text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-6 text-sm text-[#8696A0] text-center">Loading…</div>}
          {!loading && conversations.length === 0 && (
            <div className="p-10 text-sm text-[#8696A0] text-center">No conversations</div>
          )}
          {conversations.map((c) => {
            const initial = c.phone_number.replace(/\D/g, "").slice(-1) || "#";
            const isSel = selected === c.phone_number;
            const cat = c.category ?? c.autoCategory;
            const meta = CAT[cat];
            return (
              <div key={c.phone_number}
                onClick={() => setSelected(c.phone_number)}
                className={`group cursor-pointer flex items-center gap-3 pl-3 pr-3 py-3 border-b border-white/[0.04] transition-colors ${
                  isSel ? "bg-[#2A3942]" : "hover:bg-[#202C33]"
                }`}>
                <div className="relative flex-shrink-0">
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${avatarColor(c.phone_number)} text-white flex items-center justify-center text-lg font-semibold`}>
                    {initial}
                  </div>
                  {c.activeToday && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00A884] border-2 border-[#111B21]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-[15px] text-[#E9EDEF] truncate">+{c.phone_number}</span>
                      {c.isImportant && <Star className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" fill="currentColor" />}
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${meta.cls}`}>
                        <span>{meta.emoji}</span>{meta.label}
                      </span>
                    </div>
                    <span className={`text-[11px] flex-shrink-0 font-medium ${c.unread > 0 ? "text-[#00A884]" : "text-[#8696A0]"}`}>
                      {timeShort(new Date(c.last.timestamp))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-1 text-[13px] text-[#8696A0] truncate min-w-0 flex-1">
                      {c.last.direction === "outbound" && <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB] flex-shrink-0" />}
                      <span className="truncate">{c.last.message_text}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); toggleStar(c.phone_number); }}
                        className={`p-1 rounded transition-all ${c.isImportant ? "text-amber-400" : "text-[#8696A0] opacity-0 group-hover:opacity-100 hover:text-amber-400"}`}>
                        <Star className="h-4 w-4" fill={c.isImportant ? "currentColor" : "none"} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.phone_number); }}
                        className="p-1 rounded text-[#8696A0] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {c.unread > 0 && (
                        <span className="bg-[#00A884] text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full inline-flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      <div className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col bg-[#0B141A] relative`}>
        {selected && selectedConv ? (
          <>
            {/* Header */}
            <div className="px-4 h-[60px] bg-[#202C33] flex items-center gap-3 flex-shrink-0 border-l border-black/30">
              <button onClick={() => setSelected(null)} className="md:hidden text-[#AEBAC1]"><ArrowLeft className="h-5 w-5" /></button>
              <div className="relative">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarColor(selected)} text-white flex items-center justify-center text-base font-semibold`}>
                  {selected.replace(/\D/g, "").slice(-1) || "#"}
                </div>
                {selectedConv.activeToday && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00A884] border-2 border-[#202C33]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[15px] text-[#E9EDEF] truncate">+{selected}</div>
                <div className="text-[12px] text-[#8696A0]">{selectedConv.activeToday ? "online" : `last seen ${timeShort(new Date(selectedConv.last.timestamp))}`}</div>
              </div>
              <div className="flex items-center gap-1 text-[#AEBAC1]">
                <button className="p-2 hover:bg-white/10 rounded-full"><Search className="h-5 w-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-full"><Phone className="h-5 w-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-full"><Video className="h-5 w-5" /></button>
                <button className="p-2 hover:bg-white/10 rounded-full"><MoreVertical className="h-5 w-5" /></button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-2 bg-[#1F2A30] border-b border-black/30 flex items-center gap-2 flex-wrap flex-shrink-0">
              <button onClick={() => toggleStar(selected)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                  selectedConv.isImportant ? "bg-amber-400/15 text-amber-300 border-amber-400/40" : "bg-[#2A3942] text-[#AEBAC1] border-transparent hover:bg-[#374248]"
                }`}>
                <Star className="h-3.5 w-3.5" fill={selectedConv.isImportant ? "currentColor" : "none"} />
                {selectedConv.isImportant ? "Important" : "Mark important"}
              </button>
              <div className="h-5 w-px bg-white/10" />
              <span className="text-[11px] text-[#8696A0] font-medium uppercase tracking-wider">Tag:</span>
              {(["hot","warm","cold"] as Category[]).map((k) => {
                const meta = CAT[k]; const active = effectiveCat === k && selectedConv.category === k;
                return (
                  <button key={k} onClick={() => setTag(selected, active ? null : k)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                      active ? meta.activeCls : meta.cls + " hover:opacity-80"
                    }`}>
                    <span>{meta.emoji}</span>{meta.label}
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => setNotesOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#2A3942] text-[#AEBAC1] hover:bg-[#374248]">
                  <StickyNote className="h-3.5 w-3.5" />
                  Notes {selectedConv.notes.length > 0 && <span className="text-[#00A884]">({selectedConv.notes.length})</span>}
                </button>
                <button onClick={() => setConfirmDelete(selected)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 md:px-12 py-4"
                style={{ backgroundColor: "#0B141A", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M40 40c0-22 18-40 40-40v80C58 80 40 62 40 40zM0 40c0 22 18 40 40 40V0C18 0 0 18 0 40z'/%3E%3C/g%3E%3C/svg%3E\")" }}>
                {conversationMessages.map((m, idx) => {
                  const isOut = m.direction === "outbound";
                  const prev = conversationMessages[idx - 1];
                  const showDay = !prev || dayLabel(new Date(prev.timestamp)) !== dayLabel(new Date(m.timestamp));
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <div className="flex justify-center my-3">
                          <span className="text-[11px] text-[#8696A0] bg-[#1F2C33] px-3 py-1 rounded-md font-medium uppercase tracking-wider">
                            {dayLabel(new Date(m.timestamp))}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOut ? "justify-end" : "justify-start"} mb-1`}>
                        <div className={`max-w-[65%] flex flex-col ${isOut ? "items-end" : "items-start"}`}>
                          {isOut && <span className="text-[10px] font-semibold mb-0.5 px-2 text-[#00A884]">AI Agent</span>}
                          <div className={`relative px-3 py-1.5 text-[14px] shadow-sm ${
                            isOut ? "bg-[#005C4B] text-[#E9EDEF] rounded-lg rounded-tr-none" : "bg-[#202C33] text-[#E9EDEF] rounded-lg rounded-tl-none"
                          }`}>
                            <div className="whitespace-pre-wrap break-words leading-snug pr-14">{m.message_text}</div>
                            <div className="float-right -mb-1 ml-2 mt-1 flex items-center gap-1 text-[10px] text-[#8696A0]">
                              <span>{format(new Date(m.timestamp), "HH:mm")}</span>
                              {isOut && <CheckCheck className="h-3 w-3 text-[#53BDEB]" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Notes panel */}
              {notesOpen && (
                <div className="w-[340px] flex flex-col bg-[#111B21] border-l border-black/40 flex-shrink-0">
                  <div className="px-4 h-[60px] bg-[#202C33] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2 text-[#E9EDEF]">
                      <StickyNote className="h-4 w-4" />
                      <span className="font-medium text-[15px]">Notes</span>
                    </div>
                    <button onClick={() => setNotesOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full text-[#AEBAC1]">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {selectedConv.notes.length === 0 && (
                      <div className="text-center text-[#8696A0] text-sm py-8">No notes yet</div>
                    )}
                    {[...selectedConv.notes].reverse().map((n, i) => (
                      <div key={i} className="bg-[#202C33] rounded-lg p-3 text-[13px] text-[#E9EDEF]">
                        <div className="whitespace-pre-wrap break-words">{n.text}</div>
                        <div className="text-[10px] text-[#8696A0] mt-1.5">{format(new Date(n.created_at), "MMM d, yyyy · HH:mm")}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-black/30 bg-[#1F2A30]">
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add a note about this contact…"
                      rows={3}
                      className="w-full bg-[#2A3942] text-[#E9EDEF] placeholder:text-[#8696A0] text-[13px] rounded-lg p-2.5 focus:outline-none resize-none"
                    />
                    <button onClick={() => addNote(selected, noteDraft)}
                      disabled={!noteDraft.trim()}
                      className="mt-2 w-full bg-[#00A884] hover:bg-[#06CF9C] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium py-2 rounded-lg transition-colors">
                      Save note
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-[#202C33] flex items-center gap-2 flex-shrink-0">
              <button className="p-2 text-[#8696A0]" disabled><Smile className="h-5 w-5" /></button>
              <button className="p-2 text-[#8696A0]" disabled><Paperclip className="h-5 w-5" /></button>
              <div className="flex-1 px-4 py-2.5 rounded-lg bg-[#2A3942] text-[#8696A0] text-[14px] flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-[#00A884]" />
                Monitoring mode — replies sent by AI agent
              </div>
              <button className="p-2.5 bg-[#00A884] text-white rounded-full opacity-50 cursor-not-allowed" disabled>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0B141A] text-center px-6">
            <div className="h-32 w-32 rounded-full bg-[#202C33] flex items-center justify-center mb-6">
              <MessageCircle className="h-16 w-16 text-[#3B4A54]" strokeWidth={1.2} />
            </div>
            <h2 className="text-[#E9EDEF] text-2xl font-light mb-2">Select a conversation to start monitoring</h2>
            <p className="text-[#8696A0] text-sm max-w-md">Your AI agent conversations appear here in real time.</p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-[#202C33] rounded-lg shadow-2xl max-w-sm w-[90%] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[#E9EDEF] text-lg font-medium mb-2">Delete this conversation?</h3>
            <p className="text-[#8696A0] text-sm mb-5">This cannot be undone. All messages and notes for +{confirmDelete} will be permanently removed.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="px-5 py-2 rounded-full text-[14px] font-medium text-[#00A884] hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteConv(confirmDelete)}
                className="px-5 py-2 rounded-full text-[14px] font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

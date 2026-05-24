import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
    Megaphone,
    Plus,
    Send,
    Trash2,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Users,
    BarChart2,
    Radio,
    X,
    AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/broadcasts")({
    component: BroadcastsPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type BroadcastStatus = "draft" | "sending" | "sent" | "failed" | "paused";

interface Broadcast {
    id: string;
    agency_id: string;
    connection_id: string | null;
    template_name: string;
    template_language: string;
    status: BroadcastStatus;
    total_contacts: number;
    total_sent: number;
    total_delivered: number;
    total_read: number;
    total_failed: number;
    created_at: string;
    connected_phone_numbers?: { display_name: string; phone_number: string } | null;
}

interface ConnectedNumber {
    id: string;
    display_name: string;
    phone_number: string;
    access_token: string | null;
}

interface Contact {
    phone_number: string;
    name: string | null;
}

interface Recipient {
    id: string;
    phone_number: string;
    contact_name: string | null;
    status: string;
    sent_at: string | null;
    error_message: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPABASE_URL =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
    "https://xloppafivbvsljfxtjwh.supabase.co";

const STATUS_CONFIG: Record<
    BroadcastStatus,
    { label: string; color: string; spin?: boolean }
> = {
    draft: { label: "Draft", color: "text-white/50 bg-white/[0.07]" },
    sending: { label: "Sending…", color: "text-yellow-400 bg-yellow-400/10", spin: true },
    sent: { label: "Sent", color: "text-[#00c853] bg-[#00c853]/10" },
    failed: { label: "Failed", color: "text-red-400 bg-red-400/10" },
    paused: { label: "Paused", color: "text-orange-400 bg-orange-400/10" },
};

const LANGUAGES = [
    { code: "en_US", label: "English (US)" },
    { code: "en_GB", label: "English (UK)" },
    { code: "hi", label: "Hindi" },
    { code: "ta", label: "Tamil" },
    { code: "te", label: "Telugu" },
    { code: "mr", label: "Marathi" },
    { code: "gu", label: "Gujarati" },
    { code: "kn", label: "Kannada" },
    { code: "ml", label: "Malayalam" },
    { code: "bn", label: "Bengali" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function pct(num: number, denom: number): number {
    return denom ? Math.round((num / denom) * 100) : 0;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function BroadcastsPage() {
    // Data
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [connections, setConnections] = useState<ConnectedNumber[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    // UI state
    const [showCreate, setShowCreate] = useState(false);
    const [viewBroadcast, setViewBroadcast] = useState<Broadcast | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [activeSending, setActiveSending] = useState<Set<string>>(new Set());

    // Create-modal form state
    const [templateName, setTemplateName] = useState("");
    const [templateLanguage, setTemplateLanguage] = useState("en_US");
    const [selectedConn, setSelectedConn] = useState("");
    const [sendTo, setSendTo] = useState<"all" | "manual">("all");
    const [manualNums, setManualNums] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // ── Loaders ──────────────────────────────────────────────────────────────

    const loadBroadcasts = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from("broadcasts")
            .select("*, connected_phone_numbers(display_name, phone_number)")
            .order("created_at", { ascending: false });
        setBroadcasts((data as Broadcast[]) ?? []);
        setLoading(false);
    }, []);

    const loadConnections = useCallback(async () => {
        const { data } = await supabase
            .from("connected_phone_numbers")
            .select("id, display_name, phone_number, access_token")
            .eq("is_active", true);
        const list = (data as ConnectedNumber[]) ?? [];
        setConnections(list);
        if (list.length > 0 && !selectedConn) setSelectedConn(list[0].id);
    }, [selectedConn]);

    const loadContacts = useCallback(async () => {
        const { data } = await supabase
            .from("contacts")
            .select("phone_number, name");
        setContacts((data as Contact[]) ?? []);
    }, []);

    useEffect(() => {
        loadBroadcasts();
        loadConnections();
        loadContacts();
    }, [loadBroadcasts, loadConnections, loadContacts]);

    // Realtime: auto-refresh table when broadcast row changes (status/counts update)
    useEffect(() => {
        const ch = supabase
            .channel("broadcasts-rt")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "broadcasts" },
                loadBroadcasts
            )
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [loadBroadcasts]);

    // ── Create handler ────────────────────────────────────────────────────────

    const handleCreate = async () => {
        setCreateError("");

        // Validation
        if (!templateName.trim()) {
            setCreateError("Template name is required.");
            return;
        }
        if (!selectedConn) {
            setCreateError("Select a WhatsApp number to send from.");
            return;
        }
        const conn = connections.find((c) => c.id === selectedConn);
        if (!conn?.access_token) {
            setCreateError(
                "This number has no Access Token. Go to Connections → edit → add it first."
            );
            return;
        }

        // Resolve numbers
        let numbers: string[] = [];
        if (sendTo === "all") {
            numbers = contacts.map((c) => c.phone_number).filter(Boolean);
            if (numbers.length === 0) {
                setCreateError("No contacts found. Import contacts first or use manual entry.");
                return;
            }
        } else {
            numbers = manualNums
                .split(/[\n,;]+/)
                .map((n) => n.trim().replace(/\s/g, ""))
                .filter((n) => n.length >= 10);
            if (numbers.length === 0) {
                setCreateError("Enter at least one valid phone number (10+ digits).");
                return;
            }
        }

        setCreating(true);
        try {
            // 1 — Create broadcast record (status: 'sending' right away)
            const { data: broadcast, error: bErr } = await supabase
                .from("broadcasts")
                .insert({
                    connection_id: selectedConn,
                    template_name: templateName.trim(),
                    template_language: templateLanguage,
                    total_contacts: numbers.length,
                    status: "sending",
                    started_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (bErr || !broadcast) throw new Error(bErr?.message ?? "Failed to create broadcast");

            // 2 — Bulk-insert recipients (chunks of 500 — Supabase insert limit)
            const contactMap = new Map(contacts.map((c) => [c.phone_number, c.name]));
            for (let i = 0; i < numbers.length; i += 500) {
                const chunk = numbers.slice(i, i + 500).map((phone) => ({
                    broadcast_id: broadcast.id,
                    agency_id: (broadcast as Record<string, string>).agency_id,
                    phone_number: phone,
                    contact_name: contactMap.get(phone) ?? null,
                    status: "pending",
                }));
                const { error: rErr } = await supabase
                    .from("broadcast_recipients")
                    .insert(chunk);
                if (rErr) throw new Error(rErr.message);
            }

            // 3 — Fire edge function (fire-and-forget; edge fn updates DB itself)
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            fetch(`${SUPABASE_URL}/functions/v1/send-broadcast`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ broadcast_id: broadcast.id }),
            }).catch(console.error); // non-blocking

            setActiveSending((prev) => new Set(prev).add(broadcast.id));
            setShowCreate(false);
            resetForm();
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        await supabase.from("broadcasts").delete().eq("id", id);
        setDeleteTarget(null);
        loadBroadcasts();
    };

    const resetForm = () => {
        setTemplateName("");
        setTemplateLanguage("en_US");
        setSendTo("all");
        setManualNums("");
        setCreateError("");
    };

    // ── Computed stats ────────────────────────────────────────────────────────

    const totalSent = broadcasts.reduce((s, b) => s + b.total_sent, 0);
    const totalDelivered = broadcasts.reduce((s, b) => s + b.total_delivered, 0);
    const totalRead = broadcasts.reduce((s, b) => s + b.total_read, 0);

    const statsCards = [
        { label: "Total Campaigns", value: broadcasts.length, icon: Radio, color: "text-[#0084ff]" },
        { label: "Total Sent", value: totalSent.toLocaleString(), icon: Send, color: "text-[#00c853]" },
        { label: "Avg Delivered", value: `${pct(totalDelivered, totalSent)}%`, icon: CheckCircle2, color: "text-purple-400" },
        { label: "Avg Read Rate", value: `${pct(totalRead, totalSent)}%`, icon: BarChart2, color: "text-orange-400" },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppLayout>
            <div className="min-h-screen bg-black p-6 space-y-6">

                {/* ── Page header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                            <Megaphone className="h-6 w-6 text-[#0084ff]" />
                            Broadcasts
                        </h1>
                        <p className="text-sm text-white/40 mt-1">
                            Send WhatsApp template messages to your contacts at scale — flat fee, no per-message charges.
                        </p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowCreate(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0084ff] hover:bg-[#0084ff]/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[#0084ff]/20"
                    >
                        <Plus className="h-4 w-4" />
                        New Broadcast
                    </button>
                </div>

                {/* ── Stats row ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statsCards.map((s) => (
                        <div
                            key={s.label}
                            className="bg-[#0f1117] border border-white/[0.06] rounded-2xl p-4 space-y-2"
                        >
                            <div className="flex items-center gap-2">
                                <s.icon className={`h-4 w-4 ${s.color}`} />
                                <span className="text-[11px] text-white/40 font-medium">{s.label}</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* ── Broadcasts table ─────────────────────────────────────────── */}
                <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white">Campaigns</h2>
                        <span className="text-xs text-white/30">{broadcasts.length} total</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-white/40 gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading broadcasts…</span>
                        </div>
                    ) : broadcasts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                            <div className="h-14 w-14 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                                <Megaphone className="h-6 w-6 text-white/20" />
                            </div>
                            <p className="text-sm font-medium text-white/50">No broadcasts yet</p>
                            <p className="text-xs text-white/30 mt-1 max-w-xs">
                                Send your first WhatsApp template broadcast to all contacts in one click.
                            </p>
                            <button
                                onClick={() => { resetForm(); setShowCreate(true); }}
                                className="mt-5 flex items-center gap-2 px-3.5 py-2 bg-[#0084ff]/10 hover:bg-[#0084ff]/20 text-[#0084ff] rounded-xl text-xs font-semibold transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Create Broadcast
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.06]">
                                        {["Template", "From Number", "Status", "Progress", "Delivered", "Read Rate", "Created", ""].map((h) => (
                                            <th
                                                key={h}
                                                className="text-left text-[11px] font-medium text-white/40 px-5 py-3 whitespace-nowrap"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {broadcasts.map((b) => {
                                        const sc = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.draft;
                                        const isSending = sc.spin || activeSending.has(b.id);
                                        const deliveredPct = pct(b.total_delivered, b.total_sent);
                                        const readPct = pct(b.total_read, b.total_sent);
                                        const sentPct = pct(b.total_sent, b.total_contacts);

                                        return (
                                            <tr
                                                key={b.id}
                                                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                                            >
                                                {/* Template */}
                                                <td className="px-5 py-3.5">
                                                    <div className="font-medium text-white">{b.template_name}</div>
                                                    <div className="text-[11px] text-white/30 mt-0.5">{b.template_language}</div>
                                                </td>

                                                {/* From number */}
                                                <td className="px-5 py-3.5">
                                                    <div className="text-white/70 text-xs">
                                                        {b.connected_phone_numbers?.display_name ?? "—"}
                                                    </div>
                                                    <div className="text-[11px] text-white/30 font-mono">
                                                        {b.connected_phone_numbers?.phone_number ?? ""}
                                                    </div>
                                                </td>

                                                {/* Status badge */}
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.color}`}
                                                    >
                                                        {isSending && (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        )}
                                                        {sc.label}
                                                    </span>
                                                </td>

                                                {/* Progress bar */}
                                                <td className="px-5 py-3.5">
                                                    <div className="text-[11px] text-white/50 mb-1.5">
                                                        {b.total_sent.toLocaleString()} / {b.total_contacts.toLocaleString()}
                                                    </div>
                                                    <div className="w-28 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#0084ff] rounded-full transition-all duration-500"
                                                            style={{ width: `${sentPct}%` }}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Delivered */}
                                                <td className="px-5 py-3.5">
                                                    <div className="text-white/70 font-medium">{deliveredPct}%</div>
                                                    <div className="text-[11px] text-white/30">{b.total_delivered.toLocaleString()} msgs</div>
                                                </td>

                                                {/* Read rate */}
                                                <td className="px-5 py-3.5">
                                                    <div className="text-white/70 font-medium">{readPct}%</div>
                                                    <div className="text-[11px] text-white/30">{b.total_read.toLocaleString()} msgs</div>
                                                </td>

                                                {/* Date */}
                                                <td className="px-5 py-3.5 text-[11px] text-white/40 whitespace-nowrap">
                                                    {timeAgo(b.created_at)}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setViewBroadcast(b)}
                                                            title="View recipients"
                                                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(b.id)}
                                                            title="Delete broadcast"
                                                            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create Broadcast Modal ───────────────────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
                    <div className="w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-2.5">
                                <Megaphone className="h-5 w-5 text-[#0084ff]" />
                                <h3 className="text-base font-semibold text-white">New Broadcast</h3>
                            </div>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-5">

                            {/* Template name */}
                            <div>
                                <label className="block text-xs font-medium text-white/60 mb-1.5">
                                    Template Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g. hello_world"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#0084ff]/50 transition-colors"
                                />
                                <p className="text-[11px] text-white/30 mt-1.5">
                                    Must exactly match an approved template name in Meta Business Manager.
                                </p>
                            </div>

                            {/* Language */}
                            <div>
                                <label className="block text-xs font-medium text-white/60 mb-1.5">
                                    Template Language
                                </label>
                                <select
                                    value={templateLanguage}
                                    onChange={(e) => setTemplateLanguage(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#0084ff]/50 transition-colors appearance-none cursor-pointer"
                                >
                                    {LANGUAGES.map((l) => (
                                        <option key={l.code} value={l.code} className="bg-[#0f1117]">
                                            {l.label} ({l.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Send from number */}
                            <div>
                                <label className="block text-xs font-medium text-white/60 mb-1.5">
                                    Send From <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={selectedConn}
                                    onChange={(e) => setSelectedConn(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#0084ff]/50 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="bg-[#0f1117]">
                                        — Select a WhatsApp number —
                                    </option>
                                    {connections.map((c) => (
                                        <option key={c.id} value={c.id} className="bg-[#0f1117]">
                                            {c.display_name} · {c.phone_number}
                                            {!c.access_token ? " ⚠ No token" : ""}
                                        </option>
                                    ))}
                                </select>
                                {selectedConn && !connections.find((c) => c.id === selectedConn)?.access_token && (
                                    <p className="text-[11px] text-orange-400 mt-1.5 flex items-center gap-1.5">
                                        <AlertCircle className="h-3 w-3" />
                                        No access token on this number. Add it in Connections → edit.
                                    </p>
                                )}
                            </div>

                            {/* Recipients */}
                            <div>
                                <label className="block text-xs font-medium text-white/60 mb-2">Send To</label>
                                <div className="space-y-2">
                                    {/* All contacts */}
                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-white/10 cursor-pointer transition-colors">
                                        <input
                                            type="radio"
                                            checked={sendTo === "all"}
                                            onChange={() => setSendTo("all")}
                                            className="accent-[#0084ff] shrink-0"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 text-sm text-white">
                                                <Users className="h-3.5 w-3.5 text-[#0084ff]" />
                                                All Contacts
                                            </div>
                                            <div className="text-[11px] text-white/35 mt-0.5">
                                                {contacts.length} contacts in your account
                                            </div>
                                        </div>
                                    </label>

                                    {/* Manual */}
                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-white/10 cursor-pointer transition-colors">
                                        <input
                                            type="radio"
                                            checked={sendTo === "manual"}
                                            onChange={() => setSendTo("manual")}
                                            className="accent-[#0084ff] shrink-0"
                                        />
                                        <div className="text-sm text-white">Paste Numbers Manually</div>
                                    </label>
                                </div>

                                {/* Textarea — only shown when manual */}
                                {sendTo === "manual" && (
                                    <div className="mt-3">
                                        <textarea
                                            value={manualNums}
                                            onChange={(e) => setManualNums(e.target.value)}
                                            placeholder={"919876543210\n918989568529\n...\nOne per line or comma-separated"}
                                            rows={4}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#0084ff]/50 transition-colors font-mono resize-none"
                                        />
                                        <p className="text-[11px] text-white/35 mt-1">
                                            {
                                                manualNums
                                                    .split(/[\n,;]+/)
                                                    .filter((n) => n.trim().length >= 10).length
                                            }{" "}
                                            valid numbers detected
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Error state */}
                            {createError && (
                                <div className="flex items-start gap-2.5 p-3.5 bg-red-500/[0.07] border border-red-500/20 rounded-xl">
                                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-400">{createError}</p>
                                </div>
                            )}

                            {/* Meta template info note */}
                            <div className="flex items-start gap-2.5 p-3.5 bg-[#0084ff]/[0.05] border border-[#0084ff]/10 rounded-xl">
                                <AlertCircle className="h-4 w-4 text-[#0084ff]/60 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-white/35 leading-relaxed">
                                    Only Meta-approved templates can be broadcast. Approve yours at{" "}

                                    href="https://business.facebook.com/wa/manage/message-templates/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0084ff]/70 hover:text-[#0084ff] underline underline-offset-2"
                  >
                                    Meta Business Manager
                                </a>
                                . Template variables ({"{{1}}"}, {"{{2}}"}) are not yet supported — plain templates only.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#0084ff] hover:bg-[#0084ff]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[#0084ff]/20"
                        >
                            {creating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {creating ? "Sending…" : "Send Now"}
                        </button>
                    </div>
                </div>
        </div>
    )
}

{/* ── View Recipients Modal ────────────────────────────────────────────── */ }
{
    viewBroadcast && (
        <RecipientsModal
            broadcast={viewBroadcast}
            onClose={() => setViewBroadcast(null)}
        />
    )
}

{/* ── Delete Confirmation ──────────────────────────────────────────────── */ }
{
    deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-11 w-11 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <Trash2 className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Delete Broadcast?</h3>
                        <p className="text-xs text-white/40 mt-0.5">
                            All recipient records will also be deleted. This cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setDeleteTarget(null)}
                        className="flex-1 px-4 py-2.5 text-sm text-white/60 border border-white/10 rounded-xl hover:bg-white/[0.04] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleDelete(deleteTarget)}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}
    </AppLayout >
  );
}

// ─── Recipients Modal ─────────────────────────────────────────────────────────

function RecipientsModal({
    broadcast,
    onClose,
}: {
    broadcast: Broadcast;
    onClose: () => void;
}) {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const { data } = await supabase
                .from("broadcast_recipients")
                .select("id, phone_number, contact_name, status, sent_at, error_message")
                .eq("broadcast_id", broadcast.id)
                .order("created_at");
            setRecipients((data as Recipient[]) ?? []);
            setLoading(false);
        })();
    }, [broadcast.id]);

    const RSTATUS: Record<string, { color: string }> = {
        pending: { color: "text-white/40" },
        sent: { color: "text-[#0084ff]" },
        delivered: { color: "text-[#00c853]" },
        read: { color: "text-purple-400" },
        failed: { color: "text-red-400" },
    };

    const sc = STATUS_CONFIG[broadcast.status] ?? STATUS_CONFIG.draft;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
            <div className="w-full max-w-2xl bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                    <div>
                        <p className="text-sm font-semibold text-white">{broadcast.template_name}</p>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${sc.color}`}>
                                {sc.label}
                            </span>
                            <span className="text-[11px] text-white/35">
                                {broadcast.total_sent.toLocaleString()} sent ·{" "}
                                {pct(broadcast.total_delivered, broadcast.total_sent)}% delivered ·{" "}
                                {pct(broadcast.total_read, broadcast.total_sent)}% read
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Recipients table */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-white/40 gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading recipients…</span>
                        </div>
                    ) : recipients.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-sm text-white/40">
                            No recipients found.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-[#0f1117]">
                                <tr className="border-b border-white/[0.06]">
                                    {["Contact", "Phone", "Status", "Sent At", "Error"].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left text-[11px] font-medium text-white/40 px-5 py-3"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recipients.map((r) => {
                                    const rs = RSTATUS[r.status] ?? RSTATUS.pending;
                                    return (
                                        <tr
                                            key={r.id}
                                            className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                                        >
                                            <td className="px-5 py-3 text-white/70">
                                                {r.contact_name ?? <span className="text-white/30">—</span>}
                                            </td>
                                            <td className="px-5 py-3 text-white/50 font-mono text-xs">
                                                {r.phone_number}
                                            </td>
                                            <td className={`px-5 py-3 text-xs font-semibold capitalize ${rs.color}`}>
                                                {r.status}
                                            </td>
                                            <td className="px-5 py-3 text-[11px] text-white/40">
                                                {r.sent_at ? timeAgo(r.sent_at) : "—"}
                                            </td>
                                            <td className="px-5 py-3 text-[11px] text-red-400 max-w-[180px] truncate">
                                                {r.error_message ?? "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
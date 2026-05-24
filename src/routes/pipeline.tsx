import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { KanbanSquare, Plus, X, IndianRupee, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stage {
    id: string;
    name: string;
    order: number;
    colour: string;
}

interface Deal {
    id: string;
    title: string;
    value: number;
    stage: string;
    notes: string | null;
    created_at: string;
    contact_id: string | null;
    contacts?: { name: string | null; phone_number: string } | null;
}

interface Contact {
    id: string;
    name: string | null;
    phone_number: string;
}

const EMPTY_FORM = { title: "", contact_id: "", value: "", stage: "", notes: "" };

// ─── Route declaration ────────────────────────────────────────────────────────

export const Route = createFileRoute("/pipeline")({
    head: () => ({ meta: [{ title: "Pipeline — Replora" }] }),
    component: () => (
        <AppLayout>
            <PipelinePage />
        </AppLayout>
    ),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatINR(val: number): string {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString("en-IN")}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

function PipelinePage() {
    const [stages, setStages] = useState<Stage[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [agencyId, setAgencyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Drag & drop (HTML5 native — no extra library needed)
    const dragDealId = useRef<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);

    // ── Load agency_id once ──
    useEffect(() => {
        const init = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("users")
                .select("agency_id")
                .eq("id", user.id)
                .single();
            if (data) setAgencyId((data as { agency_id: string }).agency_id);
        };
        init();
    }, []);

    // ── Load stages ──
    useEffect(() => {
        if (!agencyId) return;
        supabase
            .from("pipeline_stages")
            .select("*")
            .eq("agency_id", agencyId)
            .order("order")
            .then(({ data }) => {
                if (data) setStages(data as Stage[]);
            });
    }, [agencyId]);

    // ── Load deals (with contact name) ──
    const loadDeals = async () => {
        const { data } = await supabase
            .from("deals")
            .select("*, contacts(name, phone_number)")
            .order("created_at", { ascending: false });
        if (data) setDeals(data as Deal[]);
        setLoading(false);
    };

    useEffect(() => {
        loadDeals();
        // Realtime: update board whenever a deal changes
        const ch = supabase
            .channel("pipeline-deals-rt")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "deals" },
                loadDeals,
            )
            .subscribe();
        return () => {
            supabase.removeChannel(ch);
        };
    }, []);

    // ── Load contacts for dropdown ──
    useEffect(() => {
        supabase
            .from("contacts")
            .select("id, name, phone_number")
            .order("name")
            .then(({ data }) => {
                if (data) setContacts(data as Contact[]);
            });
    }, []);

    // ── Derived: total pipeline value ──
    const totalPipelineValue = deals.reduce(
        (sum, d) => sum + (Number(d.value) || 0),
        0,
    );

    // ── Modal helpers ──
    const openAdd = (stageName?: string) => {
        setEditingDeal(null);
        setForm({ ...EMPTY_FORM, stage: stageName ?? stages[0]?.name ?? "" });
        setModalOpen(true);
    };

    const openEdit = (deal: Deal) => {
        setEditingDeal(deal);
        setForm({
            title: deal.title,
            contact_id: deal.contact_id ?? "",
            value: String(deal.value ?? ""),
            stage: deal.stage,
            notes: deal.notes ?? "",
        });
        setModalOpen(true);
    };

    // ── Save deal ──
    const saveDeal = async () => {
        if (!form.title.trim() || !agencyId) return;
        setSaving(true);
        const payload = {
            title: form.title.trim(),
            contact_id: form.contact_id || null,
            value: parseFloat(form.value) || 0,
            stage: form.stage,
            notes: form.notes || null,
            agency_id: agencyId,
        };
        if (editingDeal) {
            await supabase.from("deals").update(payload).eq("id", editingDeal.id);
        } else {
            await supabase.from("deals").insert(payload);
        }
        setSaving(false);
        setModalOpen(false);
        loadDeals();
    };

    // ── Delete deal ──
    const deleteDeal = async (id: string) => {
        await supabase.from("deals").delete().eq("id", id);
        setDeleteConfirm(null);
        setModalOpen(false);
        loadDeals();
    };

    // ── Drag handlers ──
    const onDragStart = (dealId: string) => {
        dragDealId.current = dealId;
    };
    const onDragOver = (e: React.DragEvent, stageName: string) => {
        e.preventDefault();
        setDragOverStage(stageName);
    };
    const onDrop = async (stageName: string) => {
        const dealId = dragDealId.current;
        if (!dealId) return;
        dragDealId.current = null;
        setDragOverStage(null);
        // Optimistic update — move card instantly
        setDeals((prev) =>
            prev.map((d) => (d.id === dealId ? { ...d, stage: stageName } : d)),
        );
        await supabase
            .from("deals")
            .update({ stage: stageName })
            .eq("id", dealId);
    };
    const onDragEnd = () => {
        dragDealId.current = null;
        setDragOverStage(null);
    };

    // ─────────────────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 md:p-8 flex flex-col min-h-full">

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <KanbanSquare className="h-6 w-6 text-[#0084ff]" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Sales Pipeline
                        </h1>
                        <p className="text-sm text-white/60 mt-0.5">
                            Drag deals between stages to track progress
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Total pipeline value badge */}
                    <div className="bg-[#00c853]/10 border border-[#00c853]/20 rounded-xl px-4 py-2">
                        <div className="text-[11px] text-[#00c853]/80 uppercase tracking-wider font-semibold">
                            Total Pipeline
                        </div>
                        <div className="text-lg font-bold text-[#00c853]">
                            {formatINR(totalPipelineValue)}
                        </div>
                    </div>

                    <button
                        onClick={() => openAdd()}
                        className="flex items-center gap-2 bg-[#0084ff] hover:bg-[#0084ff]/90 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Deal
                    </button>
                </div>
            </div>

            {/* ── Kanban Board ── */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
                    Loading pipeline…
                </div>
            ) : stages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
                    No pipeline stages found. Check your Supabase connection.
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
                    {stages.map((stage) => {
                        const stageDeals = deals.filter((d) => d.stage === stage.name);
                        const stageValue = stageDeals.reduce(
                            (sum, d) => sum + (Number(d.value) || 0),
                            0,
                        );
                        const isOver = dragOverStage === stage.name;

                        return (
                            <div
                                key={stage.id}
                                className={`flex-shrink-0 w-[288px] flex flex-col rounded-2xl border transition-all duration-150 ${isOver
                                        ? "border-white/30 bg-white/[0.04] scale-[1.01]"
                                        : "border-white/[0.08] bg-[#0f1117]"
                                    }`}
                                onDragOver={(e) => onDragOver(e, stage.name)}
                                onDrop={() => onDrop(stage.name)}
                                onDragLeave={() => setDragOverStage(null)}
                            >
                                {/* Column header */}
                                <div className="p-4 border-b border-white/[0.06]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: stage.colour }}
                                            />
                                            <span className="text-sm font-semibold text-white">
                                                {stage.name}
                                            </span>
                                            <span className="text-[11px] font-bold bg-white/10 text-white/60 rounded-full px-2 py-0.5">
                                                {stageDeals.length}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => openAdd(stage.name)}
                                            className="h-6 w-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-colors"
                                            title="Add deal to this stage"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    {stageValue > 0 && (
                                        <div className="text-xs text-white/40 mt-1.5 font-medium">
                                            {formatINR(stageValue)}
                                        </div>
                                    )}
                                </div>

                                {/* Deal cards */}
                                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)]">
                                    {stageDeals.map((deal) => (
                                        <div
                                            key={deal.id}
                                            draggable
                                            onDragStart={() => onDragStart(deal.id)}
                                            onDragEnd={onDragEnd}
                                            className="bg-[#1a1a2e] border border-white/[0.08] rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-white leading-snug truncate">
                                                        {deal.title}
                                                    </div>
                                                    {deal.contacts && (
                                                        <div className="text-[11px] text-white/50 mt-0.5 truncate">
                                                            {deal.contacts.name || deal.contacts.phone_number}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => openEdit(deal)}
                                                    className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
                                                    title="Edit deal"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                            </div>

                                            {Number(deal.value) > 0 && (
                                                <div className="mt-2 flex items-center gap-0.5 text-[#00c853] font-semibold text-sm">
                                                    <IndianRupee className="h-3.5 w-3.5" />
                                                    {Number(deal.value).toLocaleString("en-IN")}
                                                </div>
                                            )}

                                            <div className="mt-2 text-[10px] text-white/30">
                                                {formatDistanceToNow(new Date(deal.created_at), {
                                                    addSuffix: true,
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Empty column drop zone */}
                                    {stageDeals.length === 0 && (
                                        <button
                                            onClick={() => openAdd(stage.name)}
                                            className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center gap-2 transition-colors ${isOver
                                                    ? "border-white/30 bg-white/5"
                                                    : "border-white/[0.06] hover:border-white/15"
                                                }`}
                                        >
                                            <Plus className="h-5 w-5 text-white/20" />
                                            <span className="text-xs text-white/30">Add deal</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Add / Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                            <h2 className="text-base font-semibold text-white">
                                {editingDeal ? "Edit Deal" : "Add Deal"}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-5 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                                    Deal Title *
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, title: e.target.value }))
                                    }
                                    placeholder="e.g. Website Chatbot Setup"
                                    className="mt-1.5 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#0084ff]/60 transition-colors"
                                />
                            </div>

                            {/* Contact */}
                            <div>
                                <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                                    Contact (optional)
                                </label>
                                <select
                                    value={form.contact_id}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, contact_id: e.target.value }))
                                    }
                                    className="mt-1.5 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0084ff]/60 transition-colors"
                                >
                                    <option value="">— No contact —</option>
                                    {contacts.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name ? `${c.name} (${c.phone_number})` : c.phone_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Value + Stage row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                                        Value (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.value}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, value: e.target.value }))
                                        }
                                        placeholder="0"
                                        className="mt-1.5 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#0084ff]/60 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                                        Stage
                                    </label>
                                    <select
                                        value={form.stage}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, stage: e.target.value }))
                                        }
                                        className="mt-1.5 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0084ff]/60 transition-colors"
                                    >
                                        {stages.map((s) => (
                                            <option key={s.id} value={s.name}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, notes: e.target.value }))
                                    }
                                    placeholder="Any context about this deal…"
                                    rows={3}
                                    className="mt-1.5 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#0084ff]/60 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="p-5 pt-0 flex items-center gap-3">
                            {editingDeal && (
                                <button
                                    onClick={() => setDeleteConfirm(editingDeal.id)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            )}
                            <div className="flex-1" />
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveDeal}
                                disabled={saving || !form.title.trim()}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0084ff] hover:bg-[#0084ff]/90 text-white transition-colors disabled:opacity-50"
                            >
                                {saving ? "Saving…" : editingDeal ? "Save Changes" : "Add Deal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete confirm ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-base font-semibold text-white">
                            Delete this deal?
                        </h3>
                        <p className="text-sm text-white/60 mt-2">
                            This cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteDeal(deleteConfirm)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
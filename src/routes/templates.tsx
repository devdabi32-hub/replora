import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import {
  LayoutTemplate, Plus, RefreshCw, X, MoreVertical, Trash2, Copy, Eye,
  CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, ChevronLeft,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Templates — Replora" }] }),
  component: () => (
    <AppLayout>
      <TemplatesPage />
    </AppLayout>
  ),
});

type Connection = {
  id: string;
  display_name: string;
  phone_number_id: string;
  waba_id: string | null;
};

type TemplateButton =
  | { type: "QUICK_REPLY"; text: string }
  | { type: "URL"; text: string; url: string }
  | { type: "PHONE_NUMBER"; text: string; phone_number: string };

type Template = {
  id: string;
  agency_id: string;
  connection_id: string | null;
  name: string;
  category: string;
  language: string;
  header_type: string | null;
  header_content: string | null;
  body_text: string;
  footer_text: string | null;
  buttons: TemplateButton[] | null;
  status: string;
  rejection_reason: string | null;
  meta_template_id: string | null;
  variable_count: number | null;
  created_at: string;
};

const LANGUAGES: { code: string; label: string }[] = [
  { code: "en_US", label: "English (US)" },
  { code: "en_GB", label: "English (UK)" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "gu", label: "Gujarati" },
  { code: "pa", label: "Punjabi" },
  { code: "bn", label: "Bengali" },
  { code: "ms", label: "Malay" },
  { code: "id", label: "Indonesian" },
  { code: "ar", label: "Arabic" },
];

const CATEGORIES = [
  { value: "MARKETING", label: "Marketing", desc: "Promotions, offers, announcements (1–24h approval)", color: "#0084ff" },
  { value: "UTILITY", label: "Utility", desc: "Order updates, appointment reminders (minutes)", color: "#00c853" },
  { value: "AUTHENTICATION", label: "Authentication", desc: "OTP, verification codes (minutes)", color: "#a855f7" },
];

function statusBadge(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "APPROVED") return { label: "Approved", color: "#00c853", bg: "rgba(0,200,83,0.15)", icon: <CheckCircle2 className="h-3 w-3" /> };
  if (s === "PENDING") return { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: <Clock className="h-3 w-3" /> };
  if (s === "REJECTED") return { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: <XCircle className="h-3 w-3" /> };
  if (s === "IN_APPEAL") return { label: "In Appeal", color: "#f97316", bg: "rgba(249,115,22,0.15)", icon: <AlertCircle className="h-3 w-3" /> };
  return { label: s || "Unknown", color: "#6b7280", bg: "rgba(107,114,128,0.15)", icon: <Clock className="h-3 w-3" /> };
}

function categoryBadge(cat: string) {
  const c = (cat || "").toUpperCase();
  if (c === "MARKETING") return { color: "#0084ff", bg: "rgba(0,132,255,0.15)" };
  if (c === "UTILITY") return { color: "#00c853", bg: "rgba(0,200,83,0.15)" };
  if (c === "AUTHENTICATION") return { color: "#a855f7", bg: "rgba(168,85,247,0.15)" };
  return { color: "#6b7280", bg: "rgba(107,114,128,0.15)" };
}

function TemplatesPage() {
  const { agencyId } = useAccountStatus();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConn, setSelectedConn] = useState<string>("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [preview, setPreview] = useState<Template | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadConnections = useCallback(async () => {
    if (!agencyId) return;
    const { data } = await supabase
      .from("connected_phone_numbers")
      .select("id, display_name, phone_number_id, waba_id")
      .eq("agency_id", agencyId)
      .eq("is_active", true);
    const list = (data ?? []) as Connection[];
    setConnections(list);
    if (list.length && !selectedConn) setSelectedConn(list[0].id);
  }, [agencyId, selectedConn]);

  const loadTemplates = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("message_templates")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    setTemplates((data as Template[]) ?? []);
    setLoading(false);
  }, [agencyId]);

  useEffect(() => { loadConnections(); }, [loadConnections]);
  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const stats = useMemo(() => {
    let approved = 0, pending = 0, rejected = 0;
    for (const t of templates) {
      const s = (t.status || "").toUpperCase();
      if (s === "APPROVED") approved++;
      else if (s === "PENDING") pending++;
      else if (s === "REJECTED") rejected++;
    }
    return { approved, pending, rejected };
  }, [templates]);

  const handleSync = async () => {
    if (!selectedConn) { toast.error("Select a connection first"); return; }
    setSyncing(true);
    toast.info("Syncing templates from Meta...");
    const { data, error } = await supabase.functions.invoke("template-manager", {
      body: { action: "sync", connection_id: selectedConn },
    });
    setSyncing(false);
    if (error) { toast.error(error.message || "Sync failed"); return; }
    toast.success((data as any)?.message ?? "Templates synced from Meta");
    loadTemplates();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const { error } = await supabase.functions.invoke("template-manager", {
      body: { action: "delete", connection_id: confirmDelete.connection_id, template_id: confirmDelete.id, template_name: confirmDelete.name },
    });
    setDeleting(false);
    if (error) { toast.error(error.message || "Delete failed"); return; }
    toast.success("Template deleted");
    setTemplates((ts) => ts.filter((t) => t.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const copyName = async (name: string) => {
    await navigator.clipboard.writeText(name);
    toast.success("Template name copied");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 space-y-8">
      {/* WABA ID requirement banner */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3">
        <Clock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-sm text-white/80">
          <strong>⚠️ Templates require WABA ID</strong> to be set on your connection. <span className="text-white/60">WABA ID ≠ Phone Number ID.</span> Find it in Meta Business Manager → WhatsApp Accounts. Template approval takes 24-48 hours.
        </p>
      </div>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Templates</h1>
          <p className="text-sm text-white/60 mt-1.5">Manage your WhatsApp message templates</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {connections.length > 1 && (
            <select
              value={selectedConn}
              onChange={(e) => setSelectedConn(e.target.value)}
              className="h-10 px-3 rounded-lg bg-white/[0.08] border border-white/15 text-white text-sm"
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0f1117]">{c.display_name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleSync}
            disabled={syncing || !selectedConn}
            className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync from Meta
          </button>
          <button
            onClick={() => setShowCreate(true)}
            disabled={!selectedConn}
            className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-[#0084ff] hover:bg-[#0066cc] text-white transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Approved" value={stats.approved} color="#00c853" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Pending" value={stats.pending} color="#f59e0b" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Rejected" value={stats.rejected} color="#ef4444" icon={<XCircle className="h-5 w-5" />} />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-white/40 text-sm">Loading templates…</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <LayoutTemplate className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/70 text-base font-medium">No templates yet</p>
          <p className="text-white/40 text-sm mt-1">Create your first template to start broadcasting</p>
          <button
            onClick={() => setShowCreate(true)}
            disabled={!selectedConn}
            className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-[#0084ff] hover:bg-[#0066cc] text-white transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => {
            const sb = statusBadge(t.status);
            const cb = categoryBadge(t.category);
            return (
              <div key={t.id} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-bold text-white truncate">{t.name}</div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ color: cb.color, background: cb.bg }}>
                        {t.category}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ color: sb.color, background: sb.bg }}>
                        {sb.icon}
                        {sb.label}
                      </span>
                      <span className="text-[10px] text-white/40">{t.language}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === t.id ? null : t.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === t.id && (
                      <div className="absolute right-0 top-9 z-10 w-40 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl py-1 text-sm overflow-hidden">
                        <button onClick={() => { setPreview(t); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/5">
                          <Eye className="h-4 w-4" /> Preview
                        </button>
                        <button onClick={() => { copyName(t.name); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/5">
                          <Copy className="h-4 w-4" /> Copy Name
                        </button>
                        <button onClick={() => { setConfirmDelete(t); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-white/70 line-clamp-2">{(t.body_text || "").slice(0, 80)}{(t.body_text || "").length > 80 ? "…" : ""}</p>
                {t.rejection_reason && t.rejection_reason !== 'NONE' && (
                  <p className="mt-2 text-[11px] text-red-400">Rejected: {t.rejection_reason}</p>
                )}
                <div className="mt-3 text-[11px] text-white/40">
                  Created {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateTemplateModal
          connectionId={selectedConn}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadTemplates(); }}
        />
      )}

      {preview && (
        <PreviewModal template={preview} onClose={() => setPreview(null)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">Delete template {confirmDelete.name}?</h2>
            </div>
            <p className="text-sm text-white/60 mb-6">
              This will also delete it from WhatsApp Business Manager.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} className="flex-1 h-11 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-semibold">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 h-11 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-white/60">{label}</div>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, color }}>{icon}</div>
      </div>
      <div className="text-3xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

/* ─── Create Template Modal ─── */

type HeaderType = "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
type ButtonDraft =
  | { kind: "QUICK_REPLY"; text: string }
  | { kind: "URL"; text: string; url: string }
  | { kind: "PHONE_NUMBER"; text: string; phone_number: string };

function CreateTemplateModal({
  connectionId,
  onClose,
  onCreated,
}: {
  connectionId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("en_US");
  const [headerType, setHeaderType] = useState<HeaderType>("NONE");
  const [headerText, setHeaderText] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<ButtonDraft[]>([]);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const variableMatches = useMemo(() => {
    const matches = Array.from(new Set((body.match(/\{\{\d+\}\}/g) || [])));
    return matches.sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));
  }, [body]);

  const addVariable = () => {
    const nums = variableMatches.map((m) => parseInt(m.replace(/\D/g, "")));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    setBody((b) => b + `{{${next}}}`);
  };

  const addButton = (kind: ButtonDraft["kind"]) => {
    if (buttons.length >= 3) { toast.error("Max 3 buttons"); return; }
    if (buttons.length) {
      const isQR = buttons[0].kind === "QUICK_REPLY";
      const wantsQR = kind === "QUICK_REPLY";
      if (isQR !== wantsQR) { toast.error("Cannot mix Quick Reply and CTA buttons"); return; }
    }
    if (kind === "QUICK_REPLY") setButtons((bs) => [...bs, { kind, text: "" }]);
    else if (kind === "URL") setButtons((bs) => [...bs, { kind, text: "", url: "" }]);
    else setButtons((bs) => [...bs, { kind, text: "", phone_number: "" }]);
  };

  const updateButton = (idx: number, patch: Partial<ButtonDraft>) => {
    setButtons((bs) => bs.map((b, i) => (i === idx ? ({ ...b, ...patch } as ButtonDraft) : b)));
  };

  const removeButton = (idx: number) => setButtons((bs) => bs.filter((_, i) => i !== idx));

  const validateBuild = (): string | null => {
    if (!/^[a-z0-9_]+$/.test(name)) return "Name must be lowercase letters, numbers and underscores only";
    if (!body.trim()) return "Body is required";
    if (headerType === "TEXT" && !headerText.trim()) return "Header text required";
    for (const b of buttons) {
      if (!b.text.trim()) return "All button labels required";
      if (b.kind === "URL" && !(b as any).url.trim()) return "Button URL required";
      if (b.kind === "PHONE_NUMBER" && !(b as any).phone_number.trim()) return "Button phone number required";
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validateBuild();
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    const payload: any = {
      action: "create",
      connection_id: connectionId,
      name: name.trim(),
      category,
      language,
      body_text: body,
      footer_text: footer.trim() || null,
      header_type: headerType === "NONE" ? null : headerType,
      header_content: headerType === "TEXT" ? headerText : null,
      buttons: buttons.length
        ? buttons.map((b) =>
          b.kind === "QUICK_REPLY"
            ? { type: "QUICK_REPLY", text: b.text }
            : b.kind === "URL"
              ? { type: "URL", text: b.text, url: (b as any).url }
              : { type: "PHONE_NUMBER", text: b.text, phone_number: (b as any).phone_number },
        )
        : null,
      variable_count: variableMatches.length,
    };
    const { error } = await supabase.functions.invoke("template-manager", { body: payload });
    setSubmitting(false);
    if (error) { toast.error(error.message || "Submission failed"); return; }
    toast.success("Template submitted! Approval usually takes 1–24 hours.");
    onCreated();
  };

  const renderedBody = body.replace(/\{\{(\d+)\}\}/g, (_, n) => sampleValues[n] || `{{${n}}}`);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create Template</h2>
              <p className="text-xs text-white/60 mt-0.5">Submit a new WhatsApp message template to Meta</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10">
          {[
            { n: 1, label: "Build" },
            { n: 2, label: "Preview" },
            { n: 3, label: "Submit" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${step >= s.n ? "bg-[#0084ff] text-white" : "bg-white/10 text-white/40"}`}>{s.n}</div>
              <span className={`text-sm ${step >= s.n ? "text-white" : "text-white/40"}`}>{s.label}</span>
              {i < 2 && <div className={`flex-1 h-px ${step > s.n ? "bg-[#0084ff]" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <div className="px-6 py-5">
          {step === 1 && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Section title="Basic Info">
                <Field label="Template Name" hint="Lowercase, underscores only. This is permanent and cannot be changed.">
                  <input value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="order_ready" className={inp} />
                </Field>
                <Field label="Category">
                  <div className="space-y-2">
                    {CATEGORIES.map((c) => (
                      <label key={c.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${category === c.value ? "border-[#0084ff] bg-[#0084ff]/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
                        <input type="radio" name="category" value={c.value} checked={category === c.value} onChange={() => setCategory(c.value)} className="mt-1 accent-[#0084ff]" />
                        <div>
                          <div className="text-sm font-semibold text-white">{c.label}</div>
                          <div className="text-xs text-white/50">{c.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Language">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inp}>
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-[#0f1117]">{l.label} ({l.code})</option>
                    ))}
                  </select>
                </Field>
              </Section>

              {/* Header */}
              <Section title="Header (optional)">
                <div className="flex gap-2 flex-wrap">
                  {(["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"] as HeaderType[]).map((h) => (
                    <button key={h} onClick={() => setHeaderType(h)} className={`px-3 h-8 rounded-lg text-xs font-semibold border transition-colors ${headerType === h ? "bg-[#0084ff] border-[#0084ff] text-white" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]"}`}>{h}</button>
                  ))}
                </div>
                {headerType === "TEXT" && (
                  <input value={headerText} onChange={(e) => setHeaderText(e.target.value)} maxLength={60} placeholder="Header text (max 60 chars, supports one {{1}})" className={`mt-3 ${inp}`} />
                )}
                {(headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") && (
                  <p className="mt-3 text-xs text-white/50 bg-white/[0.04] border border-white/10 rounded-lg p-3">
                    You'll provide the actual file when sending a broadcast. Just select the type here.
                  </p>
                )}
              </Section>

              {/* Body */}
              <Section title="Body (required)">
                <div className="relative">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 1024))}
                    placeholder="Hi {{1}}, your order is ready for pickup."
                    rows={5}
                    className={`${inp} resize-none min-h-[110px] py-2.5`}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={addVariable} className="text-xs text-[#0084ff] hover:text-[#3398ff] font-semibold inline-flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add Variable
                    </button>
                    <span className="text-[11px] text-white/40">{body.length}/1024</span>
                  </div>
                </div>
                {variableMatches.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-white/60">Sample values for preview (not sent to Meta):</div>
                    {variableMatches.map((v) => {
                      const num = v.replace(/\D/g, "");
                      return (
                        <div key={v} className="flex items-center gap-2">
                          <span className="font-mono text-xs text-white/70 w-12">{v} =</span>
                          <input value={sampleValues[num] || ""} onChange={(e) => setSampleValues((s) => ({ ...s, [num]: e.target.value }))} placeholder="sample text" className={`flex-1 ${inp} h-9`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              {/* Footer */}
              <Section title="Footer (optional)">
                <input value={footer} onChange={(e) => setFooter(e.target.value.slice(0, 60))} placeholder="Reply STOP to unsubscribe" className={inp} />
              </Section>

              {/* Buttons */}
              <Section title="Buttons (optional, max 3)">
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => addButton("QUICK_REPLY")} className="px-3 h-8 rounded-lg text-xs font-semibold bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.08]">+ Quick Reply</button>
                  <button onClick={() => addButton("URL")} className="px-3 h-8 rounded-lg text-xs font-semibold bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.08]">+ CTA URL</button>
                  <button onClick={() => addButton("PHONE_NUMBER")} className="px-3 h-8 rounded-lg text-xs font-semibold bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.08]">+ CTA Phone</button>
                </div>
                {buttons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {buttons.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-white/50 w-20">{b.kind === "PHONE_NUMBER" ? "PHONE" : b.kind === "URL" ? "URL" : "REPLY"}</span>
                        <input value={b.text} maxLength={25} onChange={(e) => updateButton(i, { text: e.target.value })} placeholder="Button label" className={`flex-1 min-w-[140px] ${inp} h-9`} />
                        {b.kind === "URL" && (
                          <input value={(b as any).url} onChange={(e) => updateButton(i, { url: e.target.value } as any)} placeholder="https://..." className={`flex-1 min-w-[160px] ${inp} h-9`} />
                        )}
                        {b.kind === "PHONE_NUMBER" && (
                          <input value={(b as any).phone_number} onChange={(e) => updateButton(i, { phone_number: e.target.value } as any)} placeholder="+919999999999" className={`flex-1 min-w-[160px] ${inp} h-9`} />
                        )}
                        <button onClick={() => removeButton(i)} className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <PhonePreview
                headerType={headerType}
                headerText={headerText}
                body={renderedBody}
                footer={footer}
                buttons={buttons}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 space-y-3 text-sm">
                <SummaryRow k="Name" v={<span className="font-mono">{name}</span>} />
                <SummaryRow k="Category" v={category} />
                <SummaryRow k="Language" v={language} />
                <SummaryRow k="Header" v={headerType === "NONE" ? "None" : headerType === "TEXT" ? `Text: ${headerText}` : headerType} />
                <SummaryRow k="Body" v={<span className="whitespace-pre-wrap">{body}</span>} />
                {footer && <SummaryRow k="Footer" v={footer} />}
                {buttons.length > 0 && (
                  <SummaryRow k="Buttons" v={buttons.map((b) => b.text).join(", ")} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/10">
          {step > 1 ? (
            <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} className="h-10 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm font-semibold inline-flex items-center gap-1.5">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1) {
                  const err = validateBuild();
                  if (err) { toast.error(err); return; }
                }
                setStep((s) => (s + 1) as 1 | 2 | 3);
              }}
              className="h-10 px-5 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold inline-flex items-center gap-1.5"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-10 px-5 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit to Meta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full h-11 px-3 rounded-lg bg-white/[0.06] border border-white/15 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 outline-none text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/80 block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-white/40 mt-1.5">{hint}</p>}
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="w-20 text-white/50 shrink-0">{k}</div>
      <div className="flex-1 text-white">{v}</div>
    </div>
  );
}

function PhonePreview({
  headerType, headerText, body, footer, buttons,
}: {
  headerType: HeaderType;
  headerText: string;
  body: string;
  footer: string;
  buttons: ButtonDraft[];
}) {
  return (
    <div className="mx-auto max-w-xs bg-[#0B141A] rounded-3xl border border-white/10 p-4 shadow-2xl">
      <div className="bg-[#005C4B] rounded-2xl rounded-tr-md p-3 text-white">
        {headerType === "TEXT" && headerText && (
          <div className="font-semibold text-sm mb-1.5">{headerText}</div>
        )}
        {(headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") && (
          <div className="bg-black/30 rounded-lg h-24 flex items-center justify-center text-xs text-white/60 mb-2">
            [{headerType} placeholder]
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">{body || <span className="italic text-white/60">Body preview…</span>}</div>
        {footer && <div className="text-[11px] text-white/60 mt-2">{footer}</div>}
      </div>
      {buttons.length > 0 && (
        <div className="mt-2 space-y-1">
          {buttons.map((b, i) => (
            <div key={i} className="bg-[#1C1C1E] text-[#53bdeb] text-center text-sm py-2 rounded-lg">{b.text || "Button"}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const buttons: ButtonDraft[] = (template.buttons || []).map((b: any) =>
    b.type === "URL"
      ? { kind: "URL", text: b.text, url: b.url }
      : b.type === "PHONE_NUMBER"
        ? { kind: "PHONE_NUMBER", text: b.text, phone_number: b.phone_number }
        : { kind: "QUICK_REPLY", text: b.text },
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white font-mono">{template.name}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <PhonePreview
          headerType={(template.header_type as HeaderType) || "NONE"}
          headerText={template.header_content || ""}
          body={template.body_text}
          footer={template.footer_text || ""}
          buttons={buttons}
        />
      </div>
    </div>
  );
}
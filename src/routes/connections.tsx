import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import {
  Phone, Plus, X, Eye, EyeOff, Copy, Check,
  AlertTriangle, Wifi, Sparkles, Trash2, ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/connections")({
  head: () => ({ meta: [{ title: "Connections — Replora" }] }),
  component: () => (
    <AppLayout>
      <ConnectionsPage />
    </AppLayout>
  ),
});

type Connection = {
  id: string;
  agency_id: string;
  label: string;
  phone_number: string;
  api_key: string | null;
  created_at: string;
  is_active: boolean;
};

const PLAN_LIMITS: Record<string, number> = {
  trial: 1,
  starter: 3,
  pro: 10,
  growth: 25,
  agency: Infinity,
};

function genApiKey() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "wam_sk_" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const inputClass =
  "w-full h-11 px-3 rounded-lg bg-white/[0.08] border border-white/15 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 outline-none text-sm";

function ConnectionsPage() {
  const { plan, isOwner } = useAccountStatus();
  const navigate = useNavigate();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPhoneId, setNewPhoneId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [newKeyCopied, setNewKeyCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Connection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [addonNumbers, setAddonNumbers] = useState(0);

  const basePlanLimit = PLAN_LIMITS[plan] ?? 1;
  const limit = isOwner
    ? Infinity
    : basePlanLimit === Infinity
    ? Infinity
    : basePlanLimit + addonNumbers;
  const atLimit = !isOwner && connections.length >= limit;
  const extraPriceMap: Record<string, number> = { starter: 499, pro: 399, growth: 299 };
  const extraPrice = extraPriceMap[plan];
  const usedCount = connections.length;
  const limitLabel = limit === Infinity ? "∞" : String(limit);
  const barPercent = limit === Infinity ? 0 : Math.min(100, (usedCount / limit) * 100);

  // Step 1 + 2: auth → users table → agency_id
  useEffect(() => {
    const resolveAgency = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) { setLoading(false); return; }
      const { data: userRow } = await supabase
        .from("users")
        .select("agency_id")
        .eq("id", userId)
        .single();
      const aid = userRow?.agency_id;
      if (!aid) { setLoading(false); return; }
      setAgencyId(aid);
    };
    resolveAgency();
  }, []);

  const load = async (aid: string) => {
    const { data: rows, error } = await supabase
      .from("connected_phone_numbers")
      .select("id, display_name, phone_number_id, api_key, message_count, connected_at, is_active")
      .eq("agency_id", aid);
    console.log("agencyId:", aid);
    console.log("connections:", rows);
    console.log("error:", error);
    const mapped: Connection[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      agency_id: aid,
      label: r.display_name,
      phone_number: r.phone_number_id,
      api_key: r.api_key,
      created_at: r.connected_at,
      is_active: r.is_active,
    }));
    setConnections(mapped);
    setLoading(false);
  };

  useEffect(() => {
    if (agencyId) load(agencyId);
  }, [agencyId]);

  // Fetch addon_numbers + subscribe to realtime changes
  useEffect(() => {
    if (!agencyId) return;
    const fetchAddons = async () => {
      const { data } = await supabase
        .from("agencies")
        .select("addon_numbers")
        .eq("id", agencyId)
        .single();
      setAddonNumbers(Number((data as any)?.addon_numbers ?? 0));
    };
    fetchAddons();

    const channel = supabase
      .channel(`agency-addons-${agencyId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agencies",
          filter: `id=eq.${agencyId}`,
        },
        (payload) => {
          const next = (payload.new as any)?.addon_numbers;
          if (next !== undefined) setAddonNumbers(Number(next ?? 0));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId]);

  const openModal = () => {
    if (atLimit) { setShowLimitModal(true); return; }
    setNewApiKey(null);
    setNewLabel("");
    setNewPhoneId("");
    setShowModal(true);
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) { toast.error("Display name required"); return; }
    if (!newPhoneId.trim()) { toast.error("Phone Number ID required"); return; }
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data: userRow } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", session!.user.id)
      .single();
    const { data, error } = await supabase
      .from("connected_phone_numbers")
      .insert({
        agency_id: userRow!.agency_id,
        phone_number_id: newPhoneId.trim(),
        display_name: newLabel.trim(),
        is_active: true,
      })
      .select()
      .single();
    console.log("insert result:", data);
    console.log("insert error:", error);
    setSubmitting(false);
    if (error) { alert("Error: " + error.message); return; }
    const finalKey = (data as any)?.api_key ?? "";
    setNewApiKey(finalKey);
    toast.success("Connection added");
    const aid = userRow!.agency_id;
    if (!agencyId) setAgencyId(aid);
    load(aid);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete || !agencyId) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_connection_with_data", {
      p_connection_id: confirmDelete.id,
      p_agency_id: agencyId,
    });
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    setConfirmDelete(null);
    toast.success("Connection deleted");
    load(agencyId);
  };

  const toggleVisible = (id: string) =>
    setVisible((v) => ({ ...v, [id]: !v[id] }));

  const copyKey = async (id: string, key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyNewKey = async () => {
    if (!newApiKey) return;
    await navigator.clipboard.writeText(newApiKey);
    setNewKeyCopied(true);
    setTimeout(() => setNewKeyCopied(false), 1500);
  };

  const mask = (k: string) =>
    k.slice(0, 8) + "•".repeat(Math.max(0, k.length - 12)) + k.slice(-4);

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Connections</h1>
          <p className="text-sm text-white/60 mt-1.5">
            Manage your connected WhatsApp numbers.
          </p>
        </div>
        {atLimit ? (
          <button
            onClick={() => navigate({ to: "/pricing" })}
            className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors bg-[#0084ff] hover:bg-[#0066cc] text-white"
          >
            <Plus className="h-4 w-4" />
            {extraPrice ? `Add Number — ₹${extraPrice}/mo` : "Add Number"}
          </button>
        ) : (
          <button
            onClick={openModal}
            className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors bg-[#0084ff] hover:bg-[#0066cc] text-white"
          >
            <Plus className="h-4 w-4" />
            Add Connection
          </button>
        )}
      </div>

      {/* Usage bar */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-[#0084ff]" />
            <span className="text-sm font-medium text-white">Numbers Connected</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {usedCount} / {limitLabel}
          </span>
        </div>
        {limit !== Infinity && (
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                barPercent >= 100
                  ? "bg-red-500"
                  : barPercent >= 80
                  ? "bg-amber-400"
                  : "bg-[#0084ff]"
              }`}
              style={{ width: `${barPercent}%` }}
            />
          </div>
        )}
        {limit === Infinity && (
          <div className="h-2 rounded-full bg-[#00c853]/30 overflow-hidden">
            <div className="h-full w-full rounded-full bg-[#00c853]/60" />
          </div>
        )}
        {atLimit && (
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Plan limit reached. Upgrade to add more numbers.
            </p>
            <button
              onClick={() => navigate({ to: "/pricing" })}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-xs font-semibold transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade Plan
            </button>
          </div>
        )}
      </div>

      {/* Connection cards */}
      {loading ? (
        <div className="text-center py-16 text-white/40 text-sm">Loading connections…</div>
      ) : connections.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <Phone className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm font-medium">No connections yet</p>
          <p className="text-white/30 text-xs mt-1">
            Add your first WhatsApp number to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((c) => (
            <div
              key={c.id}
              className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">{c.label}</div>
                    <div className="text-white/50 text-xs mt-0.5 font-mono">
                      {c.phone_number}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30">
                    Active
                  </span>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                    title="Delete connection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* API Key row */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <code className="flex-1 min-w-0 font-mono text-xs text-white/80 bg-[#0B141A] border border-white/10 rounded-lg px-3 py-2 break-all">
                  {visible[c.id]
                    ? (c.api_key ?? "—")
                    : mask(c.api_key ?? "wam_sk_••••••••••••••••••••")}
                </code>
                <button
                  onClick={() => toggleVisible(c.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white/70 shrink-0 transition-colors"
                  title={visible[c.id] ? "Hide key" : "Show key"}
                >
                  {visible[c.id] ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => copyKey(c.id, c.api_key ?? "")}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white/70 shrink-0 transition-colors"
                  title="Copy key"
                >
                  {copied === c.id ? (
                    <Check className="h-3.5 w-3.5 text-[#00c853]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Footer meta */}
              <div className="mt-3 text-xs text-white/40">
                Connected{" "}
                {new Date(c.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
            {newApiKey ? (
              /* Success: show generated key */
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-lg bg-[#00c853]/15 text-[#00c853] flex items-center justify-center shrink-0">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Connection Created</h2>
                    <p className="text-sm text-white/60 mt-0.5">
                      Copy your API key — it won't be shown again.
                    </p>
                  </div>
                </div>
                <div className="flex items-stretch gap-2 mb-4">
                  <div className="flex-1 bg-[#0B141A] border border-white/10 rounded-lg px-3 py-3 font-mono text-sm text-white break-all">
                    {newApiKey}
                  </div>
                  <button
                    onClick={copyNewKey}
                    className="px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {newKeyCopied ? (
                      <Check className="h-3.5 w-3.5 text-[#00c853]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {newKeyCopied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2.5 mb-5">
                  <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-amber-100">
                    Save this key now. You won't be able to see it again.
                  </p>
                </div>
                <p className="text-xs text-white/50 mb-4">
                  Use this key as the{" "}
                  <code className="bg-white/10 px-1 py-0.5 rounded font-mono">x-wa-secret</code>{" "}
                  header in your n8n HTTP Request node.
                </p>
                <button
                  onClick={() => { setShowModal(false); setNewApiKey(null); }}
                  className="w-full h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              /* Form */
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center shrink-0">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Add Connection</h2>
                      <p className="text-sm text-white/60 mt-0.5">Connect a WhatsApp number.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-white/80">Display Name</label>
                    <input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Sharma Jewellers"
                      className={`mt-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/80">Phone Number ID</label>
                    <input
                      value={newPhoneId}
                      onChange={(e) => setNewPhoneId(e.target.value)}
                      placeholder="e.g. 107322702921157"
                      className={`mt-1 ${inputClass}`}
                    />
                    <p className="text-[11px] text-white/40 mt-1.5">
                      Find this in Meta Business Manager → WhatsApp → Phone Numbers
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-11 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={submitting}
                    className="flex-1 h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Adding…" : "Add Connection"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">Delete {confirmDelete.label}?</h2>
            </div>
            <p className="text-sm text-white/60 mb-6">
              This permanently deletes all messages and conversations for this number.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 h-11 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit reached modal */}
      {showLimitModal && (
        <LimitReachedModal
          plan={plan}
          onClose={() => setShowLimitModal(false)}
        />
      )}
    </div>
  );
}

function LimitReachedModal({ plan, onClose }: { plan: string; onClose: () => void }) {
  const extraPriceMap: Record<string, number> = { starter: 499, pro: 399, growth: 299 };
  const upgradeMap: Record<string, { next: string; price: number; numbers: string }> = {
    starter: { next: "Pro", price: 2499, numbers: "10 numbers" },
    pro: { next: "Growth", price: 4999, numbers: "25 numbers" },
    growth: { next: "Agency", price: 0, numbers: "unlimited numbers" },
  };
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const isAgency = plan === "agency";
  const extraPrice = extraPriceMap[plan];
  const upgrade = upgradeMap[plan];

  const extraHref = extraPrice
    ? `https://wa.me/918989568529?text=${encodeURIComponent(
        `Hi, I want to add an extra WhatsApp number to my ${planLabel} plan on Replora for ₹${extraPrice}/month`,
      )}`
    : `https://wa.me/918989568529?text=${encodeURIComponent(
        `Hi, I want to add extra WhatsApp numbers on my Agency plan on Replora`,
      )}`;

  const upgradeHref = upgrade
    ? `https://wa.me/918989568529?text=${encodeURIComponent(
        `Hi, I want to upgrade to ${upgrade.next} plan on Replora`,
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Plan limit reached</h2>
            <p className="text-sm text-white/60 mt-0.5">
              Choose how you'd like to add more numbers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: extra number */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-4 w-4 text-[#0084ff]" />
              <h3 className="text-white font-semibold">Add extra number</h3>
            </div>
            {isAgency ? (
              <>
                <p className="text-sm text-white/60 mb-5 flex-1">
                  Custom pricing for additional numbers on the Agency plan.
                </p>
                <a
                  href={extraHref}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  Contact sales
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </>
            ) : (
              <>
                <div className="mb-2">
                  <span className="text-3xl font-semibold text-white">₹{extraPrice}</span>
                  <span className="text-sm text-white/50">/month</span>
                </div>
                <p className="text-sm text-white/60 mb-5 flex-1">
                  One additional WhatsApp number on your {planLabel} plan.
                </p>
                <a
                  href={extraHref}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  Add for ₹{extraPrice}/mo
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </>
            )}
          </div>

          {/* Right: upgrade plan */}
          <div className="bg-white/5 border border-[#0084ff]/30 rounded-2xl p-5 flex flex-col relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#0084ff]" />
              <h3 className="text-white font-semibold">Upgrade plan</h3>
            </div>
            {upgrade && upgrade.price > 0 ? (
              <>
                <div className="mb-2">
                  <span className="text-3xl font-semibold text-white">₹{upgrade.price.toLocaleString("en-IN")}</span>
                  <span className="text-sm text-white/50">/month</span>
                </div>
                <p className="text-sm text-white/60 mb-5 flex-1">
                  Move to {upgrade.next} — {upgrade.numbers}.
                </p>
                <a
                  href={upgradeHref!}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  Upgrade to {upgrade.next}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </>
            ) : upgrade ? (
              <>
                <div className="mb-2">
                  <span className="text-3xl font-semibold text-white">Agency</span>
                </div>
                <p className="text-sm text-white/60 mb-5 flex-1">
                  {upgrade.numbers} — custom pricing.
                </p>
                <a
                  href={upgradeHref!}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  Upgrade to Agency
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </>
            ) : (
              <p className="text-sm text-white/60">You're already on the top plan.</p>
            )}
          </div>
        </div>

        <p className="text-xs text-white/40 text-center mt-5">
          Payments confirmed via WhatsApp. Portal updates within 24 hours.
        </p>
      </div>
    </div>
  );
}

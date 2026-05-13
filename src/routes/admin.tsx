import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Shield, X, Check, Loader2, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { useAccountStatus } from "@/hooks/useAccountStatus";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Replora" }] }),
  component: () => (
    <AppLayout>
      <AdminPage />
    </AppLayout>
  ),
});

const OWNER_EMAIL = "devdabi32@gmail.com";

type Agency = {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  plan_status: string;
  trial_ends_at: string | null;
  created_at: string;
  is_owner: boolean;
};

const PLANS = ["starter", "pro", "growth", "agency"] as const;
type PlanOption = (typeof PLANS)[number];
const DURATIONS = [1, 3, 6, 12] as const;
type Duration = (typeof DURATIONS)[number];

const PLAN_COLOR: Record<string, string> = {
  trial:   "text-white/50",
  starter: "text-[#0084ff]",
  pro:     "text-[#00c853]",
  growth:  "text-[#8b5cf6]",
  agency:  "text-[#f59e0b]",
};
const STATUS_CLS: Record<string, string> = {
  active:    "text-[#00c853] bg-[#00c853]/10 border-[#00c853]/25",
  trialing:  "text-amber-300 bg-amber-500/10 border-amber-500/25",
  trial:     "text-amber-300 bg-amber-500/10 border-amber-500/25",
  expired:   "text-red-300 bg-red-500/10 border-red-500/25",
  cancelled: "text-white/40 bg-white/5 border-white/10",
};

function calcDaysLeft(trial_ends_at: string | null): number | null {
  if (!trial_ends_at) return null;
  return Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86400000));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminPage() {
  const { email, loading: accountLoading } = useAccountStatus();
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Agency | null>(null);

  // Guard: only owner
  useEffect(() => {
    if (!accountLoading && email !== OWNER_EMAIL) {
      navigate({ to: "/dashboard" });
    }
  }, [email, accountLoading, navigate]);

  // Fetch all agencies
  useEffect(() => {
    if (accountLoading || email !== OWNER_EMAIL) return;
    supabase
      .from("agencies")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAgencies((data ?? []) as Agency[]);
        setLoading(false);
      });
  }, [email, accountLoading]);

  const handleUpgraded = (updated: Agency) => {
    setAgencies((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setTarget(null);
  };

  if (accountLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Checking access…
      </div>
    );
  }

  if (email !== OWNER_EMAIL) return null;

  const stats = [
    { label: "Total Agencies", value: agencies.length },
    { label: "On Trial",       value: agencies.filter((a) => a.plan === "trial").length },
    { label: "Paying",         value: agencies.filter((a) => a.plan !== "trial" && a.plan_status === "active").length },
    { label: "Expired",        value: agencies.filter((a) => a.plan_status === "expired").length },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="h-10 w-10 rounded-xl bg-[#f59e0b]/15 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-[#f59e0b]" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Panel</h1>
          <p className="text-sm text-white/50 mt-0.5">Manage all agencies — owner only</p>
        </div>
        <span className="text-[11px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2.5 py-1 rounded-full">
          👑 Owner
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
            <div className="text-[11px] text-white/50 font-semibold uppercase tracking-wider">{s.label}</div>
            <div className="text-2xl font-bold text-white mt-1">{loading ? "—" : s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-white/50 bg-white/5 border-b border-white/10">
                <th className="py-3 px-5 font-semibold">Agency / Email</th>
                <th className="py-3 px-4 font-semibold">Plan</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Trial Ends</th>
                <th className="py-3 px-4 font-semibold">Days Left</th>
                <th className="py-3 px-4 font-semibold">Joined</th>
                <th className="py-3 px-4 font-semibold w-[100px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-white/30" />
                  </td>
                </tr>
              )}
              {!loading && agencies.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-white/40 text-sm">No agencies found</td>
                </tr>
              )}
              {agencies.map((a) => {
                const dl = calcDaysLeft(a.trial_ends_at);
                const statusCls = STATUS_CLS[a.plan_status] ?? STATUS_CLS.trial;
                return (
                  <tr key={a.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        {a.is_owner && <Crown className="h-3.5 w-3.5 text-[#f59e0b] shrink-0" aria-label="Owner" />}
                        <div>
                          <div className="font-medium text-white text-[13px] leading-tight">
                            {a.name ?? "Unnamed"}
                          </div>
                          <div className="text-[11px] text-white/45 font-mono mt-0.5">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[12px] font-bold uppercase tracking-wide ${PLAN_COLOR[a.plan] ?? "text-white/50"}`}>
                        {a.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCls}`}>
                        {a.plan_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[12px] text-white/55">
                      {a.trial_ends_at
                        ? format(new Date(a.trial_ends_at), "dd MMM yyyy")
                        : <span className="text-white/25">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {dl !== null ? (
                        <span className={`text-[12px] font-semibold tabular-nums ${
                          dl === 0 ? "text-red-400" : dl <= 3 ? "text-red-300" : dl <= 7 ? "text-amber-400" : "text-white/55"
                        }`}>
                          {dl}d
                        </span>
                      ) : (
                        <span className="text-white/25 text-[12px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[12px] text-white/45">
                      {format(new Date(a.created_at), "dd MMM yyyy")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!a.is_owner && (
                        <button
                          onClick={() => setTarget(a)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0084ff]/15 hover:bg-[#0084ff]/25 text-[#0084ff] text-[12px] font-semibold border border-[#0084ff]/20 transition-colors"
                        >
                          Upgrade
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {target && (
        <UpgradeModal
          agency={target}
          onClose={() => setTarget(null)}
          onSuccess={handleUpgraded}
        />
      )}
    </div>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

function UpgradeModal({
  agency,
  onClose,
  onSuccess,
}: {
  agency: Agency;
  onClose: () => void;
  onSuccess: (updated: Agency) => void;
}) {
  const [plan, setPlan]       = useState<PlanOption>("starter");
  const [months, setMonths]   = useState<Duration>(1);
  const [amount, setAmount]   = useState("");
  const [notes, setNotes]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);

    const { error: rpcError } = await supabase.rpc("admin_upgrade_agency", {
      p_agency_id: agency.id,
      p_plan: plan,
      p_months: months,
      p_amount: amount ? Number(amount) : 0,
      p_notes: notes.trim() || null,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSubmitting(false);
      return;
    }

    // Refetch updated row so the table reflects immediately
    const { data: updated } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", agency.id)
      .single();

    setSubmitting(false);
    if (updated) onSuccess(updated as Agency);
    else onClose();
  };

  const inputCls =
    "w-full h-10 px-3 rounded-lg bg-white/[0.07] border border-white/[0.15] text-white placeholder:text-white/30 focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff]/30 outline-none text-sm";

  const planAccent: Record<string, string> = {
    starter: "#0084ff",
    pro:     "#00c853",
    growth:  "#8b5cf6",
    agency:  "#f59e0b",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Upgrade Agency</h2>
            <p className="text-[12px] text-white/45 font-mono mt-0.5 truncate">{agency.email}</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Plan */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Plan</label>
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {PLANS.map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className="py-2 rounded-lg text-[13px] font-semibold capitalize transition-all border"
                style={
                  plan === p
                    ? { background: planAccent[p], borderColor: planAccent[p], color: "#fff" }
                    : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Duration</label>
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setMonths(d)}
                className={`py-2 rounded-lg text-[13px] font-semibold transition-all border ${
                  months === d
                    ? "bg-white/15 border-white/30 text-white"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                {d}mo
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            Amount Paid (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 999"
            className={`mt-2 ${inputCls}`}
          />
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Razorpay ID, payment ref, anything…"
            rows={3}
            className="mt-2 w-full px-3 py-2.5 rounded-lg bg-white/[0.07] border border-white/[0.15] text-white placeholder:text-white/30 focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff]/30 outline-none text-sm resize-none"
          />
        </div>

        {/* Summary chip */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] mb-4 text-[13px]">
          <Check className="h-4 w-4 text-[#00c853] shrink-0" />
          <span className="text-white/65">
            Setting to{" "}
            <span className="font-semibold text-white capitalize" style={{ color: planAccent[plan] }}>{plan}</span>
            {" · "}
            <span className="font-semibold text-white">{months} month{months > 1 ? "s" : ""}</span>
          </span>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-4 px-1 bg-red-500/10 border border-red-500/20 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-11 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/65 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Upgrading…" : "Confirm Upgrade"}
          </button>
        </div>
      </div>
    </div>
  );
}

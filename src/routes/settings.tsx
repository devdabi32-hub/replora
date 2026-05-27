import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useUpgradeModal } from "@/components/UpgradeModal";
import {
  User, AlertTriangle, LifeBuoy, Trash2,
  Phone, Users, CreditCard, Key, Copy, Check,
  RefreshCw, Shield, CheckCircle2, XCircle, ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Replora" }] }),
  component: SettingsPage,
});

const INDUSTRIES = ["Technology", "Marketing", "Real Estate", "Education",
  "Healthcare", "Finance", "E-commerce", "Logistics", "Hospitality", "Other"];
const TEAM_SIZES = ["1-5", "6-10", "11-50", "51-200", "200+"];
const SUPPORT_MAILTO =
  "mailto:care@replora.in?subject=Replora%20Support%20Request&body=Hi%20Replora%20Support%20Team%2C%20I%20need%20help%20with...";

type Tab = "profile" | "whatsapp" | "team" | "billing" | "apikeys";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "whatsapp", label: "WhatsApp", icon: Phone },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "apikeys", label: "API Keys", icon: Key },
];

type PhoneRow = {
  id: string;
  display_name: string;
  phone_number: string | null;
  is_active: boolean;
  message_count: number;
};

const PLAN_LABELS: Record<string, string> = {
  trial: "Free Trial", starter: "Starter",
  pro: "Pro", growth: "Growth", agency: "Agency",
};

function SettingsPage() {
  const navigate = useNavigate();
  const { isExpired, plan } = useAccountStatus();
  const { open: openUpgrade } = useUpgradeModal();

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile
  const [email, setEmail] = useState("");
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [teamSize, setTeamSize] = useState("1-5");
  const [saving, setSaving] = useState(false);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // WhatsApp tab
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneRow[]>([]);

  // API Keys tab
  const [webhookSecret, setWebhookSecret] = useState("");
  const [secretVisible, setSecretVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { navigate({ to: "/login" }); return; }
      setEmail(data.user.email ?? "");

      const { data: userRow } = await supabase
        .from("users").select("agency_id").eq("id", data.user.id).maybeSingle();
      if (!userRow?.agency_id) return;

      setAgencyId(userRow.agency_id);

      const { data: ag } = await supabase
        .from("agencies")
        .select("name, webhook_secret")
        .eq("id", userRow.agency_id).maybeSingle();
      if (ag) {
        setAgencyName(ag.name ?? "");
        if (ag.webhook_secret) setWebhookSecret(ag.webhook_secret as string);
      }

      const { data: bp } = await supabase
        .from("business_profiles")
        .select("website, industry, team_size, organisation_name")
        .eq("agency_id", userRow.agency_id).maybeSingle();
      if (bp) {
        if (bp.website) setWebsite(bp.website as string);
        if (bp.industry) setIndustry(bp.industry as string);
        if (bp.team_size) setTeamSize(bp.team_size as string);
      }

      const { data: phones } = await supabase
        .from("connected_phone_numbers")
        .select("id, display_name, phone_number, is_active, message_count")
        .eq("agency_id", userRow.agency_id)
        .order("connected_at", { ascending: false });
      if (phones) setPhoneNumbers(phones as PhoneRow[]);
    })();
  }, [navigate]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const save = async () => {
    if (!agencyName.trim()) { toast.error("Agency name is required"); return; }
    setSaving(true);
    if (agencyId) {
      await supabase.from("agencies")
        .update({ name: agencyName }).eq("id", agencyId);
      await supabase.from("business_profiles")
        .update({ website, industry, team_size: teamSize })
        .eq("agency_id", agencyId);
    }
    setSaving(false);
    toast.success("Profile updated");
  };

  const copySecret = () => {
    navigator.clipboard.writeText(webhookSecret);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateSecret = async () => {
    if (!agencyId) return;
    setRegenerating(true);
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
    const newSecret = `wam_sk_${hex}`;
    const { error } = await supabase.from("agencies")
      .update({ webhook_secret: newSecret }).eq("id", agencyId);
    if (!error) {
      setWebhookSecret(newSecret);
      toast.success("Secret regenerated — update your n8n webhook too!");
    } else {
      toast.error("Failed to regenerate");
    }
    setRegenerating(false);
  };

  const maskedSecret = webhookSecret
    ? "wam_sk_" + "•".repeat(
      Math.max(0, webhookSecret.replace("wam_sk_", "").length - 8)
    ) + webhookSecret.slice(-8)
    : "—";

  const deleteAccount = async () => {
    if (deleteText !== "DELETE") return;
    setDeleting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("No user");
      const { data: userRow } = await supabase
        .from("users").select("agency_id").eq("id", uid).maybeSingle();
      const aid = userRow?.agency_id ?? agencyId;
      if (!aid) throw new Error("No agency");
      const steps = [
        () => supabase.from("messages").delete().eq("agency_id", aid),
        () => supabase.from("conversations").delete().eq("agency_id", aid),
        () => supabase.from("contacts").delete().eq("agency_id", aid),
        () => supabase.from("webhook_logs").delete().eq("agency_id", aid),
        () => supabase.from("business_profiles").delete().eq("agency_id", aid),
        () => supabase.from("users").delete().eq("agency_id", aid),
        () => supabase.from("agencies").delete().eq("id", aid),
      ];
      for (const run of steps) {
        const { error } = await run();
        if (error) throw error;
      }
      const { error: authErr } = await supabase.rpc("delete_current_user");
      if (authErr && !/function .* does not exist/i.test(authErr.message))
        throw authErr;
      await supabase.auth.signOut();
      try { localStorage.clear(); sessionStorage.clear(); } catch { /* noop */ }
      toast.success("Account deleted.");
      navigate({ to: "/" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Contact care@replora.in");
      setDeleting(false);
    }
  };

  const inp = "w-full h-11 px-3 rounded-lg bg-[#1a1f2e] border border-white/10 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 outline-none text-sm";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white tracking-tight">Settings</h1>
          <p className="text-sm text-white/60 mt-1.5">Manage your agency, billing and account.</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-7 p-1 bg-[#0f1117] rounded-xl border border-white/[0.06] overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${activeTab === id
                  ? "bg-[#0084ff] text-white shadow-lg shadow-[#0084ff]/20"
                  : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <section className="bg-[#0f1117] rounded-2xl border border-white/10 p-7">
              <div className="flex items-start gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Agency Profile</h2>
                  <p className="text-sm text-white/60 mt-0.5">Information about your business.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/80">Agency Name</label>
                  <input value={agencyName} onChange={e => setAgencyName(e.target.value)} className={`mt-1 ${inp}`} />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/80">Email</label>
                  <input value={email} readOnly className={`mt-1 ${inp} opacity-60 cursor-not-allowed`} />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/80">
                    Website <span className="text-white/40">(optional)</span>
                  </label>
                  <input value={website} onChange={e => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com" className={`mt-1 ${inp}`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-white/80">Industry</label>
                    <select value={industry} onChange={e => setIndustry(e.target.value)} className={`mt-1 ${inp}`}>
                      {INDUSTRIES.map(i => <option key={i} value={i} className="bg-[#0f1117]">{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/80">Team Size</label>
                    <select value={teamSize} onChange={e => setTeamSize(e.target.value)} className={`mt-1 ${inp}`}>
                      {TEAM_SIZES.map(i => <option key={i} value={i} className="bg-[#0f1117]">{i}</option>)}
                    </select>
                  </div>
                </div>
                {isExpired ? (
                  <button onClick={openUpgrade}
                    className="h-11 px-5 rounded-lg bg-white/[0.06] hover:bg-white/[0.08] text-white/70 text-sm font-semibold transition-colors">
                    Upgrade to make changes
                  </button>
                ) : (
                  <button onClick={save} disabled={saving}
                    className="h-11 px-5 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors disabled:opacity-60">
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                )}
              </div>
            </section>

            <section className="bg-[#0f1117] rounded-2xl border border-white/10 p-7">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/15 text-purple-300 flex items-center justify-center">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Support</h2>
                  <p className="text-sm text-white/60 mt-0.5">Need help? We're here for you.</p>
                </div>
              </div>
              <a href={SUPPORT_MAILTO}
                className="inline-flex items-center gap-1.5 h-11 px-5 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors">
                Contact Support
              </a>
              <p className="mt-3 text-xs text-white/50">Reach us at care@replora.in</p>
            </section>

            <section className="bg-[#0f1117] rounded-2xl border border-red-500/40 p-7">
              <div className="flex items-start gap-3 mb-5">
                <div className="h-10 w-10 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
                  <p className="text-sm text-white/60 mt-0.5">Irreversible actions.</p>
                </div>
              </div>
              <button onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-1.5 h-11 px-5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                <Trash2 className="h-4 w-4" /> Delete Account
              </button>
            </section>
          </div>
        )}

        {/* ── WHATSAPP TAB ── */}
        {activeTab === "whatsapp" && (
          <section className="bg-[#0f1117] rounded-2xl border border-white/10 p-7">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#00c853]/15 text-[#00c853] flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Connected Numbers</h2>
                  <p className="text-sm text-white/60 mt-0.5">
                    {phoneNumbers.length} number{phoneNumbers.length !== 1 ? "s" : ""} connected
                  </p>
                </div>
              </div>
              <Link to="/connections"
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-medium transition-colors shrink-0">
                <ArrowUpRight className="h-3.5 w-3.5" /> Manage
              </Link>
            </div>

            {phoneNumbers.length === 0 ? (
              <div className="py-10 text-center text-white/40 text-sm">
                No numbers connected yet.
              </div>
            ) : (
              <div className="space-y-3">
                {phoneNumbers.map(num => (
                  <div key={num.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="h-10 w-10 rounded-full bg-[#0084ff]/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-[#0084ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{num.display_name}</div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {num.phone_number ?? "—"} · {num.message_count} messages
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${num.is_active
                        ? "bg-[#00c853]/10 text-[#00c853]"
                        : "bg-white/5 text-white/40"
                      }`}>
                      {num.is_active
                        ? <CheckCircle2 className="h-3 w-3" />
                        : <XCircle className="h-3 w-3" />}
                      {num.is_active ? "Active" : "Inactive"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── TEAM TAB ── */}
        {activeTab === "team" && (
          <section className="bg-[#0f1117] rounded-2xl border border-white/10 p-7">
            <div className="flex items-start gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Team Management</h2>
                <p className="text-sm text-white/60 mt-0.5">Invite agents and manage roles.</p>
              </div>
            </div>
            <Link to="/team"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors">
              <ArrowUpRight className="h-4 w-4" /> Open Team Page
            </Link>
            <p className="mt-3 text-xs text-white/50">
              Invite team members, assign roles (admin / agent) and manage access.
            </p>
          </section>
        )}

        {/* ── BILLING TAB ── */}
        {activeTab === "billing" && (
          <section className="bg-[#0f1117] rounded-2xl border border-white/10 p-7">
            <div className="flex items-start gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/15 text-yellow-400 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Plan & Billing</h2>
                <p className="text-sm text-white/60 mt-0.5">Your current plan and upgrade options.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
              <div className="flex-1">
                <div className="text-xs text-white/50 uppercase tracking-widest">Current Plan</div>
                <div className="text-2xl font-semibold text-white mt-1 capitalize">
                  {PLAN_LABELS[plan] ?? plan}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plan === "trial"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-[#00c853]/15 text-[#00c853]"
                }`}>
                {plan === "trial" ? "Trial" : "Active"}
              </span>
            </div>
            <button onClick={openUpgrade}
              className="h-11 px-5 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors">
              Upgrade Plan
            </button>
            <p className="mt-3 text-xs text-white/50">
              For billing queries, contact care@replora.in
            </p>
          </section>
        )}

        {/* ── API KEYS TAB ── */}
        {activeTab === "apikeys" && (
          <div className="space-y-6">
            <section className="bg-[#0f1117] rounded-2xl border border-white/10 p-7">
              <div className="flex items-start gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Webhook Secret Key</h2>
                  <p className="text-sm text-white/60 mt-0.5">
                    Add this to your n8n HTTP request header:{" "}
                    <code className="text-[#0084ff] bg-[#0084ff]/10 px-1.5 py-0.5 rounded text-xs font-mono">
                      x-wa-secret
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-white/[0.08] mb-4 min-w-0">
                <code className="flex-1 text-sm text-[#00c853] font-mono break-all leading-relaxed">
                  {secretVisible ? webhookSecret : maskedSecret}
                </code>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setSecretVisible(v => !v)}
                    className="h-8 px-3 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors">
                    {secretVisible ? "Hide" : "Show"}
                  </button>
                  <button onClick={copySecret}
                    className="h-8 w-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors">
                    {copied
                      ? <Check className="h-3.5 w-3.5 text-[#00c853]" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-5">
                <p className="text-xs text-amber-400/90 leading-relaxed">
                  ⚠️ Keep this key secret. If you regenerate it, update your n8n workflow
                  header immediately — the old key will stop working.
                </p>
              </div>

              <button onClick={regenerateSecret} disabled={regenerating}
                className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/70 hover:text-white text-sm font-medium transition-colors disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
                {regenerating ? "Regenerating…" : "Regenerate Key"}
              </button>
            </section>

            <section className="bg-[#0f1117] rounded-2xl border border-white/10 p-7">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-white/5 text-white/60 flex items-center justify-center">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">API Documentation</h2>
                  <p className="text-sm text-white/60 mt-0.5">
                    Full guide for connecting n8n and other automation tools.
                  </p>
                </div>
              </div>
              <Link to="/api-docs"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/70 hover:text-white text-sm font-medium transition-colors">
                <ArrowUpRight className="h-4 w-4" /> View API Docs
              </Link>
            </section>
          </div>
        )}

      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Account?</h3>
                <p className="text-sm text-white/70 mt-1">
                  This action is permanent. All your conversations, contacts, and data
                  will be deleted forever.
                </p>
              </div>
            </div>
            <label className="text-xs font-medium text-white/80">Type DELETE to confirm</label>
            <input value={deleteText} onChange={e => setDeleteText(e.target.value)}
              autoFocus className={`mt-1 ${inp}`} placeholder="DELETE" />
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => { setShowDelete(false); setDeleteText(""); }}
                className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium">
                Cancel
              </button>
              <button onClick={deleteAccount} disabled={deleteText !== "DELETE" || deleting}
                className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                {deleting ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
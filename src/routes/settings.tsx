import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import {
  Copy, Check, RefreshCw, Pencil, Trash2, KeyRound,
  User, CreditCard, AlertTriangle, Sparkles, ArrowRight, Info,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Chatora" }] }),
  component: SettingsPage,
});

function genSecret() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "wam_sk_" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function SettingsPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agency, setAgency] = useState("");
  const [agencyDraft, setAgencyDraft] = useState("");
  const [editingAgency, setEditingAgency] = useState(false);
  const [savingAgency, setSavingAgency] = useState(false);
  const [secret, setSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { navigate({ to: "/login" }); return; }
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");

      // Try to load agency from agencies table
      let agencyRow: any = null;
      const { data: userRow } = await supabase
        .from("users")
        .select("agency_id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (userRow?.agency_id) {
        const { data: row } = await supabase
          .from("agencies")
          .select("id, name, webhook_secret")
          .eq("id", userRow.agency_id)
          .maybeSingle();
        agencyRow = row;
      }

      if (agencyRow) {
        setAgencyId(agencyRow.id);
        setAgency(agencyRow.name ?? "");
        setAgencyDraft(agencyRow.name ?? "");
        setSecret(agencyRow.webhook_secret ?? "");
      } else {
        // Fallback if backend tables not yet provisioned
        const fallbackName = (data.user.user_metadata as any)?.agency_name ?? "My Agency";
        setAgency(fallbackName);
        setAgencyDraft(fallbackName);
        const stored = localStorage.getItem("wa_webhook_secret") ?? (() => {
          const s = genSecret(); localStorage.setItem("wa_webhook_secret", s); return s;
        })();
        setSecret(stored);
      }
    })();
  }, [navigate]);

  const copy = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  const regenerate = async () => {
    setRegenerating(true);
    const next = genSecret();
    if (agencyId) {
      const { error } = await supabase
        .from("agencies")
        .update({ webhook_secret: next })
        .eq("id", agencyId);
      if (error) {
        toast.error("Could not regenerate key");
        setRegenerating(false);
        return;
      }
    } else {
      localStorage.setItem("wa_webhook_secret", next);
    }
    setSecret(next);
    setRegenerating(false);
    toast.success("New API key generated");
  };

  const saveAgency = async () => {
    const name = agencyDraft.trim();
    if (!name) { toast.error("Agency name cannot be empty"); return; }
    setSavingAgency(true);
    if (agencyId) {
      const { error } = await supabase.from("agencies").update({ name }).eq("id", agencyId);
      if (error) { toast.error("Could not save"); setSavingAgency(false); return; }
    } else {
      await supabase.auth.updateUser({ data: { agency_name: name } });
    }
    setAgency(name);
    setEditingAgency(false);
    setSavingAgency(false);
    toast.success("Profile updated!");
  };

  const deleteAccount = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 mt-1.5">Manage your workspace, integrations and billing.</p>
        </div>

        {/* API Keys */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#0084ff] flex items-center justify-center">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">API Keys</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Use these keys to connect your automation tools to Chatora.
              </p>
            </div>
          </div>

          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Secret API key
          </label>
          <div className="mt-2 flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-800 break-all flex items-center">
              {secret || "Loading…"}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={regenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-blue-50/60 border border-blue-100 px-4 py-3">
            <Info className="h-4 w-4 text-[#0084ff] mt-0.5 shrink-0" />
            <p className="text-[13px] text-slate-700 leading-relaxed">
              This is your unique API key. Add it to your n8n workflow as the{" "}
              <code className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px] text-slate-800">
                x-wa-secret
              </code>{" "}
              header. Never share this key publicly.
            </p>
          </div>

          <Link
            to="/api-docs"
            className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors"
          >
            View Integration Guide <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Agency Profile */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Agency profile</h2>
              <p className="text-sm text-slate-500 mt-0.5">Your workspace identity.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Agency name
                </div>
                {!editingAgency && (
                  <button
                    onClick={() => { setAgencyDraft(agency); setEditingAgency(true); }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                )}
              </div>
              {editingAgency ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    autoFocus
                    value={agencyDraft}
                    onChange={(e) => setAgencyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveAgency();
                      if (e.key === "Escape") { setEditingAgency(false); setAgencyDraft(agency); }
                    }}
                    className="flex-1 h-9 px-3 rounded-md border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0084ff]/30 focus:border-[#0084ff]"
                  />
                  <button
                    onClick={saveAgency}
                    disabled={savingAgency}
                    className="px-3 h-9 rounded-md bg-[#0084ff] hover:bg-[#0066cc] text-white text-xs font-semibold disabled:opacity-60"
                  >
                    {savingAgency ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditingAgency(false); setAgencyDraft(agency); }}
                    className="px-3 h-9 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="text-sm font-medium text-slate-900">{agency || "—"}</div>
              )}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Email</div>
              <div className="text-sm font-medium text-slate-900 mt-1.5">{email}</div>
            </div>
          </div>
        </section>

        {/* Plan */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-green-50 text-[#00c853] flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Plan & billing</h2>
              <p className="text-sm text-slate-500 mt-0.5">Manage your subscription.</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">Current plan</span>
                  <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Trial</span>
                </div>
                <div className="text-2xl font-semibold mt-1">Free Trial</div>
                <div className="text-xs text-slate-400 mt-1">14 days remaining</div>
              </div>
              <button disabled className="flex items-center gap-1.5 px-4 h-10 rounded-lg bg-[#0084ff]/40 text-white/70 text-sm font-medium cursor-not-allowed">
                <Sparkles className="h-4 w-4" /> Upgrade plan
              </button>
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">
            {["Unlimited WhatsApp conversations","Real-time AI message monitoring","Up to 5 team members","Webhook integrations (n8n, Zapier)","Priority email support"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#00c853]" /> {f}
              </li>
            ))}
          </ul>
        </section>

        {/* Danger */}
        <section className="bg-white rounded-2xl border border-red-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Danger zone</h2>
              <p className="text-sm text-slate-500 mt-0.5">Irreversible actions.</p>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 bg-red-50/50 border border-red-200 rounded-xl p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Delete account</div>
              <div className="text-xs text-slate-600 mt-0.5">Permanently delete your workspace and all message data.</div>
            </div>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setConfirmDelete(false)} className="px-3 h-9 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium">Cancel</button>
                <button onClick={deleteAccount} className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold">
                  <Trash2 className="h-3.5 w-3.5" /> Confirm delete
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Delete account
              </button>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { Copy, Check, RefreshCw, Pencil, Trash2, Webhook, User, CreditCard, AlertTriangle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — WA Monitor" }] }),
  component: SettingsPage,
});

function genSecret() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "wam_sk_" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function SettingsPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [agency, setAgency] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [copied, setCopied] = useState<"url" | "secret" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate({ to: "/login" }); return; }
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");
      setAgency((data.user.user_metadata as any)?.agency_name ?? "My Agency");
    });
    const stored = localStorage.getItem("wa_webhook_secret");
    setSecret(stored ?? (() => { const s = genSecret(); localStorage.setItem("wa_webhook_secret", s); return s; })());
  }, [navigate]);

  const webhook = `https://wa-monitor.lovable.app/api/webhook/${userId || "..."}`;

  const copy = async (val: string, key: "url" | "secret") => {
    await navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const regenerate = () => {
    const s = genSecret();
    localStorage.setItem("wa_webhook_secret", s);
    setSecret(s);
  };

  const deleteAccount = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your workspace, integrations and billing.</p>
        </div>

        {/* Webhook */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#0084ff] flex items-center justify-center"><Webhook className="h-5 w-5" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Webhook connector</h2>
              <p className="text-xs text-slate-500 mt-0.5">Connect your n8n workflow to start monitoring messages.</p>
            </div>
          </div>

          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Webhook URL</label>
          <div className="mt-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <code className="flex-1 text-xs text-slate-800 break-all font-mono">{webhook}</code>
            <button onClick={() => copy(webhook, "url")} className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-[#0084ff] hover:bg-[#0066cc] text-white text-xs font-medium transition-colors">
              {copied === "url" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "url" ? "Copied" : "Copy"}
            </button>
          </div>

          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mt-5 block">Secret key</label>
          <div className="mt-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <code className="flex-1 text-xs text-slate-800 break-all font-mono">{secret}</code>
            <button onClick={() => copy(secret, "secret")} className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors">
              {copied === "secret" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "secret" ? "Copied" : "Copy"}
            </button>
            <button onClick={regenerate} className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
          </div>

          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <div className="font-semibold mb-1">📋 How to connect n8n</div>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-[13px]">
              <li>Add an HTTP Request node in your n8n workflow.</li>
              <li>Set the URL to your webhook above (POST method).</li>
              <li>Add header <code className="font-mono bg-white/60 px-1 rounded">x-webhook-secret</code> with your secret key.</li>
              <li>Send the message payload as JSON — it will appear in your inbox instantly.</li>
            </ol>
          </div>
        </section>

        {/* Agency */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><User className="h-5 w-5" /></div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900">Agency profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your workspace identity.</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Agency name</div>
              <div className="text-sm font-medium text-slate-900 mt-1">{agency}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Email</div>
              <div className="text-sm font-medium text-slate-900 mt-1">{email}</div>
            </div>
          </div>
        </section>

        {/* Plan */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-green-50 text-[#00c853] flex items-center justify-center"><CreditCard className="h-5 w-5" /></div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900">Plan & billing</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage your subscription.</p>
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
            {["Unlimited WhatsApp conversations", "Real-time AI message monitoring", "Up to 5 team members", "Webhook integrations (n8n, Zapier)", "Priority email support"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#00c853]" /> {f}
              </li>
            ))}
          </ul>
        </section>

        {/* Danger */}
        <section className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Danger zone</h2>
              <p className="text-xs text-slate-500 mt-0.5">Irreversible actions.</p>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 bg-red-50/50 border border-red-200 rounded-lg p-4">
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
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useUpgradeModal } from "@/components/UpgradeModal";
import { User, AlertTriangle, LifeBuoy, Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Replora" }] }),
  component: SettingsPage,
});

const INDUSTRIES = ["Technology","Marketing","Real Estate","Education","Healthcare","Finance","E-commerce","Logistics","Hospitality","Other"];
const TEAM_SIZES = ["1-5","6-10","11-50","51-200","200+"];

const SUPPORT_MAILTO =
  "mailto:care@replora.in?subject=Replora%20Support%20Request&body=Hi%20Replora%20Support%20Team%2C%20I%20need%20help%20with...";

function SettingsPage() {
  const navigate = useNavigate();
  const { isExpired } = useAccountStatus();
  const { open: openUpgrade } = useUpgradeModal();
  const [email, setEmail] = useState("");
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [teamSize, setTeamSize] = useState("1-5");
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { navigate({ to: "/login" }); return; }
      setEmail(data.user.email ?? "");
      const meta = data.user.user_metadata as Record<string, unknown> | null;
      setAgencyName((meta?.agency_name as string) ?? "");
      setDescription((meta?.business_description as string) ?? "");
      setWebsite((meta?.website as string) ?? "");
      setIndustry((meta?.industry as string) ?? "Technology");
      setTeamSize((meta?.team_size as string) ?? "1-5");

      const { data: userRow } = await supabase.from("users").select("agency_id").eq("id", data.user.id).maybeSingle();
      if (userRow?.agency_id) {
        setAgencyId(userRow.agency_id);
        const { data: row } = await supabase.from("agencies")
          .select("name, business_description, website, industry, team_size")
          .eq("id", userRow.agency_id).maybeSingle();
        if (row) {
          setAgencyName(row.name ?? "");
          if (row.business_description) setDescription(row.business_description as string);
          if (row.website) setWebsite(row.website as string);
          if (row.industry) setIndustry(row.industry as string);
          if (row.team_size) setTeamSize(row.team_size as string);
        }
      }
    })();
  }, [navigate]);

  const save = async () => {
    if (!agencyName.trim()) { toast.error("Agency name is required"); return; }
    setSaving(true);
    const meta = { agency_name: agencyName, business_description: description, website, industry, team_size: teamSize };
    await supabase.auth.updateUser({ data: meta });
    if (agencyId) {
      await supabase.from("agencies").update({
        name: agencyName, business_description: description, website, industry, team_size: teamSize,
      }).eq("id", agencyId);
    }
    setSaving(false);
    toast.success("Profile updated");
  };

  const deleteAccount = async () => {
    if (deleteText !== "DELETE") return;
    setDeleting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("No user");

      const { data: userRow, error: userRowErr } = await supabase
        .from("users")
        .select("agency_id")
        .eq("id", uid)
        .maybeSingle();
      if (userRowErr) throw userRowErr;
      const aid = userRow?.agency_id ?? agencyId;
      if (!aid) throw new Error("No agency");

      const dataSteps = [
        () => supabase.from("messages").delete().eq("agency_id", aid),
        () => supabase.from("conversations").delete().eq("agency_id", aid),
        () => supabase.from("contacts").delete().eq("agency_id", aid),
        () => supabase.from("webhook_logs").delete().eq("agency_id", aid),
        () => supabase.from("business_profiles").delete().eq("agency_id", aid),
        () => supabase.from("users").delete().eq("agency_id", aid),
        () => supabase.from("agencies").delete().eq("id", aid),
      ];
      for (const run of dataSteps) {
        const { error } = await run();
        if (error) throw error;
      }

      // Delete the auth user via SECURITY DEFINER RPC. Required SQL on the
      // database (run once):
      //   create or replace function public.delete_current_user()
      //   returns void language plpgsql security definer set search_path=public
      //   as $$ begin delete from auth.users where id = auth.uid(); end; $$;
      const { error: authErr } = await supabase.rpc("delete_current_user");
      if (authErr && !/function .* does not exist/i.test(authErr.message)) {
        throw authErr;
      }

      await supabase.auth.signOut();
      try { localStorage.clear(); sessionStorage.clear(); } catch { /* noop */ }
      toast.success("Your account has been permanently deleted.");
      navigate({ to: "/" });
    } catch (e) {
      console.error("delete account failed", e);
      toast.error("Something went wrong. Please contact care@replora.com to delete your account.");
      setDeleting(false);
    }
  };

  const inputClass = "w-full h-11 px-3 rounded-lg bg-[#1a1f2e] border border-white/10 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 outline-none text-sm";

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white tracking-tight">Settings</h1>
          <p className="text-sm text-white/60 mt-1.5">Manage your agency, billing and account.</p>
        </div>

        {/* A: Agency Profile */}
        <section className="bg-[#0f1117] rounded-2xl border border-white/10 p-7 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center"><User className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Agency Profile</h2>
              <p className="text-sm text-white/60 mt-0.5">Information about your business.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/80">Agency Name</label>
              <input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className={`mt-1 ${inputClass}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80">Email</label>
              <input value={email} readOnly className={`mt-1 ${inputClass} opacity-60 cursor-not-allowed`} />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80">Business Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-white/10 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 outline-none text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80">Website <span className="text-white/40">(optional)</span></label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" className={`mt-1 ${inputClass}`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-white/80">Industry</label>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={`mt-1 ${inputClass}`}>
                  {INDUSTRIES.map((i) => <option key={i} value={i} className="bg-[#0f1117]">{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white/80">Team Size</label>
                <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={`mt-1 ${inputClass}`}>
                  {TEAM_SIZES.map((i) => <option key={i} value={i} className="bg-[#0f1117]">{i}</option>)}
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

        {/* C: Support */}
        <section className="bg-[#0f1117] rounded-2xl border border-white/10 p-7 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/15 text-purple-300 flex items-center justify-center"><LifeBuoy className="h-5 w-5" /></div>
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

        {/* D: Danger Zone */}
        <section className="bg-[#0f1117] rounded-2xl border border-red-500/40 p-7">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center"><AlertTriangle className="h-5 w-5" /></div>
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

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0"><AlertTriangle className="h-5 w-5" /></div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Account?</h3>
                <p className="text-sm text-white/70 mt-1">This action is permanent and cannot be undone. All your conversations, contacts, and data will be deleted forever.</p>
              </div>
            </div>
            <label className="text-xs font-medium text-white/80">Type DELETE to confirm</label>
            <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} autoFocus
              className={`mt-1 ${inputClass}`} placeholder="DELETE" />
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => { setShowDelete(false); setDeleteText(""); }}
                className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium">Cancel</button>
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

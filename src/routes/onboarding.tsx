import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Activity,
  Flame,
  BarChart3,
  FileText,
  Phone,
  UserCog,
  User,
  Briefcase,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Replora" }] }),
  component: OnboardingPage,
});

const INDUSTRIES = [
  "Marketing & Advertising Agency",
  "WhatsApp Automation Agency",
  "n8n / No-Code Automation",
  "E-commerce & D2C Brand",
  "Real Estate",
  "Education & Coaching",
  "Healthcare & Wellness",
  "Financial Services",
  "SaaS & Technology",
  "Other",
];

const TEAM_SIZES = [
  { id: "solo", label: "Just me", hint: "1" },
  { id: "small", label: "Small team", hint: "2-5" },
  { id: "growing", label: "Growing team", hint: "6-15" },
  { id: "midsize", label: "Mid-size", hint: "16-50" },
  { id: "large", label: "Large", hint: "50+" },
];

const USE_CASES = [
  { id: "monitor", label: "Monitor AI agent conversations", icon: Activity },
  { id: "categorise", label: "Categorise leads (Hot/Warm/Cold)", icon: Flame },
  { id: "track", label: "Track AI performance", icon: BarChart3 },
  { id: "share", label: "Share reports with clients", icon: FileText },
  { id: "multi", label: "Manage multiple WhatsApp numbers", icon: Phone },
  { id: "human", label: "Human takeover when AI fails", icon: UserCog },
];

type UsageType = "personal" | "agency";

const USAGE_TYPES: { id: UsageType; label: string; sub: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "personal", label: "Personal / My Business",  sub: "I run my own AI agent",          icon: User },
  { id: "agency",   label: "Agency / Client Work",    sub: "I manage AI for multiple clients", icon: Briefcase },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Step 1
  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState<string>("");

  // Step 2
  const [usageType, setUsageType] = useState<UsageType | "">("");
  const [useCases, setUseCases] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/login" });
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const step1Valid = orgName.trim() && industry && teamSize;

  const saveStep1 = async () => {
    if (!userId || !step1Valid) return;
    setSaving(true);
    setError(null);
    const { data: userData, error: userErr } = await supabase
      .from("users")
      .select("agency_id")
      .eq("id", userId)
      .single();
    if (userErr || !userData?.agency_id) {
      setError("Could not find your agency. Please try logging out and back in.");
      setSaving(false);
      return;
    }
    setAgencyId(userData.agency_id);
    const { error: err } = await supabase.from("business_profiles").upsert(
      {
        agency_id: userData.agency_id,
        organisation_name: orgName.trim(),
        website: website.trim() || null,
        industry,
        team_size: teamSize,
      },
      { onConflict: "agency_id" },
    );
    setSaving(false);
    if (err) { setError(err.message); return; }
    setStep(2);
  };

  const saveStep2 = async () => {
    if (!usageType) return;
    // If agencyId wasn't cached from step 1 (e.g. user navigated back), re-fetch it
    let aid = agencyId;
    if (!aid && userId) {
      const { data } = await supabase.from("users").select("agency_id").eq("id", userId).single();
      aid = data?.agency_id ?? null;
      if (aid) setAgencyId(aid);
    }
    if (!aid) { setError("Could not find your agency."); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("business_profiles")
      .upsert({ agency_id: aid, usage_type: usageType }, { onConflict: "agency_id" });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setStep(3);
  };

  const toggleUseCase = (id: string) =>
    setUseCases((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const skip = () => navigate({ to: "/inbox" });

  return (
    <div className="min-h-screen bg-black px-4 py-10">
      <div className="max-w-[560px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-semibold text-white">Replora</span>
          </div>
          <button
            onClick={skip}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-medium text-white/60 mb-2">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0084ff] transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0f1117] rounded-2xl border border-white/10 p-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-semibold text-white mb-1">
                Tell us about your business
              </h1>
              <p className="text-sm text-white/60 mb-6">
                Help us personalise your experience
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/80">
                    Organisation Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Automateup Agency"
                    className="mt-1 w-full h-11 px-3 rounded-lg border border-white/10 bg-[#1a1f2e] text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-500/30 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/80">Website</label>
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="mt-1 w-full h-11 px-3 rounded-lg border border-white/10 bg-[#1a1f2e] text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-500/30 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/80">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="mt-1 w-full h-11 px-3 rounded-lg border border-white/10 bg-[#1a1f2e] text-white focus:border-[#0084ff] focus:ring-2 focus:ring-blue-500/30 outline-none text-sm"
                  >
                    <option value="" className="bg-[#0f1117] text-white">Select your industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i} className="bg-[#0f1117] text-white">
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/80">
                    Team Size <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TEAM_SIZES.map((t) => {
                      const active = teamSize === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTeamSize(t.id)}
                          className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                            active
                              ? "border-[#0084ff] bg-[#0084ff]/15"
                              : "border-white/10 hover:border-white/15 bg-white/5"
                          }`}
                        >
                          <div className="text-sm font-medium text-white">{t.label}</div>
                          <div className="text-xs text-white/60">{t.hint}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                onClick={saveStep1}
                disabled={!step1Valid || saving}
                className="w-full mt-6 h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-semibold text-white mb-1">
                How will you use Replora?
              </h1>
              <p className="text-sm text-white/60 mb-5">
                Tell us how you work — this helps us set up your account
              </p>

              {/* Primary usage type — required */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {USAGE_TYPES.map((u) => {
                  const Icon = u.icon;
                  const active = usageType === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUsageType(u.id)}
                      className={`text-left px-4 py-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                        active
                          ? "border-[#0084ff] bg-[#0084ff]/15"
                          : "border-white/10 hover:border-white/15 bg-white/5"
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          active ? "bg-[#0084ff] text-white" : "bg-white/10 text-white/60"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{u.label}</div>
                        <div className="text-xs text-white/50 mt-0.5">{u.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Secondary use case chips */}
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                What will you use it for? (optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {USE_CASES.map((u) => {
                  const active = useCases.includes(u.id);
                  const Icon = u.icon;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUseCase(u.id)}
                      className={`text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${
                        active
                          ? "border-[#0084ff]/60 bg-[#0084ff]/10"
                          : "border-white/10 hover:border-white/15 bg-white/[0.03]"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#0084ff]" : "text-white/40"}`} />
                      <span className="text-[13px] font-medium text-white/80">{u.label}</span>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="h-11 px-4 rounded-lg border border-white/15 text-white/80 hover:bg-white/5 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={saveStep2}
                  disabled={!usageType || saving}
                  className="flex-1 h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-2xl font-semibold text-white mb-1">
                You're almost ready! 🎉
              </h1>
              <p className="text-sm text-white/60 mb-6">
                Connect your n8n workflow to start monitoring conversations. You'll find your API key in Settings after onboarding.
              </p>

              <div className="space-y-3">
                {[
                  "Copy your API key above",
                  "Add HTTP Request node in n8n",
                  "Set header x-wa-secret to your key",
                  "Send a test message",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#0084ff]/15 text-[#0084ff] text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="text-sm text-white/80 pt-0.5">
                      <span className="font-medium text-white">Step {i + 1}:</span> {text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-8">
                <Link
                  to="/api-docs"
                  className="flex-1 h-11 rounded-lg border border-white/15 text-white/80 hover:bg-white/5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  View full setup guide
                </Link>
                <button
                  onClick={() => navigate({ to: "/inbox" })}
                  className="flex-1 h-11 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  Go to my inbox <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
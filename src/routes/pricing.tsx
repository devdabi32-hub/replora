import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Crown, ArrowUpRight, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const OWNER_EMAIL = "devdabi32@gmail.com";

type PlanKey = "trial" | "starter" | "pro" | "growth" | "agency";
const ORDER: PlanKey[] = ["trial", "starter", "pro", "growth", "agency"];

type Plan = {
  key: PlanKey;
  name: string;
  monthly: string;
  annual: string;
  monthlyLink?: string;
  annualLink?: string;
  features: string[];
  badge?: string;
  accent: string;
  trialPlan?: boolean;
  agency?: boolean;
};

const PLANS: Plan[] = [
  { key: "trial", name: "Free Trial", monthly: "₹0", annual: "₹0", features: ["1 WhatsApp number","Unlimited messages","Full AI dashboard","Hot/Warm/Cold lead tags"], accent: "#94a3b8", trialPlan: true },
  { key: "starter", name: "Starter", monthly: "₹999", annual: "₹9,990", monthlyLink: "https://rzp.io/rzp/3Km2lwAT", annualLink: "https://rzp.io/rzp/xjhNSYi", badge: "Most Popular", features: ["3 WhatsApp numbers","Unlimited messages","AI dashboard","30-day retention","Email support"], accent: "#0084ff" },
  { key: "pro", name: "Pro", monthly: "₹2,499", annual: "₹24,990", monthlyLink: "https://rzp.io/rzp/OwCF0wg", annualLink: "https://rzp.io/rzp/McR16MG", features: ["10 WhatsApp numbers","Everything in Starter","Priority WhatsApp support","60-day retention"], accent: "#00c853" },
  { key: "growth", name: "Growth", monthly: "₹4,999", annual: "₹49,990", monthlyLink: "https://rzp.io/rzp/2jdywV5", annualLink: "https://rzp.io/rzp/7QgNDmz8", features: ["25 WhatsApp numbers","Everything in Pro","PDF reports","90-day retention"], accent: "#8b5cf6" },
  { key: "agency", name: "Agency", monthly: "Contact Sales", annual: "Contact Sales", features: ["Unlimited numbers","Unlimited API keys","White label","Mobile app","Dedicated manager","Custom SLA"], accent: "#f59e0b", agency: true },
];

const ADDONS = [
  { plan: "starter", name: "Starter addon", price: "₹499", link: "https://rzp.io/rzp/8WthnzpZ", accent: "#0084ff" },
  { plan: "pro", name: "Pro addon", price: "₹399", link: "https://rzp.io/rzp/VCUC4yWf", accent: "#00c853" },
  { plan: "growth", name: "Growth addon", price: "₹299", link: "https://rzp.io/rzp/GkWdsc3h", accent: "#8b5cf6" },
];

function PricingPage() {
  const [plan, setPlan] = useState<PlanKey>("trial");
  const [isOwner, setIsOwner] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const fetchPlan = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    setUserEmail(session.user.email ?? "");
    const { data: userRow } = await supabase.from("users").select("agency_id").eq("id", session.user.id).single();
    if (userRow?.agency_id) {
      setAgencyId(userRow.agency_id);
      const { data: agency } = await supabase.from("agencies").select("plan, is_owner, email").eq("id", userRow.agency_id).single();
      if (agency) {
        setPlan(((agency.plan as string) ?? "trial") as PlanKey);
        setIsOwner(agency.is_owner === true || agency.email === OWNER_EMAIL || session.user.email === OWNER_EMAIL);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlan(); }, []);

  useEffect(() => {
    if (!agencyId) return;
    const channel = supabase
      .channel(`pricing-realtime-${agencyId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "agencies", filter: `id=eq.${agencyId}` },
        (payload) => {
          const newPlan = (payload.new as { plan?: string }).plan;
          if (newPlan) setPlan(newPlan as PlanKey);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [agencyId]);

  const currentIdx = useMemo(() => ORDER.indexOf(plan), [plan]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-black text-white px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Simple, transparent pricing</h1>
            <p className="text-sm text-white/60 mt-3">No per-message fees. No hidden charges. Cancel anytime.</p>
            <div className="mt-6 inline-flex items-center gap-2 p-1 rounded-full bg-white/[0.04] border border-white/10">
              <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${!annual ? "bg-white text-black" : "text-white/70"}`}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${annual ? "bg-white text-black" : "text-white/70"}`}>
                Annual
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/30">Save 2 months free</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PLANS.map((p) => {
              const idx = ORDER.indexOf(p.key);
              const isCurrent = !isOwner && p.key === plan;
              const isDowngrade = !isOwner && idx < currentIdx;
              const isUpgrade = !isOwner && idx > currentIdx;
      const baseLink = annual ? p.annualLink : p.monthlyLink;
      const link = baseLink && userEmail ? `${baseLink}?prefill[email]=${encodeURIComponent(userEmail)}` : baseLink;
              const priceLabel = annual ? p.annual : p.monthly;
              const priceSuffix = p.trialPlan ? " / 14 days" : p.agency ? "" : annual ? "/year" : "/month";

              let btn: React.ReactNode = null;
              if (isOwner) {
                btn = <button disabled className="mt-5 h-10 w-full rounded-lg flex items-center justify-center gap-2 text-sm font-semibold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 cursor-not-allowed"><Crown className="h-4 w-4" /> Owner</button>;
              } else if (p.agency) {
                btn = isCurrent
                  ? <button disabled className="mt-5 h-10 w-full rounded-lg text-sm font-semibold bg-white/[0.06] text-white/50 border border-white/10 cursor-not-allowed">Current plan</button>
                  : <a href="https://wa.me/918989568529?text=Hi, I want to know about Replora Agency plan" target="_blank" rel="noopener noreferrer" className="mt-5 h-10 w-full rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: p.accent }}><MessageCircle className="h-4 w-4" /> Talk to us →</a>;
              } else if (p.trialPlan) {
                btn = <button disabled className="mt-5 h-10 w-full rounded-lg text-sm font-semibold bg-white/[0.06] text-white/50 border border-white/10 cursor-not-allowed">{isCurrent ? "Current plan" : "—"}</button>;
              } else if (isCurrent) {
                btn = <button disabled className="mt-5 h-10 w-full rounded-lg text-sm font-semibold bg-white/[0.06] text-white/50 border border-white/10 cursor-not-allowed">Current plan</button>;
              } else if (isDowngrade) {
                btn = <button disabled className="mt-5 h-10 w-full rounded-lg text-sm font-semibold bg-white/[0.04] text-white/40 border border-white/10 cursor-not-allowed">Downgrade</button>;
              } else if (isUpgrade && link) {
                btn = <a href={link} target="_blank" rel="noopener noreferrer" className="mt-5 h-10 w-full rounded-lg flex items-center justify-center gap-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: p.accent }}>Upgrade <ArrowUpRight className="h-4 w-4" /></a>;
              }

              return (
                <div key={p.key} className="bg-[#0f1117] rounded-xl p-5 flex flex-col transition-all" style={{ border: `1px solid ${p.badge ? "#0084ff" : "rgba(255,255,255,0.07)"}` }}>
                  <div className="flex items-center justify-between mb-3 min-h-[24px]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">{p.name}</span>
                    {p.badge && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[#0084ff]/15 text-[#0084ff] border-[#0084ff]/30">{p.badge}</span>}
                  </div>
                  <div className="text-2xl font-semibold text-white">{priceLabel}{priceSuffix && <span className="text-sm font-normal text-white/50">{priceSuffix}</span>}</div>
                  <ul className="mt-4 space-y-2 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: p.accent }} />
                        <span className="text-[13px] text-white/75">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {btn}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8 space-y-1">
            <p className="text-xs text-white/50">Plans and addons cannot be cancelled or refunded once purchased.</p>
            <p className="text-xs text-white/50">Need help or want to cancel? Email us at <a href="mailto:care@replora.in" className="text-[#0084ff] hover:underline">care@replora.in</a></p>
          </div>
          <div className="text-center mt-6 space-y-1">
            <p className="text-sm text-white/70">After payment your plan upgrades automatically within minutes.</p>
            <p className="text-xs text-white/50">Questions? WhatsApp us at +91 89895 68529</p>
          </div>

          <div className="my-12 border-t border-white/[0.07]" />

          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white tracking-tight">Need more numbers?</h2>
            <p className="text-sm text-white/60 mt-2">Add extra WhatsApp numbers without changing your plan</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {ADDONS.map((a) => {
              const highlight = !isOwner && a.plan === plan;
              const addonLink = userEmail ? `${a.link}?prefill[email]=${encodeURIComponent(userEmail)}` : a.link;
              return (
                <div key={a.plan} className="bg-[#0f1117] rounded-xl p-5 flex flex-col transition-all" style={{ border: `1px solid ${highlight ? a.accent : "rgba(255,255,255,0.07)"}` }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/80 mb-2">{a.name}</div>
                  <div className="text-2xl font-semibold text-white">{a.price}<span className="text-sm font-normal text-white/50">/number/month</span></div>
                  <a href={addonLink} target="_blank" rel="noopener noreferrer" className={`mt-5 h-10 w-full rounded-lg flex items-center justify-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-90 ${isOwner ? "pointer-events-none opacity-50" : ""}`} style={{ backgroundColor: a.accent, color: "white" }}>Add number <ArrowUpRight className="h-4 w-4" /></a>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-white/50 mt-6">Addon numbers billed monthly. To cancel an addon contact <a href="mailto:care@replora.in" className="text-[#0084ff] hover:underline">care@replora.in</a></p>
          {loading && <div className="text-center text-white/40 text-xs mt-6">Loading your plan…</div>}
        </div>
      </div>
    </AppLayout>
  );
}

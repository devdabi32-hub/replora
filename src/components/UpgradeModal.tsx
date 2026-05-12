import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { X, Check, Crown } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAccountStatus } from "@/hooks/useAccountStatus";

type Ctx = { open: () => void; close: () => void; isOpen: boolean };
const UpgradeCtx = createContext<Ctx>({ open: () => {}, close: () => {}, isOpen: false });

export function useUpgradeModal() {
  return useContext(UpgradeCtx);
}

const WA = (plan: string) =>
  `https://wa.me/919589568529?text=${encodeURIComponent(`Hi, I want to upgrade to ${plan} plan on Replora`)}`;

type Plan = {
  key: "Starter" | "Growth" | "Agency";
  price: string;
  features: string[];
  badge?: { label: string; cls: string };
  highlight?: boolean;
  accent: string;
};

const PLANS: Plan[] = [
  {
    key: "Starter",
    price: "₹1,499",
    badge: { label: "Most Popular", cls: "bg-[#0084ff]/15 text-[#0084ff] border-[#0084ff]/30" },
    highlight: true,
    accent: "#0084ff",
    features: [
      "1 WhatsApp number",
      "1 API key",
      "Unlimited messages",
      "Full AI dashboard",
      "30-day data retention",
    ],
  },
  {
    key: "Growth",
    price: "₹3,999",
    accent: "#00c853",
    features: [
      "5 WhatsApp numbers",
      "3 API keys",
      "Everything in Starter",
      "Priority WhatsApp support",
      "90-day data retention",
      "PDF reports",
    ],
  },
  {
    key: "Agency",
    price: "₹9,999",
    accent: "#f59e0b",
    features: [
      "Unlimited numbers",
      "Unlimited API keys",
      "Everything in Growth",
      "White label (coming soon)",
      "1-year data retention",
      "Dedicated manager",
    ],
  },
];

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const status = useAccountStatus();
  const isExpired = status.isExpired;

  return (
    <UpgradeCtx.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => { if (!isExpired) close(); }}
        >
          <div
            className="relative w-full max-w-5xl bg-[#0f1117] border border-white/[0.07] rounded-2xl shadow-2xl p-6 sm:p-8 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {!isExpired && (
              <button
                onClick={close}
                className="absolute right-4 top-4 h-8 w-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-3 mb-2">
              <LogoMark className="h-9 w-9" />
              <span className="text-[13px] font-bold tracking-[0.18em] text-white">REPLORA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Choose your plan</h2>
            {isExpired && (
              <p className="text-sm text-white/60 mt-2">
                Your trial has ended. View your existing data below or upgrade to continue.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {PLANS.map((p) => (
                <div
                  key={p.key}
                  className="bg-[#0f1117] rounded-xl p-5 flex flex-col transition-colors"
                  style={{
                    border: `1px solid ${p.highlight ? "#0084ff" : "rgba(255,255,255,0.07)"}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0084ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = p.highlight ? "#0084ff" : "rgba(255,255,255,0.07)"; }}
                >
                  <div className="flex items-center justify-between mb-3 min-h-[24px]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">{p.key}</span>
                    {p.badge && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${p.badge.cls}`}>
                        {p.badge.label}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-semibold text-white">
                    {p.price}
                    <span className="text-sm font-normal text-white/60">/month</span>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-white/80 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: p.accent }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={WA(p.key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 h-11 w-full rounded-lg flex items-center justify-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: p.accent }}
                  >
                    Get {p.key} →
                  </a>
                </div>
              ))}
            </div>

            {!isExpired && (
              <p className="text-xs text-white/40 text-center mt-6">
                <Crown className="inline h-3 w-3 mr-1 text-[#f59e0b]" />
                Want to just browse your old data? Close this after selecting a plan.
              </p>
            )}
          </div>
        </div>
      )}
    </UpgradeCtx.Provider>
  );
}
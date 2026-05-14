import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { X, Check, Crown, MessageCircle } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAccountStatus } from "@/hooks/useAccountStatus";

type Ctx = { open: () => void; close: () => void; isOpen: boolean };
const UpgradeCtx = createContext<Ctx>({ open: () => {}, close: () => {}, isOpen: false });

export function useUpgradeModal() {
  return useContext(UpgradeCtx);
}

type Plan = {
  key: string;
  price: string | null;
  tagline: string;
  features: string[];
  badge?: { label: string; cls: string };
  highlight?: boolean;
  accent: string;
  cta: string;
  link: string;
};

const PLANS: Plan[] = [
  {
    key: "Starter",
    price: "₹999",
    tagline: "Start monitoring today",
    badge: { label: "Most Popular", cls: "bg-[#0084ff]/15 text-[#0084ff] border-[#0084ff]/30" },
    highlight: true,
    accent: "#0084ff",
    cta: "Get Starter →",
    link: "https://rzp.io/rzp/3Km2lwAT",
    features: [
      "3 WhatsApp numbers",
      "1 API key",
      "Unlimited messages",
      "Full AI dashboard",
      "30-day data retention",
    ],
  },
  {
    key: "Pro",
    price: "₹2,499",
    tagline: "For growing teams",
    accent: "#00c853",
    cta: "Get Pro →",
    link: "https://rzp.io/rzp/OwCF0wg",
    features: [
      "10 WhatsApp numbers",
      "3 API keys",
      "Everything in Starter",
      "Priority support",
      "60-day data retention",
    ],
  },
  {
    key: "Growth",
    price: "₹4,999",
    tagline: "For scaling agencies",
    accent: "#8b5cf6",
    cta: "Get Growth →",
    link: "https://rzp.io/rzp/2jdywV5",
    features: [
      "25 WhatsApp numbers",
      "5 API keys",
      "Everything in Pro",
      "PDF reports",
      "90-day data retention",
    ],
  },
  {
    key: "Agency",
    price: null,
    tagline: "Enterprise & white-label",
    accent: "#f59e0b",
    cta: "Contact Sales",
    link: "https://wa.me/918989568529",
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
  const { isExpired, isOwner } = useAccountStatus();

  // Auto-open wall when trial expires, never for owner
  useEffect(() => {
    if (isExpired && !isOwner) setOpen(true);
  }, [isExpired, isOwner]);

  return (
    <UpgradeCtx.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
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

            {isExpired ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  Your trial has ended
                </h2>
                <p className="text-sm text-white/60 mt-2">
                  Upgrade to keep receiving messages. Your existing data is safe.
                </p>
              </>
            ) : (
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Choose your plan
              </h2>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {PLANS.map((p) => (
                <div
                  key={p.key}
                  className="bg-[#0B141A] rounded-xl p-5 flex flex-col transition-all duration-150"
                  style={{
                    border: `1px solid ${p.highlight ? "#0084ff" : "rgba(255,255,255,0.07)"}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = p.accent; }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = p.highlight
                      ? "#0084ff"
                      : "rgba(255,255,255,0.07)";
                  }}
                >
                  <div className="flex items-center justify-between mb-3 min-h-[24px]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                      {p.key}
                    </span>
                    {p.badge && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${p.badge.cls}`}
                      >
                        {p.badge.label}
                      </span>
                    )}
                  </div>

                  {p.price ? (
                    <div className="text-3xl font-semibold text-white">
                      {p.price}
                      <span className="text-sm font-normal text-white/50">/mo</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-semibold text-white/80">Custom</div>
                  )}
                  <p className="text-[11px] text-white/40 mt-1 leading-tight">{p.tagline}</p>

                  <ul className="mt-4 space-y-2 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check
                          className="h-3.5 w-3.5 mt-0.5 shrink-0"
                          style={{ color: p.accent }}
                        />
                        <span className="text-[13px] text-white/75">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 h-10 w-full rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={
                      p.key === "Agency"
                        ? {
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                          }
                        : { backgroundColor: p.accent }
                    }
                  >
                    {p.key === "Agency" && <MessageCircle className="h-4 w-4" />}
                    {p.cta}
                  </a>
                </div>
              ))}
            </div>

            {isExpired ? (
              <div className="mt-5 text-center">
                <button
                  onClick={close}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
                >
                  View existing data only
                </button>
              </div>
            ) : (
              <p className="text-xs text-white/40 text-center mt-5">
                <Crown className="inline h-3 w-3 mr-1 text-[#f59e0b]" />
                All plans include WhatsApp setup support · Prices in INR · Billed monthly
              </p>
            )}
          </div>
        </div>
      )}
    </UpgradeCtx.Provider>
  );
}

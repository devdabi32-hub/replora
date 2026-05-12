import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useUpgradeModal } from "@/components/UpgradeModal";

export function TrialBanner() {
  const { plan, daysLeft, isOwner, loading } = useAccountStatus();
  const { open } = useUpgradeModal();

  if (loading) return null;
  if (isOwner) return null;
  if (plan !== "trial") return null;
  if (daysLeft <= 0) return null;

  const urgent = daysLeft <= 3;
  const bg = urgent ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)";
  const border = urgent ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)";

  return (
    <div
      className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3"
      style={{ background: bg, borderBottom: `1px solid ${border}` }}
    >
      <span className="text-[13px] text-white/85 font-medium">
        ⏳ {daysLeft} {daysLeft === 1 ? "day" : "days"} left on your free trial
      </span>
      <button
        onClick={open}
        className="text-[13px] font-semibold px-3 py-1.5 rounded-md text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: "#f59e0b" }}
      >
        Upgrade Plan →
      </button>
    </div>
  );
}
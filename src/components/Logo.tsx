import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      className={`${className} relative rounded-xl bg-gradient-to-br from-[#0084ff] to-[#00c853] flex items-center justify-center shadow-lg shadow-[#0084ff]/30`}
    >
      <Eye className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
    </div>
  );
}

export function Logo({
  size = "md",
  withTagline = false,
  asLink = false,
}: {
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  asLink?: boolean;
}) {
  const markSize = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "lg" ? "text-xl" : size === "sm" ? "text-[15px]" : "text-base";

  const inner = (
    <div className="flex items-center gap-2.5">
      <LogoMark className={markSize} />
      <div className="leading-tight">
        <div className={`font-semibold tracking-tight text-white ${textSize}`}>Replora</div>
        {withTagline && (
          <div className="text-[11px] text-white/60 mt-0.5">Your AI talks. You watch.</div>
        )}
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link to="/" className="inline-flex">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default Logo;
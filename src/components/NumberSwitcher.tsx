import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Phone, Settings } from "lucide-react";
import { usePhoneContext } from "@/contexts/PhoneContext";

export function NumberSwitcher() {
  const { connections, selectedId, selectedConnection, setSelectedId, loading } = usePhoneContext();
  const [open, setOpen] = useState(false);

  if (loading || connections.length === 0) return null;

  const hasMultiple = connections.length > 1;

  return (
    <div className="px-3 py-2.5 border-b border-white/[0.06]">
      <button
        onClick={() => hasMultiple && setOpen((o) => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] transition-colors ${
          hasMultiple ? "hover:bg-white/[0.07] cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="h-7 w-7 rounded-lg bg-[#0084ff]/15 flex items-center justify-center shrink-0">
          <Phone className="h-3.5 w-3.5 text-[#0084ff]" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold leading-none mb-0.5">
            Active Number
          </div>
          <div className="text-[13px] font-semibold text-white truncate leading-tight">
            {selectedConnection?.label ?? "—"}
          </div>
        </div>
        {hasMultiple && (
          <ChevronDown
            className={`h-4 w-4 text-white/40 shrink-0 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {open && (
        <div className="mt-1 bg-[#161b22] border border-white/10 rounded-xl py-1.5 overflow-hidden">
          {connections.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedId(c.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                c.id === selectedId
                  ? "bg-[#0084ff]/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div
                className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${
                  c.id === selectedId ? "bg-[#0084ff]/20" : "bg-white/5"
                }`}
              >
                <Phone
                  className={`h-3 w-3 ${c.id === selectedId ? "text-[#0084ff]" : "text-white/40"}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">{c.label}</div>
                <div className="text-[11px] text-white/40 truncate font-mono">{c.phone_number}</div>
              </div>
              {c.id === selectedId && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#0084ff] shrink-0" />
              )}
            </button>
          ))}
          <div className="my-1 border-t border-white/10" />
          <Link
            to="/connections"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="text-[13px]">Manage connections</span>
          </Link>
        </div>
      )}
    </div>
  );
}

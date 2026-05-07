import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Copy, Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — WA Monitor" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/login" });
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const webhook = `https://wa-monitor.lovable.app/api/webhook/${userId ?? "..."}`;

  const copy = async () => {
    await navigator.clipboard.writeText(webhook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div className="text-xl font-semibold text-slate-900">WA Monitor</div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">🎉 Welcome aboard!</h1>
          <p className="text-sm text-slate-500 mb-6">Your account is ready. Connect your n8n workflow to start monitoring messages.</p>

          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Your unique webhook URL</div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <code className="flex-1 text-xs text-slate-800 break-all font-mono">{webhook}</code>
            <button onClick={copy} disabled={!userId}
              className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-[#0084ff] hover:bg-[#0066cc] text-white text-xs font-medium disabled:opacity-50 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-blue-900 mb-1">📋 Setup instructions</div>
            <p className="text-sm text-blue-800">Paste this URL in your n8n HTTP Request node to start sending WhatsApp messages to your monitoring portal.</p>
          </div>

          <button onClick={() => navigate({ to: "/" })}
            className="w-full mt-6 h-11 rounded-lg bg-[#0f1117] hover:bg-slate-800 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            Go to my inbox <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
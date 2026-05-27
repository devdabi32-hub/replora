import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/automations")({
    head: () => ({ meta: [{ title: "Automations — Replora" }] }),
    component: AutomationsPage,
});

function AutomationsPage() {
    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-white tracking-tight">
                        Automations
                    </h1>
                    <p className="text-sm text-white/60 mt-1.5">
                        Configure your AI engine and set auto-reply rules per WhatsApp number.
                    </p>
                </div>

                <div className="bg-[#0f1117] rounded-2xl border border-white/10 p-12 flex flex-col items-center justify-center text-center">
                    <div className="h-14 w-14 rounded-2xl bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center mb-5">
                        <Zap className="h-7 w-7" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                        AI Config Engine
                    </h2>
                    <p className="text-sm text-white/50 max-w-sm leading-relaxed">
                        Choose your AI provider (Gemini, OpenAI, DeepSeek, Groq, Claude or
                        custom n8n webhook), set your API key, system prompt and auto-reply
                        rules — per WhatsApp number.
                    </p>
                    <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-[#0084ff]/10 border border-[#0084ff]/20">
                        <span className="h-2 w-2 rounded-full bg-[#0084ff] animate-pulse" />
                        <span className="text-xs text-[#0084ff] font-medium">
                            Full UI coming in next update
                        </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
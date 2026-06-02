import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { usePhoneContext } from "@/contexts/PhoneContext";
import {
    Bot,
    Zap,
    MessageSquare,
    Clock,
    Bell,
    Eye,
    EyeOff,
    Copy,
    Check,
    Save,
    Plus,
    Trash2,
    ChevronRight,
    Activity,
    Settings,
    ToggleLeft,
    ToggleRight,
    Phone,
    RefreshCw,
    Info,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/automations")({
    head: () => ({ meta: [{ title: "Automations — Replora" }] }),
    component: () => (
        <AppLayout>
            <AutomationsPage />
        </AppLayout>
    ),
});

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
type Provider = "groq" | "openai" | "anthropic" | "gemini" | "mistral" | "ollama" | "custom";

interface AIConfig {
    provider: Provider;
    model: string;
    customModel: string;
    apiKey: string;
    systemPrompt: string;
    autoReply: boolean;
}

interface QuickAutomation {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    enabled: boolean;
    color: string;
    bgColor: string;
    extra?: React.ReactNode;
}

interface QuickReply {
    id: string;
    shortcut: string;
    message: string;
}

interface Connection {
    id: string;
    display_name: string;
    phone_number: string;
    is_active: boolean;
    message_count: number;
    last_activity: string | null;
}

/* ─────────────────────────────────────────────────────────────
   Provider → default models
───────────────────────────────────────────────────────────── */
const PROVIDER_MODELS: Record<Provider, string[]> = {
    groq: ["Llama 3.1 8B Instant", "Llama 3.3 70B Versatile", "Mixtral 8x7B", "Gemma 2 9B"],
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    anthropic: ["claude-3-5-haiku", "claude-3-5-sonnet", "claude-opus-4"],
    gemini: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    mistral: ["mistral-small", "mistral-medium", "mistral-large"],
    ollama: ["llama3", "mistral", "codellama", "phi3"],
    custom: [],
};

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
function AutomationsPage() {
    const { selectedId } = usePhoneContext();

    /* ── AI Engine state ── */
    const [aiConfig, setAiConfig] = useState<AIConfig>({
        provider: "groq",
        model: "Llama 3.1 8B Instant",
        customModel: "",
        apiKey: "",
        systemPrompt:
            "You are a helpful WhatsApp assistant. Keep replies short, clear, and friendly. Maximum 2-3 sentences. Always reply in the same language the customer uses. Remember context from earlier in this conversation.",
        autoReply: false,
    });
    const [showKey, setShowKey] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [savingAI, setSavingAI] = useState(false);

    /* ── OOO time ── */
    const [oooFrom, setOooFrom] = useState("10:00 PM");
    const [oooTo, setOooTo] = useState("09:00 AM");
    const [oooMsg, setOooMsg] = useState(
        "We are currently out of office. We will reply during business hours."
    );

    /* ── Quick Automations ── */
    const [automations, setAutomations] = useState({
        welcome: false,
        ooo: true,
        followup: false,
    });

    /* ── Quick Replies ── */
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [newShortcut, setNewShortcut] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [savingQR, setSavingQR] = useState(false);

    /* ── Connections status ── */
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loadingConns, setLoadingConns] = useState(true);

    /* ─── Load connections ─── */
    /* ─── Load AI config + connections when selectedId changes ─── */
    useEffect(() => {
        const load = async () => {
            // Load connections list
            const { data: connData } = await supabase
                .from("connected_phone_numbers")
                .select("id,display_name,phone_number,is_active,message_count,last_activity")
                .order("connected_at", { ascending: false });
            setConnections((connData ?? []) as Connection[]);
            setLoadingConns(false);

            // Load AI config for selected number
            if (!selectedId) return;
            const { data: cfg, error } = await supabase
                .from("connected_phone_numbers")
                .select(
                    "ai_engine,ai_model,ai_api_key,system_prompt,auto_reply,welcome_message_enabled,out_of_office_enabled,out_of_office_start,out_of_office_end,out_of_office_text,followup_enabled"
                )
                .eq("id", selectedId)
                .single();

            if (error || !cfg) return;

            // Map DB ai_engine → frontend Provider type
            const providerMap: Record<string, Provider> = {
                groq: "groq",
                openai: "openai",
                claude: "anthropic",
                gemini: "gemini",
                deepseek: "custom",
                webhook: "custom",
                off: "groq",
            };
            const provider = (providerMap[cfg.ai_engine] ?? "groq") as Provider;
            const dbModel = cfg.ai_model ?? "";
            const knownModels = PROVIDER_MODELS[provider] ?? [];
            const isCustomModel = dbModel && !knownModels.includes(dbModel);

            setAiConfig({
                provider,
                model: isCustomModel ? (knownModels[0] ?? "") : dbModel,
                customModel: isCustomModel ? dbModel : "",
                apiKey: cfg.ai_api_key ?? "",
                systemPrompt: cfg.system_prompt ?? "",
                autoReply: cfg.auto_reply ?? false,
            });

            setAutomations({
                welcome: cfg.welcome_message_enabled ?? false,
                ooo: cfg.out_of_office_enabled ?? false,
                followup: cfg.followup_enabled ?? false,
            });

            // OOO times — DB stores "22:00:00", display as "10:00 PM"
            if (cfg.out_of_office_start) {
                const [h, m] = cfg.out_of_office_start.split(":").map(Number);
                const d = new Date(); d.setHours(h, m);
                setOooFrom(d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
            }
            if (cfg.out_of_office_end) {
                const [h, m] = cfg.out_of_office_end.split(":").map(Number);
                const d = new Date(); d.setHours(h, m);
                setOooTo(d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
            }
            if (cfg.out_of_office_text) setOooMsg(cfg.out_of_office_text);
        };
        load();
    }, [selectedId]); // re-runs when number switcher changes

    /* ─── Handlers ─── */
    const handleSaveAI = async () => {
        if (!selectedId) {
            toast.error("No WhatsApp number selected. Select a number from the topbar first.");
            return;
        }
        setSavingAI(true);

        // Map frontend Provider → DB ai_engine value
        const engineMap: Record<Provider, string> = {
            groq: "groq",
            openai: "openai",
            anthropic: "claude",
            gemini: "gemini",
            mistral: "groq",   // fallback — mistral uses groq-compatible
            ollama: "webhook", // fallback
            custom: "groq",    // fallback
        };
        const aiEngine = engineMap[aiConfig.provider] ?? "off";
        const finalModel = aiConfig.customModel.trim() || aiConfig.model;

        // Convert "10:00 PM" → "22:00" for DB (time column)
        const parseTime = (t: string): string => {
            try {
                const d = new Date(`1970-01-01 ${t}`);
                return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            } catch { return t; }
        };

        const { error } = await supabase
            .from("connected_phone_numbers")
            .update({
                ai_engine: aiEngine,
                ai_model: finalModel,
                ai_api_key: aiConfig.apiKey,
                system_prompt: aiConfig.systemPrompt,
                auto_reply: aiConfig.autoReply,
                welcome_message_enabled: automations.welcome,
                out_of_office_enabled: automations.ooo,
                out_of_office_start: parseTime(oooFrom),
                out_of_office_end: parseTime(oooTo),
                out_of_office_text: oooMsg,
                followup_enabled: automations.followup,
            })
            .eq("id", selectedId);

        setSavingAI(false);

        if (error) {
            toast.error("Save failed: " + error.message);
        } else {
            toast.success("Configuration saved ✓");
        }
    };

    const handleCopyKey = () => {
        navigator.clipboard.writeText(aiConfig.apiKey);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    const handleAddQuickReply = async () => {
        if (!newShortcut.trim() || !newMessage.trim()) return;
        setSavingQR(true);
        await new Promise((r) => setTimeout(r, 400));
        setQuickReplies((prev) => [
            ...prev,
            { id: crypto.randomUUID(), shortcut: newShortcut.trim(), message: newMessage.trim() },
        ]);
        setNewShortcut("");
        setNewMessage("");
        setSavingQR(false);
        toast.success("Quick reply saved");
    };

    const handleDeleteQR = (id: string) => {
        setQuickReplies((prev) => prev.filter((r) => r.id !== id));
        toast.success("Quick reply deleted");
    };

    const models =
        aiConfig.provider === "custom"
            ? []
            : PROVIDER_MODELS[aiConfig.provider as Provider] || [];

    /* ─────────────────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#000000] p-6">
            {/* ── Page Header ── */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Automations</h1>
                    <p className="mt-1 text-sm text-white/40">
                        Configure AI engine and auto-reply rules per WhatsApp number.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#0084ff] bg-[#0084ff]/10 border border-[#0084ff]/20 rounded-lg px-3 py-2">
                    <Info className="h-3.5 w-3.5" />
                    <span>Each number has its own AI profile. Before using, ensure connections are live →</span>
                </div>
            </div>

            {/* ── 2-Column Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* ══════════════════════════════════════════
            LEFT COLUMN
        ══════════════════════════════════════════ */}
                <div className="flex flex-col gap-6">

                    {/* ── Card: AI Engine ── */}
                    <div className="bg-[#0f1117] border border-white/[0.07] rounded-2xl overflow-hidden">
                        {/* Card Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-[#0084ff]/15 flex items-center justify-center">
                                    <Bot className="h-4.5 w-4.5 text-[#0084ff]" style={{ height: 18, width: 18 }} />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">AI Engine</div>
                                    <div className="text-[11px] text-white/40 mt-0.5">LLM provider & model</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20">
                                Beta
                            </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-5">
                            {/* Provider + Model row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                                        AI Provider
                                    </label>
                                    <select
                                        value={aiConfig.provider}
                                        onChange={(e) => {
                                            const p = e.target.value as Provider;
                                            setAiConfig((s) => ({
                                                ...s,
                                                provider: p,
                                                model: PROVIDER_MODELS[p]?.[0] ?? "",
                                                customModel: "",
                                            }));
                                        }}
                                        className="w-full h-10 px-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff]/40 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="groq">Groq</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic</option>
                                        <option value="gemini">Google Gemini</option>
                                        <option value="mistral">Mistral</option>
                                        <option value="ollama">Ollama (Local)</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                                        Model
                                    </label>
                                    {aiConfig.provider === "custom" ? (
                                        <input
                                            value={aiConfig.customModel}
                                            onChange={(e) => setAiConfig((s) => ({ ...s, customModel: e.target.value }))}
                                            placeholder="Enter model name..."
                                            className="w-full h-10 px-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff]/40 outline-none"
                                        />
                                    ) : (
                                        <select
                                            value={aiConfig.model}
                                            onChange={(e) => setAiConfig((s) => ({ ...s, model: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff]/40 outline-none appearance-none cursor-pointer"
                                        >
                                            {models.map((m) => (
                                                <option key={m} value={m}>
                                                    {m}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Or type custom model */}
                            {aiConfig.provider !== "custom" && (
                                <input
                                    value={aiConfig.customModel}
                                    onChange={(e) => setAiConfig((s) => ({ ...s, customModel: e.target.value }))}
                                    placeholder="Or type a custom model name..."
                                    className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/70 text-sm placeholder:text-white/25 focus:border-[#0084ff]/60 focus:ring-1 focus:ring-[#0084ff]/20 outline-none"
                                />
                            )}

                            {/* API Key */}
                            <div>
                                <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                                    API Key
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={aiConfig.apiKey}
                                            onChange={(e) => setAiConfig((s) => ({ ...s, apiKey: e.target.value }))}
                                            placeholder="sk-..."
                                            className="w-full h-10 pl-3 pr-10 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff]/40 outline-none font-mono"
                                        />
                                        <button
                                            onClick={() => setShowKey((s) => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                        >
                                            {showKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleCopyKey}
                                        className="h-10 w-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.1] transition-all"
                                    >
                                        {copiedKey ? (
                                            <Check className="h-4 w-4 text-[#00c853]" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <div className="mt-1.5 flex items-center gap-3">
                                    <p className="text-[11px] text-white/30">Stored securely. Never exposed to clients.</p>
                                    <button className="text-[11px] text-[#0084ff] hover:text-[#3da5ff] transition-colors ml-auto">
                                        Get free API key →
                                    </button>
                                </div>
                            </div>

                            {/* System Prompt */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                                        System Prompt
                                    </label>
                                    <span className="text-[10px] text-white/30">Optional</span>
                                </div>
                                <textarea
                                    value={aiConfig.systemPrompt}
                                    onChange={(e) => setAiConfig((s) => ({ ...s, systemPrompt: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff]/40 outline-none resize-none leading-relaxed"
                                />
                            </div>

                            {/* Auto Reply Toggle + Save */}
                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setAiConfig((s) => ({ ...s, autoReply: !s.autoReply }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiConfig.autoReply ? "bg-[#0084ff]" : "bg-white/10"
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiConfig.autoReply ? "translate-x-6" : "translate-x-1"
                                                }`}
                                        />
                                    </button>
                                    <div>
                                        <div className="text-sm font-medium text-white">Auto Reply</div>
                                        <div className="text-[11px] text-white/40">Automatically replies to incoming messages</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveAI}
                                    disabled={savingAI}
                                    className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#0084ff] hover:bg-[#0066cc] disabled:opacity-60 text-white text-sm font-semibold transition-all"
                                >
                                    {savingAI ? (
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Save className="h-3.5 w-3.5" />
                                    )}
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Card: Quick Automations ── */}
                    <div className="bg-[#0f1117] border border-white/[0.07] rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                            <div className="h-9 w-9 rounded-xl bg-[#00c853]/15 flex items-center justify-center">
                                <Zap className="h-4 w-4 text-[#00c853]" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-white">Quick Automations</div>
                                <div className="text-[11px] text-white/40 mt-0.5">One-click rules for common scenarios</div>
                            </div>
                        </div>

                        <div className="p-5 space-y-3">
                            {/* Welcome Message */}
                            <QuickAutomationRow
                                icon={MessageSquare}
                                color="text-[#0084ff]"
                                bg="bg-[#0084ff]/10"
                                label="Welcome Message"
                                description="Send to new contacts on their first message"
                                enabled={automations.welcome}
                                onToggle={() =>
                                    setAutomations((s) => ({ ...s, welcome: !s.welcome }))
                                }
                            />

                            {/* Out of Office */}
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-[#f59e0b]" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">Out of Office</div>
                                            <div className="text-[11px] text-white/40">Reply during non-business hours</div>
                                        </div>
                                    </div>
                                    <Toggle
                                        enabled={automations.ooo}
                                        onToggle={() => setAutomations((s) => ({ ...s, ooo: !s.ooo }))}
                                    />
                                </div>
                                {automations.ooo && (
                                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/[0.05]">
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <div>
                                                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">From (End time)</label>
                                                <input
                                                    type="text"
                                                    value={oooFrom}
                                                    onChange={(e) => setOooFrom(e.target.value)}
                                                    className="w-full h-9 px-3 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm focus:border-[#f59e0b]/60 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">To (Start time)</label>
                                                <input
                                                    type="text"
                                                    value={oooTo}
                                                    onChange={(e) => setOooTo(e.target.value)}
                                                    className="w-full h-9 px-3 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm focus:border-[#f59e0b]/60 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <textarea
                                            value={oooMsg}
                                            onChange={(e) => setOooMsg(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm resize-none focus:border-[#f59e0b]/60 outline-none leading-relaxed"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Follow-up Reminder */}
                            <QuickAutomationRow
                                icon={Bell}
                                color="text-[#a855f7]"
                                bg="bg-[#a855f7]/10"
                                label="Follow-up Reminder"
                                description="Message contacts who haven't replied in 24 hours"
                                enabled={automations.followup}
                                onToggle={() =>
                                    setAutomations((s) => ({ ...s, followup: !s.followup }))
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════
            RIGHT COLUMN
        ══════════════════════════════════════════ */}
                <div className="flex flex-col gap-6">

                    {/* ── Card: Quick Replies ── */}
                    <div className="bg-[#0f1117] border border-white/[0.07] rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-[#00c853]/15 flex items-center justify-center">
                                    <MessageSquare className="h-4 w-4 text-[#00c853]" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">Quick Replies</div>
                                    <div className="text-[11px] text-white/40 mt-0.5">Type / to trigger a saved reply</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-white/30 bg-white/[0.05] px-2 py-1 rounded-md border border-white/[0.07]">
                                {quickReplies.length} saved
                            </span>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Add new row */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-5 gap-2">
                                    <input
                                        value={newShortcut}
                                        onChange={(e) => setNewShortcut(e.target.value)}
                                        placeholder="Shortcut (e.g. /pricing)"
                                        className="col-span-2 h-10 px-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#00c853]/60 focus:ring-1 focus:ring-[#00c853]/20 outline-none"
                                    />
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Full message that gets inserted..."
                                        rows={1}
                                        className="col-span-3 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#00c853]/60 focus:ring-1 focus:ring-[#00c853]/20 outline-none resize-none"
                                    />
                                </div>
                                <button
                                    onClick={handleAddQuickReply}
                                    disabled={savingQR || !newShortcut.trim() || !newMessage.trim()}
                                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#00c853]/10 hover:bg-[#00c853]/20 border border-[#00c853]/20 text-[#00c853] text-sm font-semibold transition-all disabled:opacity-40"
                                >
                                    {savingQR ? (
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Plus className="h-3.5 w-3.5" />
                                    )}
                                    Save Quick Reply
                                </button>
                            </div>

                            {/* List */}
                            {quickReplies.length > 0 && (
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {quickReplies.map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] group"
                                        >
                                            <span className="shrink-0 mt-0.5 text-[11px] font-bold font-mono text-[#00c853] bg-[#00c853]/10 px-2 py-0.5 rounded-md border border-[#00c853]/20">
                                                {r.shortcut}
                                            </span>
                                            <span className="flex-1 text-[13px] text-white/70 leading-snug">
                                                {r.message}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteQR(r.id)}
                                                className="shrink-0 opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/15 transition-all"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {quickReplies.length === 0 && (
                                <div className="text-center py-6 text-white/20 text-sm">
                                    No quick replies yet. Add your first one above.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Card: All Numbers — AI Status ── */}
                    <div className="bg-[#0f1117] border border-white/[0.07] rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-[#0084ff]/15 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-[#0084ff]" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">All Numbers — AI Status</div>
                                    <div className="text-[11px] text-white/40 mt-0.5">Live status of connected WhatsApp numbers</div>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    setLoadingConns(true);
                                    const { data } = await supabase
                                        .from("connected_phone_numbers")
                                        .select("id,display_name,phone_number,is_active,message_count,last_activity")
                                        .order("connected_at", { ascending: false });
                                    setConnections((data ?? []) as Connection[]);
                                    setLoadingConns(false);
                                }}
                                className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-all"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loadingConns ? "animate-spin" : ""}`} />
                            </button>
                        </div>

                        <div className="p-5">
                            {loadingConns ? (
                                <div className="text-center py-8 text-white/30 text-sm">Loading connections…</div>
                            ) : connections.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                    <Phone className="h-8 w-8 text-white/20 mx-auto mb-2" />
                                    <p className="text-white/30 text-sm">No WhatsApp numbers connected yet.</p>
                                    <a
                                        href="/connections"
                                        className="text-[#0084ff] text-xs mt-1 inline-block hover:underline"
                                    >
                                        Add a connection →
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {connections.map((c) => (
                                        <NumberStatusRow key={c.id} connection={c} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Card: Advanced Automations (Coming Soon) ── */}
                    <div className="bg-[#0f1117] border border-white/[0.07] rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-[#a855f7]/15 flex items-center justify-center">
                                    <Settings className="h-4 w-4 text-[#a855f7]" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">Advanced Automations</div>
                                    <div className="text-[11px] text-white/40 mt-0.5">Keyword triggers, conditions & more</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20">
                                Coming Soon
                            </span>
                        </div>

                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Keyword Triggers", desc: "Reply when message contains a keyword", icon: "⚡" },
                                    { label: "Lead Qualifier", desc: "Auto-tag hot/warm/cold based on conversation", icon: "🔥" },
                                    { label: "Pipeline Push", desc: "Auto-add contacts to sales pipeline stages", icon: "📊" },
                                    { label: "Broadcast Scheduler", desc: "Send bulk messages at scheduled times", icon: "📢" },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02] opacity-60 cursor-not-allowed"
                                    >
                                        <div className="text-lg mb-2">{item.icon}</div>
                                        <div className="text-[13px] font-semibold text-white/80">{item.label}</div>
                                        <div className="text-[11px] text-white/40 mt-0.5 leading-snug">{item.desc}</div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[11px] text-white/25 text-center mt-4">
                                These features are in active development. Available in the next update.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

function Toggle({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-[#0084ff]" : "bg-white/10"
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );
}

function QuickAutomationRow({
    icon: Icon,
    color,
    bg,
    label,
    description,
    enabled,
    onToggle,
}: {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-[11px] text-white/40">{description}</div>
                </div>
            </div>
            <Toggle enabled={enabled} onToggle={onToggle} />
        </div>
    );
}

function NumberStatusRow({ connection }: { connection: Connection }) {
    const initials = connection.display_name
        ? connection.display_name.slice(0, 2).toUpperCase()
        : "WA";

    const lastSeen = connection.last_activity
        ? new Date(connection.last_activity).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "No activity";

    return (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-[#0084ff]/20 text-[#0084ff] text-xs font-bold flex items-center justify-center shrink-0">
                    {initials}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                        {connection.display_name || "WhatsApp Number"}
                    </div>
                    <div className="text-[11px] text-white/40 font-mono">{connection.phone_number}</div>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                    <div className="text-[11px] font-semibold text-white/60">
                        {connection.message_count?.toLocaleString() ?? 0} msgs
                    </div>
                    <div className="text-[10px] text-white/30">{lastSeen}</div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span
                        className={`h-2 w-2 rounded-full ${connection.is_active ? "bg-[#00c853]" : "bg-red-500"
                            }`}
                    />
                    <span
                        className={`text-[10px] font-semibold uppercase tracking-wide ${connection.is_active ? "text-[#00c853]" : "text-red-400"
                            }`}
                    >
                        {connection.is_active ? "Live" : "Offline"}
                    </span>
                </div>
                <a
                    href="/connections"
                    className="h-7 w-7 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.1] transition-all"
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </a>
            </div>
        </div>
    );
}

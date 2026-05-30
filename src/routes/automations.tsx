import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { usePhoneContext } from "@/contexts/PhoneContext";
import { Zap, ChevronDown, Eye, EyeOff, Save, CheckCircle2, Phone, Info, AlertTriangle, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/automations")({
    head: () => ({ meta: [{ title: "Automations — Replora" }] }),
    component: AutomationsPage,
});

const PROVIDERS = [
    { value: "off", label: "Off — No AI" },
    { value: "groq", label: "Groq" },
    { value: "gemini", label: "Google Gemini" },
    { value: "openai", label: "OpenAI / ChatGPT" },
    { value: "deepseek", label: "DeepSeek" },
    { value: "claude", label: "Claude / Anthropic" },
    { value: "webhook", label: "Custom / n8n Webhook" },
];

type ModelOpt = { value: string; label: string };
const MODELS: Record<string, ModelOpt[]> = {
    groq: [
        { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant ⚡ Default (Free)" },
        { value: "llama3-8b-8192", label: "Llama 3 8B" },
        { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
        { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
        { value: "gemma2-9b-it", label: "Gemma 2 9B" },
    ],
    gemini: [
        { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash ⚡ Default (Free)" },
        { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
        { value: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash 8B (Fastest)" },
    ],
    openai: [
        { value: "gpt-4o-mini", label: "GPT-4o Mini (Default)" },
        { value: "gpt-4o", label: "GPT-4o" },
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    deepseek: [
        { value: "deepseek-chat", label: "DeepSeek Chat (Default)" },
        { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
    ],
    claude: [
        { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku (Cheapest)" },
        { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
        { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    ],
};

const DEFAULT_MODEL: Record<string, string> = {
    groq: "llama-3.1-8b-instant",
    gemini: "gemini-2.0-flash",
    openai: "gpt-4o-mini",
    deepseek: "deepseek-chat",
    claude: "claude-3-haiku-20240307",
};

const DEPRECATED_MODELS = new Set([
    "llama-3.3-70b-specdec",
    "mixtral-8x7b-32768",
    "gemini-1.5-pro",
    "gpt-4-turbo",
    "claude-3-5-sonnet-20241022",
    "claude-3-opus-20240229",
]);

const KEY_LINK_LABEL: Record<string, string> = {
    groq: "Get free API key →",
    gemini: "Get free API key →",
    openai: "Get API key →",
};

const KEY_LINKS: Record<string, string> = {
    gemini: "https://aistudio.google.com/apikey",
    openai: "https://platform.openai.com/api-keys",
    deepseek: "https://platform.deepseek.com/api_keys",
    groq: "https://console.groq.com/keys",
    claude: "https://console.anthropic.com/settings/api-keys",
};

const ENGINE_BADGE: Record<string, { label: string; cls: string }> = {
    gemini: { label: "Gemini", cls: "bg-green-500/15 text-green-400" },
    openai: { label: "GPT", cls: "bg-blue-500/15 text-blue-400" },
    deepseek: { label: "DeepSeek", cls: "bg-purple-500/15 text-purple-400" },
    groq: { label: "Groq", cls: "bg-orange-500/15 text-orange-400" },
    claude: { label: "Claude", cls: "bg-indigo-500/15 text-indigo-400" },
    webhook: { label: "Webhook", cls: "bg-pink-500/15 text-pink-400" },
    off: { label: "Off", cls: "bg-white/5 text-white/40" },
};

// ── Types ──
type PhoneRow = { id: string; display_name: string; phone_number: string | null; ai_engine: string; ai_model: string | null; auto_reply: boolean };
type Config = {
    ai_engine: string; ai_model: string; ai_api_key: string; system_prompt: string;
    auto_reply: boolean; webhook_url: string; welcome_message_enabled: boolean;
    welcome_message_text: string; out_of_office_enabled: boolean; out_of_office_start: string;
    out_of_office_end: string; out_of_office_text: string; followup_enabled: boolean;
};
type QuickReply = { id: string; shortcut: string; message: string };

const DEF: Config = {
    ai_engine: "off", ai_model: "", ai_api_key: "",
    system_prompt: "You are a helpful WhatsApp assistant. Keep replies short, clear, and friendly. Maximum 2-3 sentences.",
    auto_reply: false, webhook_url: "", welcome_message_enabled: false,
    welcome_message_text: "Hello! Welcome. How can I help you today?",
    out_of_office_enabled: false, out_of_office_start: "22:00", out_of_office_end: "09:00",
    out_of_office_text: "We are currently out of office. We will reply during business hours.",
    followup_enabled: false,
};

// ── Outer shell ──
function AutomationsPage() {
    return <AppLayout><AutomationsContent /></AppLayout>;
}

// ── Inner content ──
function AutomationsContent() {
    const { selectedId: selectedPhone, loading: phoneLoading } = usePhoneContext();
    const [config, setConfig] = useState<Config>(DEF);
    const [saving, setSaving] = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);
    const [keyVisible, setKeyVisible] = useState(false);
    const [keySaved, setKeySaved] = useState(false);
    const [allNumbers, setAllNumbers] = useState<PhoneRow[]>([]);
    const [activeName, setActiveName] = useState("—");

    // Quick Replies state
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [qrShortcut, setQrShortcut] = useState("");
    const [qrMessage, setQrMessage] = useState("");
    const [qrAdding, setQrAdding] = useState(false);
    const [qrSaving, setQrSaving] = useState(false);
    const [agencyId, setAgencyId] = useState<string | null>(null);

    const isWebhook = config.ai_engine === "webhook";
    const isOff = config.ai_engine === "off";
    const models = MODELS[config.ai_engine] ?? [];
    const modelInDropdown = models.some(m => m.value === config.ai_model);
    const dropdownValue = modelInDropdown ? config.ai_model : (DEFAULT_MODEL[config.ai_engine] ?? "");
    const customModel = modelInDropdown ? "" : (config.ai_model ?? "");

    // Load phone config
    useEffect(() => {
        if (!selectedPhone) return;
        (async () => {
            const { data: raw } = await supabase
                .from("connected_phone_numbers").select("*")
                .eq("id", selectedPhone).maybeSingle();
            const d = raw as any;
            if (!d) return;
            setActiveName(d.display_name ?? "—");
            setConfig({
                ai_engine: d.ai_engine ?? "off",
                ai_model: d.ai_model ?? "",
                ai_api_key: d.ai_api_key ?? "",
                system_prompt: d.system_prompt ?? DEF.system_prompt,
                auto_reply: d.auto_reply ?? false,
                webhook_url: d.webhook_url ?? "",
                welcome_message_enabled: d.welcome_message_enabled ?? false,
                welcome_message_text: d.welcome_message_text ?? DEF.welcome_message_text,
                out_of_office_enabled: d.out_of_office_enabled ?? false,
                out_of_office_start: d.out_of_office_start ?? "22:00",
                out_of_office_end: d.out_of_office_end ?? "09:00",
                out_of_office_text: d.out_of_office_text ?? DEF.out_of_office_text,
                followup_enabled: d.followup_enabled ?? false,
            });
            setKeySaved(!!d.ai_api_key);
            setKeyVisible(false);
        })();
    }, [selectedPhone]);

    // Load all numbers + quick replies
    useEffect(() => {
        (async () => {
            const { data: auth } = await supabase.auth.getUser();
            if (!auth.user) return;
            const { data: ur } = await supabase.from("users").select("agency_id").eq("id", auth.user.id).maybeSingle();
            if (!ur?.agency_id) return;
            setAgencyId(ur.agency_id);

            const { data: nums } = await supabase
                .from("connected_phone_numbers")
                .select("id, display_name, phone_number, ai_engine, ai_model, auto_reply")
                .eq("agency_id", ur.agency_id).order("connected_at", { ascending: false });
            if (nums) setAllNumbers(nums as unknown as PhoneRow[]);

            const { data: qrs } = await supabase
                .from("quick_replies")
                .select("*")
                .eq("agency_id", ur.agency_id)
                .order("created_at");
            if (qrs) setQuickReplies(qrs as QuickReply[]);
        })();
    }, [saving]);

    const save = async () => {
        if (!selectedPhone) { toast.error("No number selected"); return; }
        setSaving(true);
        const payload: Record<string, unknown> = {
            ai_engine: config.ai_engine, ai_model: config.ai_model, system_prompt: config.system_prompt,
            auto_reply: config.auto_reply, webhook_url: config.webhook_url,
            welcome_message_enabled: config.welcome_message_enabled, welcome_message_text: config.welcome_message_text,
            out_of_office_enabled: config.out_of_office_enabled, out_of_office_start: config.out_of_office_start,
            out_of_office_end: config.out_of_office_end, out_of_office_text: config.out_of_office_text,
            followup_enabled: config.followup_enabled,
        };
        if (config.ai_api_key && !config.ai_api_key.includes("•")) payload.ai_api_key = config.ai_api_key;
        const { error } = await supabase.from("connected_phone_numbers").update(payload).eq("id", selectedPhone);
        setSaving(false);
        if (error) { toast.error("Save failed: " + error.message); return; }
        toast.success("Configuration saved ✓");
        setKeySaved(true); setKeyVisible(false);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
    };

    const saveQuickReply = async () => {
        if (!agencyId || !qrShortcut.trim() || !qrMessage.trim()) return;
        setQrSaving(true);
        const shortcut = qrShortcut.trim().startsWith("/") ? qrShortcut.trim() : "/" + qrShortcut.trim();
        const { data, error } = await supabase
            .from("quick_replies")
            .insert({ agency_id: agencyId, shortcut, message: qrMessage.trim() })
            .select()
            .single();
        setQrSaving(false);
        if (error) { toast.error("Save failed: " + error.message); return; }
        setQuickReplies(p => [...p, data as QuickReply]);
        setQrShortcut(""); setQrMessage(""); setQrAdding(false);
        toast.success("Quick reply saved ✓");
    };

    const deleteQuickReply = async (id: string) => {
        await supabase.from("quick_replies").delete().eq("id", id);
        setQuickReplies(p => p.filter(q => q.id !== id));
        toast.success("Deleted");
    };

    const set = (k: keyof Config, v: unknown) => setConfig(p => ({ ...p, [k]: v }));
    const changeProvider = (val: string) => {
        set("ai_engine", val);
        set("ai_model", DEFAULT_MODEL[val] ?? "");
        if (!keySaved) set("ai_api_key", "");
    };

    const inp = "w-full h-11 px-3 rounded-lg bg-[#1a1f2e] border border-white/10 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 outline-none text-sm";
    const card = "bg-[#0f1117] rounded-2xl border border-white/[0.07] p-6 mb-5";
    const hasDeprecated = allNumbers.some(n => n.ai_model && DEPRECATED_MODELS.has(n.ai_model));

    if (phoneLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-white/40 text-sm">Loading…</p>
            </div>
        );
    }

    if (!selectedPhone) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Zap className="h-12 w-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 text-sm">Select a WhatsApp number from the top bar to configure AI.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-7">
                <h1 className="text-3xl font-semibold text-white tracking-tight">Automations</h1>
                <p className="text-sm text-white/60 mt-1.5">Configure AI engine and auto-reply rules per WhatsApp number.</p>
            </div>

            {hasDeprecated && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400 leading-relaxed">
                        Some numbers use deprecated models. Update them below to avoid errors.
                    </p>
                </div>
            )}

            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0084ff]/10 border border-[#0084ff]/20 mb-6">
                <Info className="h-4 w-4 text-[#0084ff] shrink-0 mt-0.5" />
                <p className="text-xs text-[#0084ff]/90 leading-relaxed">
                    Each WhatsApp number has its own AI config. Switch numbers from the top bar — config updates automatically.
                </p>
            </div>

            {/* CARD 1 — AI Engine */}
            <div className="bg-[#0f1117] rounded-2xl border border-white/[0.08] p-6 mb-5 transition-shadow hover:shadow-[0_0_40px_-12px_rgba(0,132,255,0.25)]">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#0084ff]/15 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-[#0084ff]" />
                        </div>
                        <h2 className="text-base font-semibold text-white">
                            AI Engine <span className="text-white/40 font-normal">— {activeName}</span>
                        </h2>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${config.auto_reply ? "bg-[#00c853]/15 text-[#00c853]" : "bg-white/5 text-white/40"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${config.auto_reply ? "bg-[#00c853]" : "bg-white/40"}`} />
                        {config.auto_reply ? "Active" : "Paused"}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-1.5 block">AI Provider</label>
                        <div className="relative">
                            <select value={config.ai_engine} onChange={e => changeProvider(e.target.value)} className={`${inp} appearance-none pr-8`}>
                                {PROVIDERS.map(p => <option key={p.value} value={p.value} className="bg-[#0f1117]">{p.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-white/40 pointer-events-none" />
                        </div>
                    </div>
                    {!isWebhook && !isOff && (
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Model</label>
                            <div className="space-y-2">
                                <div className="relative">
                                    <select
                                        value={dropdownValue}
                                        onChange={e => set("ai_model", e.target.value)}
                                        disabled={!!customModel}
                                        className={`${inp} appearance-none pr-8 disabled:opacity-50`}
                                    >
                                        {models.map(m => (
                                            <option key={m.value} value={m.value} className="bg-[#0f1117]">{m.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-white/40 pointer-events-none" />
                                </div>
                                <input
                                    value={customModel}
                                    onChange={e => {
                                        const v = e.target.value;
                                        set("ai_model", v.trim() === "" ? (DEFAULT_MODEL[config.ai_engine] ?? "") : v);
                                    }}
                                    placeholder="Or type custom model name…"
                                    className={`${inp} h-9 text-xs`}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {!isWebhook && !isOff && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium text-gray-300">API Key</label>
                            {KEY_LINK_LABEL[config.ai_engine] && KEY_LINKS[config.ai_engine] && (
                                <a href={KEY_LINKS[config.ai_engine]} target="_blank" rel="noreferrer" className="text-xs text-[#0084ff] hover:underline">
                                    {KEY_LINK_LABEL[config.ai_engine]}
                                </a>
                            )}
                        </div>
                        <div className="relative">
                            <input type={keyVisible ? "text" : "password"}
                                value={keySaved && !keyVisible ? "••••••••••••••••••••••••" : config.ai_api_key}
                                onChange={e => { set("ai_api_key", e.target.value); setKeySaved(false); }}
                                placeholder={`Paste your ${PROVIDERS.find(p => p.value === config.ai_engine)?.label} key`}
                                className={`${inp} pr-10`} />
                            <button type="button" onClick={() => setKeyVisible(v => !v)} className="absolute right-3 top-3 text-white/40 hover:text-white/70">
                                {keyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">Stored securely. Never shared.</p>
                    </div>
                )}

                {isWebhook && (
                    <div className="mb-4">
                        <label className="text-sm font-medium text-gray-300 mb-1.5 block">Webhook URL (n8n or external)</label>
                        <input value={config.webhook_url} onChange={e => set("webhook_url", e.target.value)} placeholder="https://your-n8n.com/webhook/xxx" className={inp} />
                        <p className="text-[10px] text-white/40 mt-1.5">Incoming messages POSTed here. Your automation handles the reply.</p>
                    </div>
                )}

                {!isWebhook && !isOff && (
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-1.5">
                            <label className="text-sm font-medium text-gray-300">System Prompt</label>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-medium">Optional</span>
                        </div>
                        <div className="relative">
                            <textarea
                                value={config.system_prompt}
                                onChange={e => set("system_prompt", e.target.value.slice(0, 500))}
                                placeholder="You are a helpful WhatsApp assistant. Keep replies short, clear, and friendly. Max 2-3 sentences."
                                className="w-full min-h-[100px] px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-white/10 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/50 outline-none text-sm resize-y"
                            />
                            <span className="absolute bottom-2 right-3 text-[10px] text-white/30 pointer-events-none">
                                {config.system_prompt.length} / 500
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1f2e]/50 border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">🤖</span>
                        <div>
                            <div className="text-sm font-semibold text-white">Auto Reply</div>
                            <div className="text-xs text-gray-400 mt-0.5">AI automatically replies to incoming messages</div>
                        </div>
                    </div>
                    <button onClick={() => set("auto_reply", !config.auto_reply)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.auto_reply ? "bg-[#0084ff]" : "bg-white/10"}`}>
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.auto_reply ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                </div>
            </div>

            {/* CARD 2 — Quick Automations */}
            <div className="mb-5">
                <h2 className="text-base font-semibold text-white mb-3 px-1">Quick Automations</h2>
                <div className="space-y-3">
                    {/* Welcome */}
                    <div className="bg-[#0f1117] border border-white/[0.08] hover:border-white/[0.15] transition-colors rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl leading-none">👋</span>
                                <div>
                                    <div className="text-sm font-semibold text-white">Welcome Message</div>
                                    <div className="text-sm text-gray-400 mt-0.5">Send to new contacts on their first message</div>
                                </div>
                            </div>
                            <button onClick={() => set("welcome_message_enabled", !config.welcome_message_enabled)}
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.welcome_message_enabled ? "bg-[#0084ff]" : "bg-white/10"}`}>
                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.welcome_message_enabled ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                        </div>
                        {config.welcome_message_enabled && (
                            <input value={config.welcome_message_text} onChange={e => set("welcome_message_text", e.target.value)} className={`mt-3 ${inp}`} placeholder="Welcome message text…" />
                        )}
                    </div>

                    {/* Out of Office */}
                    <div className="bg-[#0f1117] border border-white/[0.08] hover:border-white/[0.15] transition-colors rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl leading-none">🌙</span>
                                <div>
                                    <div className="text-sm font-semibold text-white">Out of Office</div>
                                    <div className="text-sm text-gray-400 mt-0.5">Auto-reply during non-business hours</div>
                                </div>
                            </div>
                            <button onClick={() => set("out_of_office_enabled", !config.out_of_office_enabled)}
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.out_of_office_enabled ? "bg-[#0084ff]" : "bg-white/10"}`}>
                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.out_of_office_enabled ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                        </div>
                        {config.out_of_office_enabled && (
                            <div className="mt-3 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-white/50 mb-1 block">From (OFF time)</label>
                                        <input type="time" value={config.out_of_office_start} onChange={e => set("out_of_office_start", e.target.value)} className={inp} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 mb-1 block">To (ON time)</label>
                                        <input type="time" value={config.out_of_office_end} onChange={e => set("out_of_office_end", e.target.value)} className={inp} />
                                    </div>
                                </div>
                                <input value={config.out_of_office_text} onChange={e => set("out_of_office_text", e.target.value)} className={inp} placeholder="Out of office message…" />
                            </div>
                        )}
                    </div>

                    {/* Follow-up */}
                    <div className="bg-[#0f1117] border border-white/[0.08] hover:border-white/[0.15] transition-colors rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl leading-none">⏰</span>
                                <div>
                                    <div className="text-sm font-semibold text-white">Follow-up Reminder</div>
                                    <div className="text-sm text-gray-400 mt-0.5">Nudge contacts who haven't replied in 24 hours</div>
                                </div>
                            </div>
                            <button onClick={() => set("followup_enabled", !config.followup_enabled)}
                                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.followup_enabled ? "bg-[#0084ff]" : "bg-white/10"}`}>
                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.followup_enabled ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save */}
            <button onClick={save} disabled={saving}
                className={`w-full h-11 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-5 ${savedFlash ? "bg-[#00c853] hover:bg-[#00c853] text-white" : "bg-[#0084ff] hover:bg-[#0066cc] text-white"}`}>
                {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>)
                    : savedFlash ? (<><CheckCircle2 className="h-4 w-4" /> Saved!</>)
                        : (<><Save className="h-4 w-4" /> Save Configuration</>)}
            </button>

            {/* CARD 3 — Quick Replies */}
            <div className="bg-[#0f1117] rounded-2xl border border-white/[0.07] p-6 mb-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#00c853]/15 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-[#00c853]" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">Quick Replies</h2>
                            <p className="text-xs text-white/40">Type / in inbox to insert a saved reply</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setQrAdding(p => !p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00c853]/15 hover:bg-[#00c853]/25 text-[#00c853] text-xs font-medium transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                </div>

                {qrAdding && (
                    <div className="mb-4 p-4 rounded-xl bg-[#1a1f2e] border border-white/10 space-y-2">
                        <input
                            value={qrShortcut}
                            onChange={e => setQrShortcut(e.target.value)}
                            placeholder="/shortcut (e.g. /hello)"
                            className="w-full h-10 px-3 rounded-lg bg-[#0f1117] border border-white/10 text-white placeholder:text-white/30 focus:border-[#0084ff] outline-none text-sm"
                        />
                        <textarea
                            value={qrMessage}
                            onChange={e => setQrMessage(e.target.value)}
                            placeholder="Full message text that gets inserted…"
                            rows={3}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#0f1117] border border-white/10 text-white placeholder:text-white/30 focus:border-[#0084ff] outline-none text-sm resize-none"
                        />
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={saveQuickReply}
                                disabled={qrSaving || !qrShortcut.trim() || !qrMessage.trim()}
                                className="flex-1 h-9 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                            >
                                {qrSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                Save
                            </button>
                            <button onClick={() => setQrAdding(false)} className="px-4 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {quickReplies.length === 0 && !qrAdding ? (
                    <p className="text-sm text-white/30 text-center py-4">No quick replies yet. Add one above.</p>
                ) : (
                    <div className="space-y-2">
                        {quickReplies.map(qr => (
                            <div key={qr.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.12] transition-colors group">
                                <span className="mt-0.5 px-2 py-0.5 rounded bg-[#0084ff]/15 text-[#0084ff] text-[11px] font-mono font-semibold shrink-0">{qr.shortcut}</span>
                                <span className="flex-1 text-sm text-white/70 leading-relaxed line-clamp-2">{qr.message}</span>
                                <button
                                    onClick={() => deleteQuickReply(qr.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-all shrink-0"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CARD 4 — All Numbers */}
            <div className={card}>
                <h2 className="text-base font-semibold text-white mb-4">All Numbers — AI Status</h2>
                {allNumbers.length === 0 ? (
                    <p className="text-sm text-white/40 text-center py-4">No numbers connected yet.</p>
                ) : (
                    <div className="space-y-2">
                        {allNumbers.map(num => {
                            const badge = ENGINE_BADGE[num.ai_engine] ?? ENGINE_BADGE.off;
                            const isActive = num.id === selectedPhone;
                            const dotColor = num.ai_engine === "groq" ? "bg-[#00c853]"
                                : num.ai_engine === "off" ? "bg-white/20"
                                    : "bg-orange-400";
                            const isDeprecated = num.ai_model && DEPRECATED_MODELS.has(num.ai_model);
                            return (
                                <div key={num.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isActive ? "bg-[#0084ff]/10 border-[#0084ff]/30" : "bg-white/[0.02] border-white/[0.05]"}`}>
                                    <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
                                    <div className="h-8 w-8 rounded-full bg-[#0084ff]/10 flex items-center justify-center shrink-0">
                                        <Phone className="h-3.5 w-3.5 text-[#0084ff]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">{num.display_name}</div>
                                        <div className="text-xs text-white/40 truncate">{num.phone_number ?? "—"}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                                            <span className={`h-2 w-2 rounded-full ${num.auto_reply ? "bg-[#00c853]" : "bg-white/20"}`} />
                                        </div>
                                        {num.ai_model && (
                                            <span className={`text-[10px] font-mono truncate max-w-[160px] ${isDeprecated ? "text-amber-400" : "text-gray-400"}`}>
                                                {num.ai_model}{isDeprecated ? " ⚠" : ""}
                                            </span>
                                        )}
                                    </div>
                                    {isActive && <CheckCircle2 className="h-4 w-4 text-[#0084ff] shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
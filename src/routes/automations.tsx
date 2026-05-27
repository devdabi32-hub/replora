import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { usePhone } from "@/contexts/PhoneContext";
import {
    Zap, ChevronDown, Eye, EyeOff, Save,
    CheckCircle2, Phone, Info,
} from "lucide-react";

export const Route = createFileRoute("/automations")({
    head: () => ({ meta: [{ title: "Automations — Replora" }] }),
    component: AutomationsPage,
});

// ── Provider config ────────────────────────────────────────────────────────
const PROVIDERS = [
    { value: "off", label: "Off — No AI" },
    { value: "gemini", label: "Google Gemini" },
    { value: "openai", label: "OpenAI / ChatGPT" },
    { value: "deepseek", label: "DeepSeek" },
    { value: "groq", label: "Groq" },
    { value: "claude", label: "Claude / Anthropic" },
    { value: "webhook", label: "Custom / n8n Webhook" },
];

const MODELS: Record<string, string[]> = {
    gemini: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
    groq: ["llama-3.1-70b-versatile", "llama-3.3-70b-specdec", "mixtral-8x7b-32768"],
    claude: ["claude-3-haiku-20240307", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229"],
};

const KEY_LINKS: Record<string, string> = {
    gemini: "https://aistudio.google.com/app/apikey",
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

type PhoneRow = {
    id: string;
    display_name: string;
    phone_number: string | null;
    ai_engine: string;
    auto_reply: boolean;
};

type Config = {
    ai_engine: string;
    ai_model: string;
    ai_api_key: string;
    system_prompt: string;
    auto_reply: boolean;
    webhook_url: string;
    welcome_message_enabled: boolean;
    welcome_message_text: string;
    out_of_office_enabled: boolean;
    out_of_office_start: string;
    out_of_office_end: string;
    out_of_office_text: string;
    followup_enabled: boolean;
};

const DEFAULT_CONFIG: Config = {
    ai_engine: "off",
    ai_model: "",
    ai_api_key: "",
    system_prompt: "You are a helpful WhatsApp assistant. Keep replies short, clear, and friendly. Maximum 2-3 sentences.",
    auto_reply: false,
    webhook_url: "",
    welcome_message_enabled: false,
    welcome_message_text: "Hello! Welcome. How can I help you today?",
    out_of_office_enabled: false,
    out_of_office_start: "22:00",
    out_of_office_end: "09:00",
    out_of_office_text: "We are currently out of office. We will reply during business hours.",
    followup_enabled: false,
};

// ── Component ──────────────────────────────────────────────────────────────
function AutomationsPage() {
    const { selectedPhone } = usePhone();

    const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
    const [saving, setSaving] = useState(false);
    const [keyVisible, setKeyVisible] = useState(false);
    const [keySaved, setKeySaved] = useState(false); // true after first save → mask
    const [allNumbers, setAllNumbers] = useState<PhoneRow[]>([]);
    const [activeDisplayName, setActiveDisplayName] = useState("—");

    const isWebhook = config.ai_engine === "webhook";
    const isOff = config.ai_engine === "off";
    const models = MODELS[config.ai_engine] ?? [];

    // ── Load config for active number ───────────────────────────────────────
    useEffect(() => {
        if (!selectedPhone) return;
        (async () => {
            const { data } = await supabase
                .from("connected_phone_numbers")
                .select([
                    "display_name",
                    "ai_engine", "ai_model", "ai_api_key", "system_prompt",
                    "auto_reply", "webhook_url",
                    "welcome_message_enabled", "welcome_message_text",
                    "out_of_office_enabled", "out_of_office_start",
                    "out_of_office_end", "out_of_office_text",
                    "followup_enabled",
                ].join(", "))
                .eq("id", selectedPhone)
                .maybeSingle();

            if (data) {
                setActiveDisplayName(data.display_name ?? "—");
                setConfig({
                    ai_engine: data.ai_engine ?? "off",
                    ai_model: data.ai_model ?? "",
                    ai_api_key: data.ai_api_key ?? "",
                    system_prompt: data.system_prompt ?? DEFAULT_CONFIG.system_prompt,
                    auto_reply: data.auto_reply ?? false,
                    webhook_url: data.webhook_url ?? "",
                    welcome_message_enabled: data.welcome_message_enabled ?? false,
                    welcome_message_text: data.welcome_message_text ?? DEFAULT_CONFIG.welcome_message_text,
                    out_of_office_enabled: data.out_of_office_enabled ?? false,
                    out_of_office_start: data.out_of_office_start ?? "22:00",
                    out_of_office_end: data.out_of_office_end ?? "09:00",
                    out_of_office_text: data.out_of_office_text ?? DEFAULT_CONFIG.out_of_office_text,
                    followup_enabled: data.followup_enabled ?? false,
                });
                setKeySaved(!!data.ai_api_key);
                setKeyVisible(false);
            }
        })();
    }, [selectedPhone]);

    // ── Load all numbers for status card ────────────────────────────────────
    useEffect(() => {
        (async () => {
            const { data: userRow } = await supabase.auth.getUser();
            if (!userRow.user) return;
            const { data: ur } = await supabase
                .from("users").select("agency_id").eq("id", userRow.user.id).maybeSingle();
            if (!ur?.agency_id) return;
            const { data: nums } = await supabase
                .from("connected_phone_numbers")
                .select("id, display_name, phone_number, ai_engine, auto_reply")
                .eq("agency_id", ur.agency_id)
                .order("connected_at", { ascending: false });
            if (nums) setAllNumbers(nums as PhoneRow[]);
        })();
    }, [saving]); // refresh after save

    // ── Save ────────────────────────────────────────────────────────────────
    const save = async () => {
        if (!selectedPhone) { toast.error("No number selected"); return; }
        setSaving(true);
        const payload: Record<string, unknown> = {
            ai_engine: config.ai_engine,
            ai_model: config.ai_model,
            system_prompt: config.system_prompt,
            auto_reply: config.auto_reply,
            webhook_url: config.webhook_url,
            welcome_message_enabled: config.welcome_message_enabled,
            welcome_message_text: config.welcome_message_text,
            out_of_office_enabled: config.out_of_office_enabled,
            out_of_office_start: config.out_of_office_start,
            out_of_office_end: config.out_of_office_end,
            out_of_office_text: config.out_of_office_text,
            followup_enabled: config.followup_enabled,
        };
        // Only update key if user typed a new one (not the masked placeholder)
        if (config.ai_api_key && !config.ai_api_key.includes("•")) {
            payload.ai_api_key = config.ai_api_key;
        }
        const { error } = await supabase
            .from("connected_phone_numbers")
            .update(payload)
            .eq("id", selectedPhone);
        setSaving(false);
        if (error) { toast.error("Save failed: " + error.message); return; }
        toast.success("Configuration saved ✓");
        setKeySaved(true);
        setKeyVisible(false);
    };

    const set = (k: keyof Config, v: unknown) =>
        setConfig(prev => ({ ...prev, [k]: v }));

    // ── Provider change → reset model ───────────────────────────────────────
    const changeProvider = (val: string) => {
        set("ai_engine", val);
        set("ai_model", MODELS[val]?.[0] ?? "");
        if (!keySaved) set("ai_api_key", "");
    };

    // ── Styles ──────────────────────────────────────────────────────────────
    const inp = "w-full h-11 px-3 rounded-lg bg-[#1a1f2e] border border-white/10 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 outline-none text-sm";
    const card = "bg-[#0f1117] rounded-2xl border border-white/[0.07] p-6 mb-5";

    if (!selectedPhone) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Zap className="h-12 w-12 text-white/20 mx-auto mb-3" />
                        <p className="text-white/50 text-sm">Select a WhatsApp number from the top bar to configure AI.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto px-6 lg:px-10 py-10">

                {/* Header */}
                <div className="mb-7">
                    <h1 className="text-3xl font-semibold text-white tracking-tight">Automations</h1>
                    <p className="text-sm text-white/60 mt-1.5">
                        Configure AI engine and auto-reply rules per WhatsApp number.
                    </p>
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0084ff]/8 border border-[#0084ff]/20 mb-6">
                    <Info className="h-4 w-4 text-[#0084ff] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#0084ff]/90 leading-relaxed">
                        Each WhatsApp number has its own AI engine config. Switch numbers from the top bar — config will update automatically.
                    </p>
                </div>

                {/* ── CARD 1 — AI Engine ── */}
                <div className={card}>
                    <div className="flex items-center gap-2 mb-5">
                        <Zap className="h-5 w-5 text-[#0084ff]" />
                        <h2 className="text-base font-semibold text-white">
                            AI Engine —{" "}
                            <span className="text-white/60 font-normal">{activeDisplayName}</span>
                        </h2>
                    </div>

                    {/* Provider + Model row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs font-medium text-white/70 mb-1.5 block">AI Provider</label>
                            <div className="relative">
                                <select
                                    value={config.ai_engine}
                                    onChange={e => changeProvider(e.target.value)}
                                    className={`${inp} appearance-none pr-8`}
                                >
                                    {PROVIDERS.map(p => (
                                        <option key={p.value} value={p.value} className="bg-[#0f1117]">
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-white/40 pointer-events-none" />
                            </div>
                        </div>

                        {!isWebhook && !isOff && (
                            <div>
                                <label className="text-xs font-medium text-white/70 mb-1.5 block">Model</label>
                                <div className="relative">
                                    <select
                                        value={config.ai_model}
                                        onChange={e => set("ai_model", e.target.value)}
                                        className={`${inp} appearance-none pr-8`}
                                    >
                                        {models.map(m => (
                                            <option key={m} value={m} className="bg-[#0f1117]">{m}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-white/40 pointer-events-none" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* API Key (hidden for webhook/off) */}
                    {!isWebhook && !isOff && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-white/70">
                  {PROVIDERS.find(p => p.value === config.ai_engine)?.label ?? "API"} Key
                </label>
                {KEY_LINKS[config.ai_engine] && (
                  
                    href={KEY_LINKS[config.ai_engine]}
                    target="_blank" rel="noreferrer"
                    className="text-[10px] text-[#0084ff] hover:underline"
                  >
                    Get key ↗
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={keyVisible ? "text" : "password"}
                  value={keySaved && !keyVisible ? "••••••••••••••••••••••••" : config.ai_api_key}
                  onChange={e => { set("ai_api_key", e.target.value); setKeySaved(false); }}
                  placeholder={`Paste your ${PROVIDERS.find(p=>p.value===config.ai_engine)?.label} key`}
                  className={`${inp} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setKeyVisible(v => !v)}
                  className="absolute right-3 top-3 text-white/40 hover:text-white/70"
                >
                  {keyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {keySaved && (
                        <p className="text-[10px] text-white/40 mt-1">
                            Key saved. Click the eye icon to view or type a new key to replace.
                        </p>
                    )}
                </div>
          )}

                {/* Webhook URL (only for webhook) */}
                {isWebhook && (
                    <div className="mb-4">
                        <label className="text-xs font-medium text-white/70 mb-1.5 block">
                            Webhook URL (n8n or external)
                        </label>
                        <input
                            value={config.webhook_url}
                            onChange={e => set("webhook_url", e.target.value)}
                            placeholder="https://your-n8n.com/webhook/xxx"
                            className={inp}
                        />
                        <p className="text-[10px] text-white/40 mt-1.5">
                            Incoming messages will be POSTed here. Your automation handles the reply.
                        </p>
                    </div>
                )}

                {/* System Prompt (hidden for webhook/off) */}
                {!isWebhook && !isOff && (
                    <div className="mb-5">
                        <label className="text-xs font-medium text-white/70 mb-1.5 block">System Prompt</label>
                        <textarea
                            value={config.system_prompt}
                            onChange={e => set("system_prompt", e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#1a1f2e] border border-white/10 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 outline-none text-sm resize-none"
                        />
                    </div>
                )}

                {/* Auto Reply toggle */}
                <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
                    <div>
                        <div className="text-sm font-medium text-white">Auto Reply</div>
                        <div className="text-xs text-white/50 mt-0.5">AI will automatically reply to incoming messages</div>
                    </div>
                    <button
                        onClick={() => set("auto_reply", !config.auto_reply)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${config.auto_reply ? "bg-[#0084ff]" : "bg-white/10"}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.auto_reply ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                </div>
            </div>

            {/* ── CARD 2 — Quick Automations ── */}
            <div className={card}>
                <h2 className="text-base font-semibold text-white mb-5">Quick Automations</h2>

                {/* Welcome Message */}
                <div className="mb-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <div className="text-sm font-medium text-white">Welcome Message</div>
                            <div className="text-xs text-white/50 mt-0.5">Send to new contacts on their first message</div>
                        </div>
                        <button
                            onClick={() => set("welcome_message_enabled", !config.welcome_message_enabled)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${config.welcome_message_enabled ? "bg-[#0084ff]" : "bg-white/10"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.welcome_message_enabled ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>
                    {config.welcome_message_enabled && (
                        <input
                            value={config.welcome_message_text}
                            onChange={e => set("welcome_message_text", e.target.value)}
                            className={`mt-2 ${inp}`}
                            placeholder="Welcome message text…"
                        />
                    )}
                </div>

                {/* Out of Office */}
                <div className="mb-4 border-t border-white/[0.05] pt-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <div className="text-sm font-medium text-white">Out of Office</div>
                            <div className="text-xs text-white/50 mt-0.5">Auto-reply during non-business hours</div>
                        </div>
                        <button
                            onClick={() => set("out_of_office_enabled", !config.out_of_office_enabled)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${config.out_of_office_enabled ? "bg-[#0084ff]" : "bg-white/10"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.out_of_office_enabled ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>
                    {config.out_of_office_enabled && (
                        <div className="mt-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-white/50 mb-1 block">From (OFF time)</label>
                                    <input type="time" value={config.out_of_office_start}
                                        onChange={e => set("out_of_office_start", e.target.value)}
                                        className={inp} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-white/50 mb-1 block">To (ON time)</label>
                                    <input type="time" value={config.out_of_office_end}
                                        onChange={e => set("out_of_office_end", e.target.value)}
                                        className={inp} />
                                </div>
                            </div>
                            <input value={config.out_of_office_text}
                                onChange={e => set("out_of_office_text", e.target.value)}
                                className={inp} placeholder="Out of office message…" />
                        </div>
                    )}
                </div>

                {/* Follow-up */}
                <div className="border-t border-white/[0.05] pt-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <div className="text-sm font-medium text-white">Follow-up Reminder</div>
                            <div className="text-xs text-white/50 mt-0.5">Nudge contacts who haven't replied in 24 hours</div>
                        </div>
                        <button
                            onClick={() => set("followup_enabled", !config.followup_enabled)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${config.followup_enabled ? "bg-[#0084ff]" : "bg-white/10"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.followup_enabled ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={save}
                disabled={saving}
                className="w-full h-12 rounded-xl bg-[#0084ff] hover:bg-[#0066cc] text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-5"
            >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Configuration"}
            </button>

            {/* ── CARD 3 — All Numbers Status ── */}
            <div className={card}>
                <h2 className="text-base font-semibold text-white mb-4">All Numbers — AI Status</h2>
                {allNumbers.length === 0 ? (
                    <p className="text-sm text-white/40 text-center py-4">No numbers connected yet.</p>
                ) : (
                    <div className="space-y-2">
                        {allNumbers.map(num => {
                            const badge = ENGINE_BADGE[num.ai_engine] ?? ENGINE_BADGE.off;
                            const isActive = num.id === selectedPhone;
                            return (
                                <div key={num.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isActive
                                            ? "bg-[#0084ff]/8 border-[#0084ff]/30"
                                            : "bg-white/[0.02] border-white/[0.05]"
                                        }`}
                                >
                                    <div className="h-8 w-8 rounded-full bg-[#0084ff]/10 flex items-center justify-center shrink-0">
                                        <Phone className="h-3.5 w-3.5 text-[#0084ff]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">{num.display_name}</div>
                                        <div className="text-xs text-white/40 truncate">{num.phone_number ?? "—"}</div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}>
                                            {badge.label}
                                        </span>
                                        <span className={`h-2 w-2 rounded-full ${num.auto_reply ? "bg-[#00c853]" : "bg-white/20"}`} title={num.auto_reply ? "Auto reply ON" : "Auto reply OFF"} />
                                    </div>
                                    {isActive && (
                                        <CheckCircle2 className="h-4 w-4 text-[#0084ff] shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    </AppLayout >
  );
}
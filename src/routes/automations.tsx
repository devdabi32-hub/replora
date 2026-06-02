import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { usePhoneContext } from "@/contexts/PhoneContext";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import {
  Bot, Zap, MessageSquare, Clock, Bell, Eye, EyeOff, Copy, Check,
  Plus, Trash2, Settings, Phone, RefreshCw, Info, ExternalLink,
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

type Provider = "groq" | "gemini" | "openai" | "deepseek" | "claude" | "webhook";

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "groq", label: "⚡ Groq" },
  { value: "gemini", label: "🔵 Google Gemini" },
  { value: "openai", label: "OpenAI / ChatGPT" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "claude", label: "Anthropic Claude" },
  { value: "webhook", label: "Custom / n8n Webhook" },
];

const MODELS: Record<Provider, string[]> = {
  groq: ["llama-3.1-8b-instant ⚡ Free", "llama3-8b-8192", "llama-3.3-70b-versatile", "meta-llama/llama-4-scout-17b-16e-instruct", "gemma2-9b-it"],
  gemini: ["gemini-2.0-flash ⚡ Free", "gemini-1.5-flash", "gemini-1.5-flash-8b"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  claude: ["claude-3-haiku-20240307", "claude-3-5-haiku-20241022", "claude-sonnet-4-20250514"],
  webhook: [],
};

const KEY_URLS: Record<Provider, string> = {
  groq: "https://console.groq.com/keys",
  gemini: "https://aistudio.google.com/app/apikey",
  openai: "https://platform.openai.com/api-keys",
  deepseek: "https://platform.deepseek.com/api_keys",
  claude: "https://console.anthropic.com/settings/keys",
  webhook: "#",
};

const DEFAULT_PROMPT =
  "You are a helpful WhatsApp assistant. Keep replies short, clear, and friendly. Maximum 2-3 sentences. Always reply in the same language the customer uses. Remember context from earlier in this conversation.";

const TABS = [
  { id: "ai", label: "AI Engine", icon: Bot },
  { id: "quick", label: "Quick Automations", icon: Zap },
  { id: "replies", label: "Quick Replies", icon: MessageSquare },
  { id: "advanced", label: "Advanced", icon: Settings },
] as const;
type TabId = typeof TABS[number]["id"];

/* ───────── Page ───────── */
function AutomationsPage() {
  const [tab, setTab] = useState<TabId>("ai");

  return (
    <div className="min-h-screen bg-[#07080f] text-white" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Automations</h1>
          <p className="text-sm text-white/50 mt-1.5">Configure AI engine and auto-reply rules per WhatsApp number</p>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-[#0084ff]/10 border border-[#0084ff]/25 px-4 py-3">
          <Info className="h-4 w-4 text-[#0084ff] mt-0.5 shrink-0" />
          <p className="text-sm text-white/80">Each number has its own AI profile — number switch karo, config automatically switch hoga.</p>
        </div>

        <div
          className="inline-flex p-1 rounded-[10px]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm transition ${
                  active ? "text-white font-medium" : "text-white/40 hover:text-white/70"
                }`}
                style={active ? { background: "rgba(255,255,255,0.1)" } : {}}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "ai" && <AIEngineTab />}
        {tab === "quick" && <QuickAutomationsTab />}
        {tab === "replies" && <QuickRepliesTab />}
        {tab === "advanced" && <AdvancedTab />}
      </div>
    </div>
  );
}

/* ───────── Card primitives ───────── */
function Card({ children, accent, className = "" }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: accent ? `2px solid ${accent}` : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-[#0d0f17] border border-white/10 text-white placeholder:text-white/30 text-sm focus:border-[#0084ff] focus:outline-none transition";

const labelCls = "block text-[11px] uppercase tracking-wider text-white/50 mb-1.5 font-medium";

/* ───────── TAB 1: AI Engine ───────── */
function AIEngineTab() {
  const { selectedId, selectedConnection } = usePhoneContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [provider, setProvider] = useState<Provider>("groq");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [autoReply, setAutoReply] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    supabase
      .from("connected_phone_numbers")
      .select("ai_engine, ai_model, ai_api_key, system_prompt, auto_reply, webhook_url")
      .eq("id", selectedId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const p = (data.ai_engine as Provider) || "groq";
          setProvider(p);
          const m = data.ai_model || "";
          if (MODELS[p]?.some((x) => x.startsWith(m))) {
            setModel(MODELS[p].find((x) => x.startsWith(m)) || "");
            setCustomModel("");
          } else {
            setModel(MODELS[p]?.[0] || "");
            setCustomModel(m);
          }
          setApiKey(data.ai_api_key || "");
          setSystemPrompt(data.system_prompt || DEFAULT_PROMPT);
          setAutoReply(!!data.auto_reply);
          setWebhookUrl(data.webhook_url || "");
        }
        setLoading(false);
      });
  }, [selectedId]);

  useEffect(() => {
    if (provider !== "webhook" && !model) setModel(MODELS[provider]?.[0] || "");
  }, [provider, model]);

  const handleSave = async () => {
    if (!selectedId) return toast.error("Select a number first");
    setSaving(true);
    const finalModel = customModel.trim() || model.split(" ")[0];
    const { error } = await supabase
      .from("connected_phone_numbers")
      .update({
        ai_engine: provider,
        ai_model: provider === "webhook" ? null : finalModel,
        ai_api_key: provider === "webhook" ? null : apiKey,
        system_prompt: provider === "webhook" ? null : systemPrompt,
        auto_reply: autoReply,
        webhook_url: provider === "webhook" ? webhookUrl : null,
      })
      .eq("id", selectedId);
    setSaving(false);
    if (error) toast.error("Save failed: " + error.message);
    else toast.success("Configuration saved ✓");
  };

  if (!selectedId) {
    return (
      <Card accent="#0084ff" className="p-8 text-center">
        <Phone className="h-8 w-8 text-white/30 mx-auto mb-3" />
        <p className="text-white/70 text-sm">Select a WhatsApp number from the topbar to configure AI.</p>
      </Card>
    );
  }

  return (
    <Card accent="#0084ff">
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#0084ff]/15 flex items-center justify-center">
            <Bot className="h-5 w-5 text-[#0084ff]" />
          </div>
          <div>
            <h3 className="text-base font-semibold">AI Engine</h3>
            <p className="text-xs text-white/50 mt-0.5">LLM provider & model {selectedConnection ? `• ${selectedConnection.label}` : ""}</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#0084ff]/15 text-[#0084ff] uppercase tracking-wider">Beta</span>
      </div>

      <div className="p-5 space-y-5">
        {loading && <div className="text-xs text-white/40">Loading…</div>}

        <div className={`grid gap-4 ${provider === "webhook" ? "grid-cols-1" : "grid-cols-2"}`}>
          <div>
            <label className={labelCls}>AI Provider</label>
            <select value={provider} onChange={(e) => { setProvider(e.target.value as Provider); setModel(""); setCustomModel(""); }} className={inputCls}>
              {PROVIDERS.map((p) => <option key={p.value} value={p.value} className="bg-[#0d0f17]">{p.label}</option>)}
            </select>
          </div>
          {provider !== "webhook" && (
            <div>
              <label className={labelCls}>Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className={inputCls}>
                {MODELS[provider].map((m) => <option key={m} value={m} className="bg-[#0d0f17]">{m}</option>)}
              </select>
            </div>
          )}
        </div>

        {provider !== "webhook" && (
          <div>
            <label className={labelCls}>Custom Model Override</label>
            <input value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="e.g. llama-3.1-8b-instant" className={inputCls} />
            <p className="text-[11px] text-white/40 mt-1">Leave empty to use dropdown selection. If filled, this overrides the dropdown.</p>
          </div>
        )}

        {provider === "webhook" ? (
          <div>
            <label className={labelCls}>Webhook URL</label>
            <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-n8n.com/webhook/..." className={inputCls} />
            <p className="text-[11px] text-white/50 mt-1.5">n8n or any HTTP endpoint. Replora will POST the inbound message JSON to this URL.</p>
          </div>
        ) : (
          <>
            <div>
              <label className={labelCls}>API Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your provider API key…"
                  className={inputCls + " pr-20 font-mono"}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button onClick={() => setShowKey(!showKey)} className="h-7 w-7 flex items-center justify-center text-white/50 hover:text-white">
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("Copied"); }} className="h-7 w-7 flex items-center justify-center text-white/50 hover:text-white">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-white/40">🔒 Stored securely. Never exposed to clients.</span>
                <a href={KEY_URLS[provider]} target="_blank" rel="noreferrer" className="text-[11px] text-[#0084ff] hover:underline inline-flex items-center gap-1">
                  Get free API key <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div>
              <label className={labelCls}>System Prompt</label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value.slice(0, 1000))}
                className={inputCls + " h-auto py-2.5 resize-none"}
              />
              <div className="text-[11px] text-white/40 mt-1 text-right">{systemPrompt.length} / 1000</div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div>
            <div className="text-sm font-medium">Auto Reply</div>
            <div className="text-xs text-white/50 mt-0.5">Automatically replies to incoming messages</div>
          </div>
          <Toggle on={autoReply} onChange={setAutoReply} />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 h-10 rounded-lg bg-[#0084ff] hover:bg-[#0073e0] text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Configuration"}
          </button>
          <button
            onClick={() => toast.info("Test reply — coming soon")}
            className="px-4 h-10 rounded-lg border border-white/10 hover:bg-white/[0.04] text-white/70 text-sm transition"
          >
            Test Reply
          </button>
        </div>
      </div>
    </Card>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative h-6 w-11 rounded-full transition"
      style={{ background: on ? "#0084ff" : "rgba(255,255,255,0.1)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
        style={{ transform: on ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

/* ───────── TAB 2: Quick Automations ───────── */
function QuickAutomationsTab() {
  const { selectedId } = usePhoneContext();
  const [loading, setLoading] = useState(true);
  const [welcomeOn, setWelcomeOn] = useState(false);
  const [welcomeText, setWelcomeText] = useState("Hello! Welcome. How can I help you today? 😊");
  const [oooOn, setOooOn] = useState(false);
  const [oooStart, setOooStart] = useState("18:00");
  const [oooEnd, setOooEnd] = useState("09:00");
  const [oooText, setOooText] = useState("Hi! We're currently offline. We'll reply during business hours.");
  const [followupOn, setFollowupOn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("connected_phone_numbers")
      .select("welcome_message_enabled, welcome_message_text, out_of_office_enabled, out_of_office_start, out_of_office_end, out_of_office_text, followup_enabled")
      .eq("id", selectedId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setWelcomeOn(!!data.welcome_message_enabled);
          if (data.welcome_message_text) setWelcomeText(data.welcome_message_text);
          setOooOn(!!data.out_of_office_enabled);
          if (data.out_of_office_start) setOooStart(data.out_of_office_start);
          if (data.out_of_office_end) setOooEnd(data.out_of_office_end);
          if (data.out_of_office_text) setOooText(data.out_of_office_text);
          setFollowupOn(!!data.followup_enabled);
        }
        setLoading(false);
      });
  }, [selectedId]);

  const save = async () => {
    if (!selectedId) return toast.error("Select a number first");
    setSaving(true);
    const { error } = await supabase
      .from("connected_phone_numbers")
      .update({
        welcome_message_enabled: welcomeOn,
        welcome_message_text: welcomeText,
        out_of_office_enabled: oooOn,
        out_of_office_start: oooStart,
        out_of_office_end: oooEnd,
        out_of_office_text: oooText,
        followup_enabled: followupOn,
      })
      .eq("id", selectedId);
    setSaving(false);
    if (error) toast.error("Save failed: " + error.message);
    else toast.success("Saved ✓");
  };

  if (!selectedId) {
    return (
      <Card className="p-8 text-center">
        <p className="text-white/70 text-sm">Select a WhatsApp number from the topbar.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3 p-5 border-b border-white/[0.06]">
        <div className="h-9 w-9 rounded-lg bg-[#00c853]/15 flex items-center justify-center">
          <Zap className="h-5 w-5 text-[#00c853]" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Quick Automations</h3>
          <p className="text-xs text-white/50 mt-0.5">One-click rules for common scenarios</p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {loading && <div className="text-xs text-white/40">Loading…</div>}

        <AutomationRow
          icon={MessageSquare}
          iconBg="#0084ff"
          title="Welcome Message"
          desc="Send to new contacts on their first message"
          on={welcomeOn}
          onToggle={setWelcomeOn}
        >
          <input value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} className={inputCls + " mt-3"} />
        </AutomationRow>

        <AutomationRow
          icon={Clock}
          iconBg="#f59e0b"
          title="Out of Office"
          desc="Auto-reply during non-business hours"
          on={oooOn}
          onToggle={setOooOn}
        >
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className={labelCls}>From</label>
              <input type="time" value={oooStart} onChange={(e) => setOooStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>To</label>
              <input type="time" value={oooEnd} onChange={(e) => setOooEnd(e.target.value)} className={inputCls} />
            </div>
          </div>
          <input value={oooText} onChange={(e) => setOooText(e.target.value)} className={inputCls + " mt-3"} />
        </AutomationRow>

        <AutomationRow
          icon={Bell}
          iconBg="#a855f7"
          title="Follow-up Reminder"
          desc="Message contacts who haven't replied in 24 hours"
          on={followupOn}
          onToggle={setFollowupOn}
        />

        <button
          onClick={save}
          disabled={saving}
          className="mt-2 px-4 h-10 rounded-lg bg-[#0084ff] hover:bg-[#0073e0] text-white text-sm font-semibold transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Automations"}
        </button>
      </div>
    </Card>
  );
}

function AutomationRow({
  icon: Icon, iconBg, title, desc, on, onToggle, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string; title: string; desc: string;
  on: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] hover:border-white/[0.12] p-4 transition">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${iconBg}22`, color: iconBg }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-white/50 mt-0.5">{desc}</div>
        </div>
        <Toggle on={on} onChange={onToggle} />
      </div>
      {on && children && <div className="mt-2 pl-13">{children}</div>}
    </div>
  );
}

/* ───────── TAB 3: Quick Replies ───────── */
function QuickRepliesTab() {
  const { agencyId } = useAccountStatus();
  const [items, setItems] = useState<{ id: string; shortcut: string; message: string }[]>([]);
  const [shortcut, setShortcut] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("quick_replies")
      .select("id, shortcut, message")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!shortcut.trim() || !message.trim() || !agencyId) return;
    const sc = shortcut.startsWith("/") ? shortcut : "/" + shortcut;
    const { error } = await supabase.from("quick_replies").insert({ shortcut: sc, message, agency_id: agencyId });
    if (error) return toast.error(error.message);
    setShortcut(""); setMessage(""); toast.success("Added");
    load();
  };

  const del = async (id: string) => {
    await supabase.from("quick_replies").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  return (
    <Card>
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#00c853]/15 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-[#00c853]" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Quick Replies</h3>
            <p className="text-xs text-white/50 mt-0.5">
              Type <code className="px-1.5 py-0.5 rounded bg-white/10 text-[#0084ff] text-[11px]">/shortcut</code> in inbox to insert
            </p>
          </div>
        </div>
        <span className="text-xs text-white/50">{items.length} saved</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-[130px_1fr_36px] gap-2">
          <input value={shortcut} onChange={(e) => setShortcut(e.target.value)} placeholder="/pricing" className={inputCls + " font-mono"} />
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Full message that gets inserted..." className={inputCls} />
          <button onClick={add} className="h-10 w-9 rounded-lg bg-[#0084ff] hover:bg-[#0073e0] flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-white/40">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <MessageSquare className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/50">No quick replies yet. Add your first above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((q) => (
              <div key={q.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.07] hover:border-white/[0.12] transition">
                <span className="text-xs font-mono px-2 py-1 rounded-md bg-[#0084ff]/15 text-[#0084ff] shrink-0">{q.shortcut}</span>
                <span className="flex-1 text-sm text-white/80 truncate">{q.message}</span>
                <button onClick={() => del(q.id)} className="h-8 w-8 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ───────── TAB 4: Advanced ───────── */
function AdvancedTab() {
  const { agencyId } = useAccountStatus();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("connected_phone_numbers")
      .select("id, display_name, phone_number_id, is_active, ai_engine, ai_model")
      .eq("agency_id", agencyId)
      .order("connected_at", { ascending: true });
    setNumbers(data || []);
    setLoading(false);
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);

  const features = [
    { icon: "⚡", title: "Keyword Triggers", desc: "Reply automatically when message contains a keyword" },
    { icon: "🔥", title: "Lead Qualifier", desc: "Auto-tag conversations as hot/warm/cold based on AI analysis" },
    { icon: "📊", title: "Pipeline Push", desc: "Automatically move contacts to sales pipeline stages" },
    { icon: "📢", title: "Broadcast Scheduler", desc: "Schedule bulk messages at a specific time" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#a855f7]/15 flex items-center justify-center">
              <Settings className="h-5 w-5 text-[#a855f7]" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Advanced Automations</h3>
              <p className="text-xs text-white/50 mt-0.5">Keyword triggers, conditions & more</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#a855f7]/15 text-[#a855f7] uppercase tracking-wider">Coming Soon</span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ opacity: 0.5 }}>
            {features.map((f) => (
              <div key={f.title} className="p-4 rounded-xl border border-white/[0.07] cursor-not-allowed">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-sm font-medium">{f.title}</div>
                <div className="text-xs text-white/50 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/40 mt-5">
            These features are in active development — available in the next update
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-semibold">All Numbers — AI Status</h3>
            <p className="text-xs text-white/50 mt-0.5">{numbers.length} number{numbers.length === 1 ? "" : "s"}</p>
          </div>
          <button onClick={load} className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/[0.04] text-white/60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="p-3">
          {numbers.length === 0 && !loading ? (
            <div className="text-center py-8 text-sm text-white/50">No connected numbers yet.</div>
          ) : (
            <div className="space-y-1">
              {numbers.map((n) => {
                const initials = (n.display_name || "?").slice(0, 2).toUpperCase();
                return (
                  <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03]">
                    <div className="h-9 w-9 rounded-full bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center text-xs font-semibold">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{n.display_name}</div>
                      <div className="text-[11px] text-white/40 font-mono truncate">{n.phone_number_id}</div>
                    </div>
                    <div className="text-[11px] text-white/50">{n.ai_engine || "—"} / {n.ai_model || "—"}</div>
                    <span className={`h-2 w-2 rounded-full ${n.is_active ? "bg-[#00c853]" : "bg-red-500"}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

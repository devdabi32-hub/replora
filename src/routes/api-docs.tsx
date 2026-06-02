import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Copy, Check, AlertTriangle, Info, ExternalLink, Lock, Key, Zap, Bot,
  MessageSquare, Phone, Activity, Users, GitBranch,
} from "lucide-react";

export const Route = createFileRoute("/api-docs")({
  head: () => ({ meta: [{ title: "API Documentation — Replora" }] }),
  component: () => (
    <AppLayout>
      <ApiDocsPage />
    </AppLayout>
  ),
});

const WEBHOOK_URL = "https://xloppafivbvsljfxtjwh.supabase.co/functions/v1/webhook-receiver";
const SEND_URL = "https://xloppafivbvsljfxtjwh.supabase.co/functions/v1/send-message";

const SECTIONS = [
  { id: "start", label: "Getting Started", icon: Zap },
  { id: "auth", label: "Authentication", icon: Lock },
  { id: "webhook", label: "Webhook Setup (Meta)", icon: Key },
  { id: "inbound", label: "Inbound Messages", icon: MessageSquare },
  { id: "outbound", label: "Outbound Messages", icon: MessageSquare },
  { id: "takeover", label: "Human Takeover", icon: Users },
  { id: "broadcasts", label: "Broadcasts", icon: Activity },
  { id: "templates", label: "Templates", icon: MessageSquare },
  { id: "contacts", label: "Contacts API", icon: Users },
  { id: "pipeline", label: "Pipeline / Deals", icon: GitBranch },
  { id: "ai", label: "AI Engine Config", icon: Bot },
  { id: "quick", label: "Quick Replies", icon: MessageSquare },
  { id: "activity", label: "Activity Log", icon: Activity },
  { id: "errors", label: "Error Codes", icon: AlertTriangle },
];

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className="absolute top-2.5 right-2.5 h-7 px-2 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] text-white/70 flex items-center gap-1 transition"
    >
      {done ? <Check className="h-3 w-3 text-[#00c853]" /> : <Copy className="h-3 w-3" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Code({ children }: { children: string }) {
  return (
    <div className="relative my-3 group">
      <pre className="bg-[#0d1117] border border-white/10 rounded-lg p-4 pr-20 overflow-x-auto text-[12.5px] leading-relaxed font-mono text-white/85 whitespace-pre">{children}</pre>
      <CopyBtn text={children} />
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-2xl font-semibold text-white mb-1.5 tracking-tight">{title}</h2>
      <div className="text-[15px] text-white/70 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Note({ kind, children }: { kind: "info" | "warn" | "danger"; children: React.ReactNode }) {
  const cfg = {
    info: { bg: "rgba(0,132,255,0.08)", border: "rgba(0,132,255,0.25)", color: "#0084ff", Icon: Info },
    warn: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", color: "#f59e0b", Icon: AlertTriangle },
    danger: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", color: "#ef4444", Icon: AlertTriangle },
  }[kind];
  const Icon = cfg.Icon;
  return (
    <div className="flex gap-3 rounded-xl px-4 py-3 my-3 text-sm" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: cfg.color }} />
      <div className="text-white/85">{children}</div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-white/[0.08]">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.03]">
          <tr>{headers.map((h) => <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/60">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-white/[0.06]">
              {row.map((c, j) => <td key={j} className="px-4 py-2.5 text-white/80 align-top">{typeof c === "string" && c.match(/^[a-z_]+$/) ? <code className="font-mono text-[12.5px] text-[#0084ff]">{c}</code> : c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepNum({ n }: { n: number }) {
  return (
    <div className="h-7 w-7 rounded-full bg-[#0084ff] text-white text-sm font-semibold flex items-center justify-center shrink-0">{n}</div>
  );
}

function ApiDocsPage() {
  const [active, setActive] = useState("start");
  const [copied, setCopied] = useState(false);

  const copyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Sticky webhook banner */}
      <div className="sticky top-0 z-30 bg-[#0084ff]/15 backdrop-blur border-b border-[#0084ff]/25 px-6 py-2.5 flex items-center justify-center gap-2 text-sm">
        <Info className="h-4 w-4 text-[#0084ff]" />
        <span className="text-white/80">Webhook URL:</span>
        <code className="font-mono text-[12.5px] text-white">{WEBHOOK_URL}</code>
        <button onClick={copyWebhook} className="ml-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] flex items-center gap-1">
          {copied ? <Check className="h-3 w-3 text-[#00c853]" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="hidden lg:block w-[220px] shrink-0 sticky top-12 self-start h-[calc(100vh-3rem)] overflow-y-auto px-4 py-8 border-r border-white/[0.06]">
          <div className="text-[11px] font-semibold tracking-widest text-white/40 uppercase mb-3 px-2">On this page</div>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActive(s.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition ${
                    active === s.id ? "bg-white/[0.06] text-white" : "text-white/55 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-6 lg:px-10 py-10 max-w-3xl">
          <Section id="start" title="Replora API — Developer Docs">
            <p>Connect your WhatsApp AI agent to Replora in under 60 seconds.</p>
            <Note kind="info">Replora uses a single webhook endpoint + secret key. No OAuth, no JWT, no complex auth flows.</Note>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="text-xs font-semibold tracking-widest text-[#0084ff] uppercase mb-2">Quick Start</div>
                <h3 className="text-base font-semibold text-white mb-3">I use n8n</h3>
                <ol className="space-y-2 text-sm text-white/70 list-decimal pl-4">
                  <li>Copy your <code className="font-mono text-[#0084ff]">wam_sk_</code> key from Settings → API Keys</li>
                  <li>Add HTTP Request node</li>
                  <li>Set <code className="font-mono">x-wa-secret</code> header</li>
                  <li>Send message JSON</li>
                </ol>
                <a href="#inbound" className="mt-4 inline-flex items-center gap-1 text-sm text-[#0084ff] hover:underline">View n8n guide ↓</a>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="text-xs font-semibold tracking-widest text-[#00c853] uppercase mb-2">Quick Start</div>
                <h3 className="text-base font-semibold text-white mb-3">I use custom code</h3>
                <ol className="space-y-2 text-sm text-white/70 list-decimal pl-4">
                  <li>Copy <code className="font-mono text-[#0084ff]">wam_sk_</code> key</li>
                  <li>POST to webhook URL</li>
                  <li>Set <code className="font-mono">x-wa-secret</code> header</li>
                </ol>
                <a href="#auth" className="mt-4 inline-flex items-center gap-1 text-sm text-[#0084ff] hover:underline">View curl example ↓</a>
              </div>
            </div>
          </Section>

          <Section id="auth" title="Authentication">
            <p>All API requests require the <code className="font-mono text-[#0084ff]">x-wa-secret</code> header. Never use JWT tokens or the Supabase anon key — those are internal only.</p>
            <Note kind="warn">⚠️ Never expose your <code>wam_sk_</code> key in frontend code or public repos. Treat it like a password.</Note>
            <Table
              headers={["Header", "Value", "Notes"]}
              rows={[
                [<code key="1" className="font-mono text-[#0084ff]">x-wa-secret</code>, <code key="2" className="font-mono text-[12.5px]">wam_sk_your_key_here</code>, "Required on every request"],
                [<code key="3" className="font-mono text-[#0084ff]">Content-Type</code>, <code key="4" className="font-mono text-[12.5px]">application/json</code>, "Required"],
              ]}
            />
            <Code>{`curl -X POST ${WEBHOOK_URL} \\
  -H "Content-Type: application/json" \\
  -H "x-wa-secret: wam_sk_your_key_here" \\
  -d '{"phone_number":"919876543210","message_text":"Hello","direction":"inbound","sender_type":"client","timestamp":"2025-01-01T10:00:00Z","phone_number_id":"YOUR_META_PHONE_NUMBER_ID"}'`}</Code>
          </Section>

          <Section id="webhook" title="Webhook Setup (Meta)">
            <p>Connecting Meta WhatsApp Business API.</p>
            <Note kind="info">Replora works with the official Meta Cloud API. No third-party gateway.</Note>

            <div className="space-y-6 mt-6">
              <div className="flex gap-4"><StepNum n={1} />
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white mb-1">Get Your Meta Credentials</h4>
                  <p className="text-sm text-white/70">Go to developers.facebook.com → Your App → WhatsApp → API Setup</p>
                  <Table
                    headers={["Field", "Where to Find It", "Example Value"]}
                    rows={[
                      ["Phone Number ID", "WhatsApp → API Setup → Phone Number ID", <code key="a" className="font-mono text-[12.5px]">1073227029211574</code>],
                      ["WABA ID", "WhatsApp → API Setup → WhatsApp Business Account ID", <code key="b" className="font-mono text-[12.5px]">123456789012345</code>],
                      ["Permanent Access Token", "Business Manager → System Users → Generate Token", <code key="c" className="font-mono text-[12.5px]">EAAxxxxxxxx...</code>],
                      ["Verify Token", "Use the fixed Replora value", <code key="d" className="font-mono text-[12.5px]">replora_meta_verify</code>],
                    ]}
                  />
                  <Note kind="danger">⚠️ Do NOT use temporary tokens — they expire in 24 hours. Always generate a permanent System User token from Meta Business Manager.</Note>
                </div>
              </div>

              <div className="flex gap-4"><StepNum n={2} />
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white mb-1">Configure Webhook in Meta</h4>
                  <p className="text-sm text-white/70">In developers.facebook.com → WhatsApp → Configuration → Webhook:</p>
                  <Code>{`Callback URL: ${WEBHOOK_URL}\nVerify Token: replora_meta_verify`}</Code>
                </div>
              </div>

              <div className="flex gap-4"><StepNum n={3} />
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white mb-1">Subscribe to Events</h4>
                  <p className="text-sm text-white/70">Under Webhook Fields, subscribe to: <code className="font-mono text-[#00c853]">messages</code> ✓</p>
                  <Note kind="info">After subscribing, Meta will send a GET request to verify your webhook. Replora automatically handles this verification.</Note>
                </div>
              </div>

              <div className="flex gap-4"><StepNum n={4} />
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white mb-1">Add Number to Replora</h4>
                  <p className="text-sm text-white/70">Go to Connections page → Add WhatsApp Number → Enter your Phone Number ID + Access Token + WABA ID</p>
                  <Note kind="warn">WABA ID is different from Phone Number ID. Both are required — WABA ID is needed for Template API calls.</Note>
                </div>
              </div>

              <div className="flex gap-4"><StepNum n={5} />
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white mb-1">Enable AI</h4>
                  <p className="text-sm text-white/70">Go to Automations → AI Engine → Select provider → Paste API key → Enable Auto Reply → Save</p>
                </div>
              </div>
            </div>
          </Section>

          <Section id="inbound" title="Inbound Messages (PATH A — Meta Native)">
            <p>Replora receives messages directly from Meta. You do NOT need to forward them manually if using Meta webhooks.</p>
            <p className="mt-3 font-semibold text-white">PATH B — Custom n8n flow:</p>
            <p>POST to webhook URL with body:</p>
            <Table
              headers={["Field", "Type", "Required", "Description"]}
              rows={[
                ["phone_number", "string", "✓", "Customer's WhatsApp number with country code (e.g. 919876543210)"],
                ["message_text", "string", "✓", "The text content of the message"],
                ["direction", "string", "✓", `Must be "inbound"`],
                ["sender_type", "string", "✓", `Must be "client"`],
                ["timestamp", "ISO string", "✓", "Message timestamp in ISO 8601 format"],
                ["phone_number_id", "string", "✓", "Your Meta Phone Number ID — used to identify which connection"],
              ]}
            />
            <Code>{`{
  "phone_number": "={{ $json.messages[0].from }}",
  "message_text": "={{ $json.messages[0].text.body }}",
  "direction": "inbound",
  "sender_type": "client",
  "timestamp": "={{ new Date().toISOString() }}",
  "phone_number_id": "={{ $json.metadata.phone_number_id }}"
}`}</Code>
          </Section>

          <Section id="outbound" title="Outbound Messages (PATH B — n8n)">
            <p>After your AI agent generates a reply, send the outbound message to Replora to save it in the inbox.</p>
            <Table
              headers={["Field", "Value"]}
              rows={[
                ["direction", `"outbound"`],
                ["sender_type", `"ai_agent"`],
                ["phone_number", "Customer's WhatsApp number"],
                ["message_text", "AI's generated reply"],
                ["phone_number_id", "Your Meta Phone Number ID"],
              ]}
            />
            <Code>{`{
  "phone_number": "={{ $('WhatsApp Trigger').item.json.messages[0].from }}",
  "message_text": "={{ $('AI Agent').item.json.output }}",
  "direction": "outbound",
  "sender_type": "ai_agent",
  "timestamp": "={{ new Date().toISOString() }}",
  "phone_number_id": "={{ $('WhatsApp Trigger').item.json.metadata.phone_number_id }}"
}`}</Code>
            <Note kind="info">If you use Replora's built-in AI Engine (Automations → AI Engine), outbound messages are saved automatically. You only need this for custom n8n flows.</Note>
          </Section>

          <Section id="takeover" title="Human Takeover">
            <p>Replora supports human agents taking over AI conversations directly from the inbox.</p>
            <ol className="list-decimal pl-5 space-y-1.5 text-white/80 text-sm">
              <li>Agent clicks <strong>"Take Over"</strong> button in inbox → sets <code className="font-mono text-[#0084ff]">conversations.human_takeover = true</code></li>
              <li>AI stops replying to this conversation automatically</li>
              <li>Agent types reply in message composer → Replora sends it via Meta Graph API</li>
              <li>Agent clicks <strong>"Handback to AI"</strong> to resume AI replies</li>
            </ol>
            <Table
              headers={["Requirement", "Notes"]}
              rows={[
                ["access_token", "Must be set on connected_phone_numbers — permanent token from Meta Business Manager"],
                ["phone_number_id", "Must match your Meta Phone Number ID"],
                ["Endpoint", <code key="x" className="font-mono text-[12px]">{SEND_URL}</code>],
              ]}
            />
          </Section>

          <Section id="broadcasts" title="Broadcasts">
            <p>Send bulk WhatsApp messages using Meta-approved templates.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Template must be APPROVED by Meta before use</li>
              <li>Templates are created in Templates page → synced from Meta</li>
              <li>Broadcasts use the <code className="font-mono text-[#0084ff]">send-broadcast</code> edge function</li>
            </ul>
            <Note kind="warn">⚠️ Only APPROVED templates can be sent. PENDING or REJECTED templates will fail. Template approval takes 24-48 hours from Meta.</Note>
            <Table
              headers={["Field", "Description"]}
              rows={[
                ["template_name", "Name of approved template"],
                ["template_language", "Default: en_US"],
                ["connection_id", "ID of connected_phone_numbers row"],
                ["contacts", "Array of phone numbers to send to"],
              ]}
            />
            <p className="text-sm text-white/70">Status flow: <code className="font-mono">draft</code> → <code className="font-mono">sending</code> → <code className="font-mono">sent</code> / <code className="font-mono">failed</code> / <code className="font-mono">paused</code></p>
            <p className="text-sm text-white/70 mt-2">Meta sends delivery status updates automatically. Replora updates <code className="font-mono text-[#0084ff]">broadcast_recipients</code> with <code>delivered_at</code> and <code>read_at</code> timestamps.</p>
          </Section>

          <Section id="templates" title="Templates">
            <p>Create and manage Meta WhatsApp Business message templates.</p>
            <Table
              headers={["Concept", "Values"]}
              rows={[
                ["Categories", "MARKETING, UTILITY, AUTHENTICATION"],
                ["Header types", "TEXT, IMAGE, VIDEO, DOCUMENT, NONE"],
                ["Status flow", "PENDING → APPROVED / REJECTED / IN_APPEAL"],
              ]}
            />
            <Note kind="danger">⚠️ Templates cannot contain promotional content claiming to be from Meta or WhatsApp. Violating templates will be permanently rejected.</Note>
            <Note kind="warn">WABA ID required: Template creation requires your WABA ID (WhatsApp Business Account ID). Set it in Connections → Edit → WABA ID field.</Note>
          </Section>

          <Section id="contacts" title="Contacts API">
            <p>Contacts are automatically created when a new phone number sends your first message.</p>
            <Table
              headers={["Field", "Type", "Notes"]}
              rows={[
                ["phone_number", "auto", "From inbound message"],
                ["agency_id", "auto", "Scoped per agency"],
                ["created_at", "auto", "Timestamp"],
                ["total_messages", "auto", "Incremented on each message"],
                ["last_seen", "auto", "Updated on inbound"],
                ["name", "manual", "Editable from Contacts page"],
              ]}
            />
            <p className="text-sm text-white/70">CSV Import: Use Contacts → Import CSV to bulk import contacts. Required columns: <code className="font-mono text-[#0084ff]">phone_number</code>. Optional: <code className="font-mono text-[#0084ff]">name</code>.</p>
          </Section>

          <Section id="pipeline" title="Pipeline / Deals">
            <p>Track sales opportunities from WhatsApp conversations.</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Default stages: <code className="font-mono">New Lead</code> → <code className="font-mono">Qualified</code> → <code className="font-mono">Proposal</code> → <code className="font-mono">Won / Lost</code></li>
              <li>Deals table: <code className="font-mono">title, value, stage, contact_id, notes</code></li>
              <li>Pipeline stages fully customizable per agency (<code className="font-mono text-[#0084ff]">pipeline_stages</code> table)</li>
              <li>"Add to Pipeline" button appears on Contact profile page</li>
            </ul>
          </Section>

          <Section id="ai" title="AI Engine Config">
            <p>Configure a separate AI engine for each connected WhatsApp number. Stored in <code className="font-mono text-[#0084ff]">connected_phone_numbers</code> table per row.</p>
            <Table
              headers={["Field", "Type", "Description"]}
              rows={[
                ["ai_engine", "enum", "gemini / openai / deepseek / groq / claude / webhook / off"],
                ["ai_model", "text", "Model name e.g. llama-3.1-8b-instant"],
                ["ai_api_key", "text", "Your LLM provider API key — stored securely"],
                ["system_prompt", "text", "AI personality and instructions"],
                ["auto_reply", "boolean", "When true, AI replies automatically to every inbound message"],
                ["webhook_url", "text", "For ai_engine=webhook — POST target URL (n8n etc)"],
                ["welcome_message_enabled", "boolean", "Send welcome message to new contacts"],
                ["out_of_office_enabled", "boolean", "Auto-reply outside business hours"],
                ["followup_enabled", "boolean", "Follow-up after 24hr no reply"],
              ]}
            />
            <h4 className="text-base font-semibold text-white mt-5 mb-1">Supported providers</h4>
            <Table
              headers={["Provider", "Free Tier", "Recommended Model", "Get Key"]}
              rows={[
                ["Groq", "✓ 14,400 req/day", <code key="1" className="font-mono text-[12.5px]">llama-3.1-8b-instant</code>, <a key="1a" href="https://console.groq.com/keys" className="text-[#0084ff] hover:underline inline-flex items-center gap-1">console.groq.com <ExternalLink className="h-3 w-3" /></a>],
                ["Google Gemini", "✓ 1,500 req/day", <code key="2" className="font-mono text-[12.5px]">gemini-2.0-flash</code>, <a key="2a" href="https://aistudio.google.com/app/apikey" className="text-[#0084ff] hover:underline inline-flex items-center gap-1">aistudio.google.com <ExternalLink className="h-3 w-3" /></a>],
                ["OpenAI", "✗ Paid", <code key="3" className="font-mono text-[12.5px]">gpt-4o-mini</code>, <a key="3a" href="https://platform.openai.com/api-keys" className="text-[#0084ff] hover:underline inline-flex items-center gap-1">platform.openai.com <ExternalLink className="h-3 w-3" /></a>],
                ["DeepSeek", "Limited", <code key="4" className="font-mono text-[12.5px]">deepseek-chat</code>, <a key="4a" href="https://platform.deepseek.com/api_keys" className="text-[#0084ff] hover:underline inline-flex items-center gap-1">platform.deepseek.com <ExternalLink className="h-3 w-3" /></a>],
                ["Anthropic Claude", "✗ Paid", <code key="5" className="font-mono text-[12.5px]">claude-3-haiku</code>, <a key="5a" href="https://console.anthropic.com/settings/keys" className="text-[#0084ff] hover:underline inline-flex items-center gap-1">console.anthropic.com <ExternalLink className="h-3 w-3" /></a>],
                ["Custom Webhook", "n/a", "—", "Your n8n URL"],
              ]}
            />
          </Section>

          <Section id="quick" title="Quick Replies">
            <p>Save canned responses and trigger them with <code className="font-mono text-[#0084ff]">/shortcut</code> in the inbox.</p>
            <Table
              headers={["Field", "Description"]}
              rows={[
                ["shortcut", "e.g. /pricing"],
                ["message", "Full text to insert"],
              ]}
            />
            <p className="text-sm text-white/70">Stored in <code className="font-mono text-[#0084ff]">quick_replies</code> table, scoped to agency_id. Usage: In inbox message composer, type <code className="font-mono">/</code> to see popup of matching shortcuts.</p>
          </Section>

          <Section id="activity" title="Activity Log">
            <p>Replora auto-logs all key events for your agency.</p>
            <Table
              headers={["Event", "Trigger", "Description"]}
              rows={[
                ["message_received", "New inbound message", "Contact sent a message"],
                ["ai_replied", "AI sends outbound", "AI agent responded"],
                ["message_sent", "Human sends outbound", "Human agent replied"],
                ["lead_tagged", "lead_category set", "Message tagged hot/warm/cold"],
                ["conversation_open", "New conversation", "First message from contact"],
                ["human_takeover", "Toggle activated", "Agent took over conversation"],
                ["conversation_closed", "Status = closed", "Conversation marked done"],
                ["deal_created", "New deal", "Added to pipeline"],
                ["deal_moved", "Stage changed", "Deal moved to new stage"],
              ]}
            />
            <p className="text-sm text-white/70">Activity Feed visible on Dashboard page (bottom panel).</p>
          </Section>

          <Section id="errors" title="Error Codes">
            <Table
              headers={["Code", "Meaning", "Fix"]}
              rows={[
                ["401", "Invalid or missing x-wa-secret", "Check your wam_sk_ key in Settings → API Keys"],
                ["404", "Phone number ID not found", "Ensure phone_number_id matches a connected number"],
                ["429", "AI provider rate limit", "Upgrade your LLM plan or switch to Groq free tier"],
                ["500", "Edge function error", "Check Supabase → Functions → webhook-receiver → Logs"],
              ]}
            />
            <h4 className="text-base font-semibold text-white mt-5 mb-1">Meta-specific errors</h4>
            <Table
              headers={["Meta Code", "Meaning"]}
              rows={[
                ["131047", "Message failed — 24hr window expired (use template)"],
                ["131026", "Phone number not on WhatsApp"],
                ["100", "Invalid phone_number_id — check Meta dashboard"],
              ]}
            />
          </Section>

          <div className="mt-16 pt-6 border-t border-white/[0.06] text-center text-xs text-white/40">
            Need help? <a href="mailto:care@replora.in" className="text-[#0084ff] hover:underline">care@replora.in</a> • <Phone className="h-3 w-3 inline" /> WhatsApp <a href="https://wa.me/919589568529" className="text-[#0084ff] hover:underline">+91 95895 68529</a>
          </div>
        </main>
      </div>
    </div>
  );
}

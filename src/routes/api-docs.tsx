import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Check,
  Copy,
  Zap,
  Shield,
  Radio,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export const Route = createFileRoute("/api-docs")({
  head: () => ({
    meta: [
      { title: "API Documentation — WA Monitor" },
      {
        name: "description",
        content:
          "Connect n8n, Make.com, Zapier or custom code to WA Monitor with our simple webhook API.",
      },
      { property: "og:title", content: "WA Monitor API Documentation" },
      {
        property: "og:description",
        content: "Webhook-based API for monitoring WhatsApp AI conversations.",
      },
    ],
  }),
  component: ApiDocsPage,
});

const WEBHOOK_BASE =
  "https://xloppafivbvsljfxtjwh.supabase.co/functions/v1/webhook-receiver";

type NavItem = { id: string; label: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "authentication", label: "Authentication" },
      { id: "quick-start", label: "Quick Start" },
    ],
  },
  {
    title: "Webhook Setup",
    items: [
      { id: "webhook-overview", label: "Overview" },
      { id: "connect-n8n", label: "Connect n8n" },
      { id: "connect-make", label: "Connect Make.com" },
      { id: "connect-zapier", label: "Connect Zapier" },
      { id: "test-webhook", label: "Test your webhook" },
    ],
  },
  {
    title: "Message Format",
    items: [
      { id: "inbound-messages", label: "Inbound Messages" },
      { id: "outbound-messages", label: "Outbound Messages" },
      { id: "message-object", label: "Message Object" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { id: "send-message", label: "Send Message" },
      { id: "get-conversations", label: "Get Conversations" },
      { id: "get-messages", label: "Get Messages" },
      { id: "get-contacts", label: "Get Contacts" },
    ],
  },
  {
    title: "SDKs & Tools",
    items: [
      { id: "n8n-node", label: "n8n Node (soon)" },
      { id: "postman", label: "Postman Collection" },
      { id: "faq", label: "FAQ" },
    ],
  },
];

function ApiDocsPage() {
  return (
    <AppLayout>
      <DocsView />
    </AppLayout>
  );
}

function DocsView() {
  const [active, setActive] = useState<string>("introduction");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const allIds = NAV.flatMap((g) => g.items.map((i) => i.id));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-slate-900">API Docs</span>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-md hover:bg-slate-100"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${mobileOpen ? "block" : "hidden"} lg:block fixed lg:sticky top-0 lg:top-0 left-0 lg:left-auto z-20 h-screen w-72 bg-[#1a1f2e] text-slate-300 overflow-y-auto`}
        >
          <div className="px-6 pt-8 pb-6 border-b border-white/[0.06]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0084ff]">
              Developer
            </div>
            <h2 className="text-white text-lg font-semibold mt-1">API Reference</h2>
            <p className="text-xs text-slate-400 mt-1">v1.0 · REST · Webhooks</p>
          </div>
          <nav className="px-3 py-5 space-y-6">
            {NAV.map((group) => (
              <div key={group.title}>
                <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = active === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full text-left px-3 py-1.5 text-[13px] rounded-md transition-all ${
                          isActive
                            ? "bg-[#0084ff]/10 text-[#0084ff] font-medium border-l-2 border-[#0084ff] pl-[10px]"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 space-y-20">
            <Introduction />
            <Authentication />
            <QuickStart />
            <WebhookOverview />
            <ConnectN8n />
            <ConnectMake />
            <ConnectZapier />
            <TestWebhook />
            <InboundMessages />
            <OutboundMessages />
            <MessageObject />
            <SendMessage />
            <GetConversations />
            <GetMessages />
            <GetContacts />
            <N8nNode />
            <Postman />
            <Faq />
            <div className="border-t border-slate-200 pt-8 text-center text-xs text-slate-400">
              Need help? Email support@wamonitor.io
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Reusable bits ---------- */

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      {eyebrow && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#0084ff] mb-2">
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-base text-slate-600 leading-relaxed">{subtitle}</p>}
      <div className="mt-6 space-y-5 text-[15px] text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

function CodeBlock({
  code,
  language = "bash",
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0d1117] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#161b22]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-3 text-[11px] font-mono text-slate-400">
            {title ?? language}
          </span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-all"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#00c853]" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed font-mono text-slate-100">
        <Highlighted code={code} language={language} />
      </pre>
    </div>
  );
}

/* Lightweight syntax highlighter for json/bash/http */
function Highlighted({ code, language }: { code: string; language: string }) {
  if (language === "json") {
    const html = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/("(?:\\.|[^"\\])*")(\s*:)/g, '<span style="color:#79c0ff">$1</span>$2')
      .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span style="color:#a5d6ff">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#ff7b72">$1</span>')
      .replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span style="color:#f2cc60">$1</span>');
    return <code dangerouslySetInnerHTML={{ __html: html }} />;
  }
  if (language === "bash") {
    const html = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/(^|\n)(\$\s.*)/g, '$1<span style="color:#7ee787">$2</span>')
      .replace(/(curl|POST|GET|PUT|DELETE)/g, '<span style="color:#ff7b72">$1</span>')
      .replace(/(-X|-H|-d)\b/g, '<span style="color:#d2a8ff">$1</span>')
      .replace(/("[^"]*")/g, '<span style="color:#a5d6ff">$1</span>');
    return <code dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <code>{code}</code>;
}

function Callout({
  variant = "info",
  children,
  title,
}: {
  variant?: "info" | "success" | "warning";
  children: React.ReactNode;
  title?: string;
}) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-green-50 border-green-200 text-green-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  }[variant];
  return (
    <div className={`rounded-lg border ${styles} px-4 py-3 text-sm`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function ParamTable({
  rows,
  headers,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left font-semibold text-slate-700 text-[12px] uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-slate-700">
                  {j === 0 ? (
                    <code className="text-[12.5px] font-mono text-[#0084ff] bg-blue-50 px-1.5 py-0.5 rounded">
                      {c}
                    </code>
                  ) : (
                    <span className="text-[13px]">{c}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Sections ---------- */

function Introduction() {
  return (
    <Section
      id="introduction"
      eyebrow="Documentation"
      title="WA Monitor API Documentation"
      subtitle="Connect any automation tool to monitor your WhatsApp AI agent conversations."
    >
      <p>
        WA Monitor provides a simple webhook-based API that lets you push WhatsApp
        conversation data from any automation platform — n8n, Make.com, Zapier or
        custom code — directly into your monitoring portal.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 pt-4">
        {[
          {
            icon: Zap,
            title: "Simple REST API",
            desc: "One endpoint. JSON in, JSON out. No SDK required.",
          },
          {
            icon: Shield,
            title: "Secure webhook auth",
            desc: "Bearer tokens + secret keys. Signed and isolated per agency.",
          },
          {
            icon: Radio,
            title: "Real-time delivery",
            desc: "Messages appear in your inbox the moment they're posted.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 p-5 hover:border-[#0084ff] hover:shadow-md transition-all"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-[#0084ff] flex items-center justify-center mb-3">
              <f.icon className="h-4.5 w-4.5" />
            </div>
            <div className="font-semibold text-slate-900 text-[14px]">{f.title}</div>
            <div className="text-[13px] text-slate-500 mt-1 leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Authentication() {
  return (
    <Section
      id="authentication"
      eyebrow="Security"
      title="Authentication"
      subtitle="Every request to the WA Monitor webhook must include two headers."
    >
      <ol className="list-decimal pl-5 space-y-1.5 text-[14px]">
        <li>
          <code className="font-mono text-[13px] bg-slate-100 px-1.5 py-0.5 rounded">
            Authorization: Bearer {"{your_publishable_key}"}
          </code>
        </li>
        <li>
          <code className="font-mono text-[13px] bg-slate-100 px-1.5 py-0.5 rounded">
            x-webhook-secret: {"{your_webhook_secret}"}
          </code>
        </li>
      </ol>
      <CodeBlock
        language="json"
        title="headers"
        code={`{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_PUBLISHABLE_KEY",
  "x-webhook-secret": "YOUR_WEBHOOK_SECRET"
}`}
      />
      <Callout variant="info">
        Find your keys in <strong>Settings → Webhook Connector</strong>.
      </Callout>
      <Link
        to="/settings"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0084ff] text-white text-sm font-medium rounded-lg hover:bg-[#0074e0] transition-colors"
      >
        Go to Settings <ArrowRight className="h-4 w-4" />
      </Link>
    </Section>
  );
}

function QuickStart() {
  return (
    <Section
      id="quick-start"
      eyebrow="5 minutes"
      title="Quick Start"
      subtitle="Send your first message in under 5 minutes."
    >
      <ol className="space-y-3">
        {[
          "Get your webhook URL from Settings",
          "Send a POST request to your webhook URL",
          "View the message in your Inbox",
        ].map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[#0084ff] text-white text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-[14px] text-slate-700">{t}</span>
          </li>
        ))}
      </ol>
      <CodeBlock
        language="bash"
        title="cURL"
        code={`curl -X POST ${WEBHOOK_BASE} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_PUBLISHABLE_KEY" \\
  -H "x-webhook-secret: YOUR_WEBHOOK_SECRET" \\
  -d '{
    "phone_number": "919876543210",
    "message_text": "Hello! What are your prices?",
    "direction": "inbound",
    "sender_type": "client",
    "timestamp": "2026-05-09T10:30:00Z"
  }'`}
      />
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-wider text-[#00c853] mb-2">
          200 OK Response
        </div>
        <CodeBlock
          language="json"
          title="response"
          code={`{
  "success": true
}`}
        />
      </div>
    </Section>
  );
}

function WebhookOverview() {
  return (
    <Section
      id="webhook-overview"
      eyebrow="Webhooks"
      title="Webhook Overview"
      subtitle="The webhook is the single ingress point for every message — inbound from your customers and outbound from your AI."
    >
      <ul className="list-disc pl-5 space-y-1.5 text-[14px]">
        <li>One stable URL per agency.</li>
        <li>Accepts JSON via HTTPS POST only.</li>
        <li>Returns <code className="font-mono text-[13px] bg-slate-100 px-1 rounded">200</code> on success, <code className="font-mono text-[13px] bg-slate-100 px-1 rounded">4xx</code> on auth or schema errors.</li>
      </ul>
      <CodeBlock language="bash" title="endpoint" code={`POST ${WEBHOOK_BASE}`} />
    </Section>
  );
}

function ConnectN8n() {
  return (
    <Section
      id="connect-n8n"
      eyebrow="Integration"
      title="Connect n8n"
      subtitle="Step-by-step guide to connect your n8n WhatsApp workflow."
    >
      <Step n={1} title="Open your WhatsApp workflow in n8n">
        Add an <strong>HTTP Request</strong> node after your WhatsApp Trigger node.
      </Step>
      <Step n={2} title="Configure the HTTP Request node">
        <ParamTable
          headers={["Field", "Value"]}
          rows={[
            ["Method", "POST"],
            ["URL", WEBHOOK_BASE],
            ["Authentication", "None (we use custom headers)"],
          ]}
        />
      </Step>
      <Step n={3} title="Add Headers">
        <ParamTable
          headers={["Header Name", "Value"]}
          rows={[
            ["Content-Type", "application/json"],
            ["Authorization", "Bearer YOUR_PUBLISHABLE_KEY"],
            ["x-webhook-secret", "YOUR_WEBHOOK_SECRET"],
          ]}
        />
      </Step>
      <Step n={4} title="Configure Body Parameters (inbound)">
        <ParamTable
          headers={["Parameter", "Value"]}
          rows={[
            ["phone_number", "{{ $json.messages[0].from }}"],
            ["message_text", "{{ $json.messages[0].text.body }}"],
            ["direction", "inbound"],
            ["sender_type", "client"],
            ["timestamp", "{{ new Date().toISOString() }}"],
          ]}
        />
      </Step>
      <Step
        n={5}
        title="Add a second HTTP Request after your AI Agent (outbound)"
      >
        <ParamTable
          headers={["Parameter", "Value"]}
          rows={[
            ["phone_number", "{{ $('WhatsApp Trigger').item.json.messages[0].from }}"],
            ["message_text", "{{ $json.output }}"],
            ["direction", "outbound"],
            ["sender_type", "ai_agent"],
            ["timestamp", "{{ new Date().toISOString() }}"],
          ]}
        />
      </Step>
      <Callout variant="success" title="Pro tip">
        Add a Filter node before HTTP Request to only process text messages:
        <code className="font-mono text-[13px] bg-white/60 px-1.5 py-0.5 rounded ml-1">
          messages[0].type === 'text'
        </code>
      </Callout>
      <CodeBlock
        language="bash"
        title="workflow"
        code={`WhatsApp Trigger → Filter → HTTP Request (inbound)
                  → AI Agent → HTTP Request (outbound)
                  → Send Message`}
      />
    </Section>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5 space-y-3 hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-3">
        <span className="h-7 w-7 rounded-full bg-[#0084ff] text-white text-xs font-bold flex items-center justify-center">
          {n}
        </span>
        <h3 className="font-semibold text-slate-900 text-[15px]">{title}</h3>
      </div>
      <div className="pl-10 text-[14px] text-slate-700 space-y-3">{children}</div>
    </div>
  );
}

function ConnectMake() {
  return (
    <Section
      id="connect-make"
      eyebrow="Integration"
      title="Connect Make.com"
      subtitle="Use the HTTP module to forward WhatsApp messages to your monitor."
    >
      <Step n={1} title="Add an HTTP module">
        Place an HTTP module after your WhatsApp module (similar to n8n's HTTP Request).
      </Step>
      <Step n={2} title="Configure the request">
        <ParamTable
          headers={["Field", "Value"]}
          rows={[
            ["Method", "POST"],
            ["URL", WEBHOOK_BASE],
            ["Body type", "Raw / JSON"],
          ]}
        />
      </Step>
      <Step n={3} title="Add the same headers and body shape">
        Match the same headers and body parameters described in the n8n section above.
      </Step>
    </Section>
  );
}

function ConnectZapier() {
  return (
    <Section
      id="connect-zapier"
      eyebrow="Integration"
      title="Connect Zapier"
      subtitle="Use Zapier's Webhooks by Zapier action to forward messages."
    >
      <Step n={1} title="Add a 'Webhooks by Zapier → POST' action" />
      <Step n={2} title="Set the URL and headers">
        URL: <code className="font-mono text-[13px] bg-slate-100 px-1.5 py-0.5 rounded">{WEBHOOK_BASE}</code>
      </Step>
      <Step n={3} title="Map data fields from your WhatsApp trigger">
        Match the body shape described in the Message Object section.
      </Step>
    </Section>
  );
}

function TestWebhook() {
  const [url, setUrl] = useState(WEBHOOK_BASE);
  const [phone, setPhone] = useState("919999999999");
  const [text, setText] = useState("This is a test message");
  const [response, setResponse] = useState<{
    ok: boolean;
    body: string;
  } | null>(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    setResponse(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phone,
          message_text: text,
          direction: "inbound",
          sender_type: "client",
          timestamp: new Date().toISOString(),
        }),
      });
      const body = await res.text();
      setResponse({ ok: res.ok, body: body || `HTTP ${res.status}` });
    } catch (e) {
      setResponse({ ok: false, body: e instanceof Error ? e.message : String(e) });
    } finally {
      setSending(false);
    }
  };

  return (
    <Section
      id="test-webhook"
      eyebrow="Tools"
      title="Test Your Webhook"
      subtitle="Fire a test request to verify your setup end to end."
    >
      <div className="rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Webhook URL">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-100 outline-none font-mono"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone number">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </Field>
          <Field label="Message">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-[#0084ff] focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </Field>
        </div>
        <button
          onClick={send}
          disabled={sending}
          className="px-4 py-2 bg-[#0084ff] text-white text-sm font-medium rounded-lg hover:bg-[#0074e0] disabled:opacity-50 transition-colors"
        >
          {sending ? "Sending…" : "Send Test"}
        </button>
        {response && (
          <div
            className={`rounded-lg px-4 py-3 text-sm font-mono ${
              response.ok
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="font-semibold text-[12px] uppercase tracking-wider mb-1">
              {response.ok ? "Success" : "Error"}
            </div>
            <pre className="whitespace-pre-wrap break-words text-[12px]">{response.body}</pre>
          </div>
        )}
      </div>
      <CodeBlock
        language="bash"
        title="cURL"
        code={`curl -X POST YOUR_WEBHOOK_URL \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "x-webhook-secret: YOUR_SECRET" \\
  -d '{
    "phone_number": "919999999999",
    "message_text": "This is a test message",
    "direction": "inbound",
    "sender_type": "client",
    "timestamp": "2026-05-09T10:00:00Z"
  }'`}
      />
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function InboundMessages() {
  return (
    <Section
      id="inbound-messages"
      eyebrow="Format"
      title="Inbound Messages"
      subtitle="Messages received from your customer's WhatsApp."
    >
      <CodeBlock
        language="json"
        title="inbound payload"
        code={`{
  "phone_number": "919876543210",
  "message_text": "Hi, I'm interested in your service",
  "direction": "inbound",
  "sender_type": "client",
  "timestamp": "2026-05-09T10:30:00Z"
}`}
      />
    </Section>
  );
}

function OutboundMessages() {
  return (
    <Section
      id="outbound-messages"
      eyebrow="Format"
      title="Outbound Messages"
      subtitle="Messages your AI agent sends back to the customer."
    >
      <CodeBlock
        language="json"
        title="outbound payload"
        code={`{
  "phone_number": "919876543210",
  "message_text": "Sure! Here are our pricing plans...",
  "direction": "outbound",
  "sender_type": "ai_agent",
  "timestamp": "2026-05-09T10:30:05Z"
}`}
      />
    </Section>
  );
}

function MessageObject() {
  return (
    <Section
      id="message-object"
      eyebrow="Schema"
      title="Message Object"
      subtitle="Every stored message has the following shape."
    >
      <CodeBlock
        language="json"
        title="message"
        code={`{
  "id": "uuid",
  "agency_id": "uuid",
  "phone_number": "919876543210",
  "message_text": "Hello! What are your prices?",
  "direction": "inbound",
  "sender_type": "client",
  "timestamp": "2026-05-09T10:30:00Z",
  "is_read": false,
  "lead_category": "hot",
  "sentiment": "positive"
}`}
      />
      <ParamTable
        headers={["Field", "Type", "Description"]}
        rows={[
          ["phone_number", "string", "WhatsApp number with country code"],
          ["message_text", "string", "The message content"],
          ["direction", "string", '"inbound" or "outbound"'],
          ["sender_type", "string", '"client" or "ai_agent"'],
          ["timestamp", "string", "ISO 8601 datetime"],
        ]}
      />
    </Section>
  );
}

function SendMessage() {
  return (
    <Section
      id="send-message"
      eyebrow="Endpoint"
      title="Send Message"
      subtitle="POST a message into the monitor."
    >
      <CodeBlock language="bash" title="POST" code={`POST ${WEBHOOK_BASE}`} />
      <CodeBlock
        language="json"
        title="body"
        code={`{
  "phone_number": "919876543210",
  "message_text": "Hello",
  "direction": "inbound",
  "sender_type": "client",
  "timestamp": "2026-05-09T10:30:00Z"
}`}
      />
    </Section>
  );
}

function GetConversations() {
  return (
    <Section
      id="get-conversations"
      eyebrow="Endpoint"
      title="Get Conversations"
      subtitle="List unique conversations for your agency."
    >
      <CodeBlock
        language="bash"
        title="GET"
        code={`GET https://xloppafivbvsljfxtjwh.supabase.co/rest/v1/conversations`}
      />
    </Section>
  );
}

function GetMessages() {
  return (
    <Section
      id="get-messages"
      eyebrow="Endpoint"
      title="Get Messages"
      subtitle="Retrieve all messages for a phone number."
    >
      <CodeBlock
        language="bash"
        title="GET"
        code={`GET https://xloppafivbvsljfxtjwh.supabase.co/rest/v1/messages?phone_number=eq.919876543210`}
      />
    </Section>
  );
}

function GetContacts() {
  return (
    <Section
      id="get-contacts"
      eyebrow="Endpoint"
      title="Get Contacts"
      subtitle="List all unique contacts that have ever messaged you."
    >
      <CodeBlock
        language="bash"
        title="GET"
        code={`GET https://xloppafivbvsljfxtjwh.supabase.co/rest/v1/contacts`}
      />
    </Section>
  );
}

function N8nNode() {
  return (
    <Section
      id="n8n-node"
      eyebrow="SDKs & Tools"
      title="n8n Node"
      subtitle="A native n8n community node — coming soon."
    >
      <Callout variant="info">
        We're building a one-click WA Monitor node for n8n. Want early access?
        Email <strong>support@wamonitor.io</strong>.
      </Callout>
    </Section>
  );
}

function Postman() {
  return (
    <Section
      id="postman"
      eyebrow="SDKs & Tools"
      title="Postman Collection"
      subtitle="Pre-built requests for every endpoint, ready to import."
    >
      <a
        href="#"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0084ff] text-white text-sm font-medium rounded-lg hover:bg-[#0074e0] transition-colors"
      >
        Download Collection <ArrowRight className="h-4 w-4" />
      </a>
    </Section>
  );
}

function Faq() {
  const items = [
    {
      q: "Can I send images or files?",
      a: "Currently WA Monitor supports text messages only. Image support is coming soon.",
    },
    {
      q: "How many messages can I send per second?",
      a: "The webhook accepts up to 100 requests per second.",
    },
    {
      q: "What happens if my webhook request fails?",
      a: "WA Monitor returns appropriate HTTP status codes. Implement retry logic in your n8n workflow.",
    },
    {
      q: "Is the webhook URL permanent?",
      a: "Yes. Your webhook URL never changes unless you regenerate your secret key.",
    },
  ];
  return (
    <Section id="faq" eyebrow="Help" title="Frequently Asked Questions">
      <div className="space-y-2">
        {items.map((it) => (
          <FaqItem key={it.q} q={it.q} a={it.a} />
        ))}
      </div>
    </Section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-900 text-[14px]">{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-[14px] text-slate-600 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

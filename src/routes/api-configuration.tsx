import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Copy, Check, Plug, Sparkles, AlertTriangle, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/api-configuration")({
  head: () => ({ meta: [{ title: "API Configuration — Replora" }] }),
  component: ApiConfigPage,
});

type ApiKey = {
  id: string;
  name: string;
  description: string;
  key: string;
  created: string;
  lastUsed: string;
};

function genKey() {
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  return "wam_sk_" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const inputClass = "w-full h-11 px-3 rounded-lg bg-white/[0.08] border border-white/15 text-white placeholder:text-white/40 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 outline-none text-sm";

const CONNECTORS = [
  { name: "n8n", desc: "Native webhook connector", available: true },
  { name: "Make", desc: "HTTP module connector", available: true },
  { name: "Zapier", desc: "Webhook trigger", available: true },
  { name: "Pabbly Connect", desc: "Webhook module", available: true },
  { name: "HubSpot", desc: "CRM sync", available: false },
  { name: "Zoho CRM", desc: "Lead push", available: false },
  { name: "Slack", desc: "Alert notifications", available: false },
  { name: "Google Sheets", desc: "Log conversations", available: false },
];

function ApiConfigPage() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [rowCopied, setRowCopied] = useState<string | null>(null);

  const generate = () => {
    if (!name.trim()) { toast.error("Project name required"); return; }
    const k = genKey();
    const row: ApiKey = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: desc.trim(),
      key: k,
      created: new Date().toISOString(),
      lastUsed: "Never",
    };
    setKeys((prev) => [row, ...prev]);
    setGenerated(k);
    setName(""); setDesc("");
    toast.success("API Key generated — copy it now, it won't be shown again.");
  };

  const copy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleVisible = (id: string) => setVisible((v) => ({ ...v, [id]: !v[id] }));
  const copyRow = async (id: string, key: string) => {
    await navigator.clipboard.writeText(key);
    setRowCopied(id);
    setTimeout(() => setRowCopied(null), 1500);
  };
  const mask = (k: string) => k.slice(0, 8) + "•".repeat(Math.max(0, k.length - 12)) + k.slice(-4);

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10 space-y-10">
      {/* SECTION 1: API Keys */}
      <section>
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-white tracking-tight">API Keys</h1>
          <p className="text-sm text-white/60 mt-1.5">Connect Replora to your automation platform in 60 seconds.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-7">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center"><KeyRound className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Generate New Key</h2>
              <p className="text-sm text-white/60 mt-0.5">Create a key for each project or integration.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/80">Project Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My WhatsApp Bot" className={`mt-1 ${inputClass}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-white/80">Description <span className="text-white/40">(optional)</span></label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this key for?" className={`mt-1 ${inputClass}`} />
            </div>
            <button onClick={generate}
              className="h-11 px-5 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-sm font-semibold transition-colors">
              Generate API Key
            </button>
          </div>

          {generated && (
            <div className="mt-6 space-y-3">
              <div className="flex items-stretch gap-2">
                <div className="flex-1 bg-[#0B141A] border border-white/10 rounded-lg px-3 py-3 font-mono text-sm text-white break-all">
                  {generated}
                </div>
                <button onClick={copy}
                  className="px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5 shrink-0" />
                <p className="text-[13px] text-amber-100">Save this key now. You won't be able to see it again.</p>
              </div>
            </div>
          )}
        </div>

        {/* Keys table */}
        <div className="mt-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Existing Keys</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/60">
                <tr>
                  <th className="px-4 py-2.5 text-left">Project Name</th>
                  <th className="px-4 py-2.5 text-left">API Key</th>
                  <th className="px-4 py-2.5 text-left">Created</th>
                  <th className="px-4 py-2.5 text-left">Last Used</th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-white/40 text-sm">No keys yet</td></tr>
                )}
                {keys.map((k) => (
                  <tr key={k.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">{k.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs text-white/90 bg-[#0B141A] border border-white/10 rounded px-2 py-1 break-all">
                          {visible[k.id] ? k.key : mask(k.key)}
                        </code>
                        <button onClick={() => toggleVisible(k.id)} title={visible[k.id] ? "Hide" : "Show"}
                          className="h-7 w-7 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-white/80 flex items-center justify-center">
                          {visible[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => copyRow(k.id, k.key)} title="Copy"
                          className="h-7 w-7 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-white/80 flex items-center justify-center">
                          {rowCopied === k.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/70">{new Date(k.created).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-white/70">{k.lastUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 2: Connectors */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white tracking-tight">Available Connectors</h2>
          <p className="text-sm text-white/60 mt-1.5">Plug Replora into your favourite tools.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONNECTORS.map((c) => (
            <div key={c.name} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#0084ff]/15 text-[#0084ff] flex items-center justify-center shrink-0">
                <Plug className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    c.available
                      ? "bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30"
                      : "bg-white/10 text-white/50 border border-white/10"
                  }`}>{c.available ? "Available" : "Coming Soon"}</span>
                </div>
                <p className="text-sm text-white/60 mt-1">{c.desc}</p>
                {c.available ? (
                  <Link to="/api-docs"
                    className="mt-3 inline-flex items-center h-9 px-3.5 rounded-lg bg-[#0084ff] hover:bg-[#0066cc] text-white text-xs font-semibold">
                    View Docs
                  </Link>
                ) : (
                  <button disabled className="mt-3 inline-flex items-center h-9 px-3.5 rounded-lg bg-white/5 text-white/40 text-xs font-semibold cursor-not-allowed">
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Plans */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-white tracking-tight">Choose the Right Plan</h2>
          <p className="text-sm text-white/60 mt-1.5">Built for agencies running WhatsApp AI at scale.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlanCard
            name="Starter" price="₹1499" badge="Most Popular"
            features={["1 WhatsApp number","Unlimited messages","Full portal access","AI monitoring dashboard","Email support"]}
            cta="Upgrade to Starter" ctaColor="bg-[#0084ff] hover:bg-[#0066cc]"
          />
          <PlanCard
            name="Growth" price="₹3999"
            features={["5 WhatsApp numbers","Everything in Starter","Priority support","PDF reports","Team access (3 users)"]}
            cta="Upgrade to Growth" ctaColor="bg-[#0084ff] hover:bg-[#0066cc]"
          />
          <PlanCard
            name="Agency" price="₹9999"
            features={["Unlimited numbers","Everything in Growth","White label branding","Dedicated account manager","Custom integrations","SLA guarantee"]}
            cta="Contact Sales" ctaColor="bg-[#00c853] hover:bg-[#00b048]"
            ctaHref="mailto:care@replora.in?subject=Replora%20Agency%20Plan%20Inquiry"
          />
        </div>
        <p className="mt-6 text-center text-xs text-white/60">
          🔒 Secure payments via Razorpay · Cancel anytime · No hidden fees · Made in India 🇮🇳
        </p>
      </section>
    </div>
  );
}

function PlanCard({
  name, price, badge, features, cta, ctaColor, ctaHref,
}: { name: string; price: string; badge?: string; features: string[]; cta: string; ctaColor: string; ctaHref?: string }) {
  return (
    <div className={`relative bg-white/5 backdrop-blur-md rounded-2xl border ${badge ? "border-[#00c853]/40" : "border-white/10"} p-6 flex flex-col`}>
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#00c853] text-white shadow-lg shadow-[#00c853]/30">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <div className="mt-3 text-3xl font-bold text-white">{price}<span className="text-sm font-normal text-white/60">/month</span></div>
      <ul className="mt-5 space-y-2 text-sm text-white/80 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 text-[#00c853] mt-0.5 shrink-0" /> {f}</li>
        ))}
      </ul>
      {ctaHref ? (
        <a href={ctaHref} className={`mt-6 inline-flex items-center justify-center h-11 rounded-lg ${ctaColor} text-white text-sm font-semibold transition-colors`}>
          <Sparkles className="h-4 w-4 mr-1.5" /> {cta}
        </a>
      ) : (
        <button className={`mt-6 inline-flex items-center justify-center h-11 rounded-lg ${ctaColor} text-white text-sm font-semibold transition-colors`}>
          <Sparkles className="h-4 w-4 mr-1.5" /> {cta}
        </button>
      )}
    </div>
  );
}

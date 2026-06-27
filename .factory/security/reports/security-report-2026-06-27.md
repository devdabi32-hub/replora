# Replora Security Report — 2026-06-27
## Full Repository Scan · STRIDE Threat Model

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 1 |
| 🟠 High | 3 |
| 🟡 Medium | 1 |
| 🔵 Low | 2 |
| ✅ False Positives / Not Reachable | 7 |

**Verdict: ❌ 1 Critical + 3 High — must fix before revenue/launch**

---

## CRITICAL

### VULN-001 — API Key Architecture is Broken
**STRIDE:** Spoofing + Information Disclosure  
**CWE:** CWE-321 (Use of Hard-coded Cryptographic Key)  
**File:** `src/routes/api-configuration.tsx:25-78`  
**Confidence:** 1.0

**What's broken:**  
`genKey()` uses `crypto.getRandomValues()` to create a `wam_sk_` key and stores it ONLY in `localStorage`. It is **never written to Supabase** — not to `connected_phone_numbers.api_key`, not to `agencies.webhook_secret`, nowhere.

The webhook-receiver Edge Function authenticates against keys stored in Supabase. The keys shown in `/api-configuration` are fake UI theater — they will never authenticate a real webhook call.

The real working key is `agencies.webhook_secret` (generated at signup) which is visible in `/connections` but never surfaced here.

**Exploit scenario:**  
User follows the setup guide, copies the key from `/api-configuration`, pastes it in n8n — gets 401/403 every time. OR a malicious user generates keys and deletes them from localStorage — the system has no record they existed. OR a different browser/device loses all "keys" silently.

**Fix needed:**  
- Write generated keys to `connected_phone_numbers` table (with label, agency_id)
- Read existing keys from Supabase on page load
- Remove all localStorage usage for keys

---

## HIGH

### VULN-002 — Admin RPC Callable by Any Authenticated User
**STRIDE:** Elevation of Privilege  
**CWE:** CWE-862 (Missing Authorization)  
**File:** `src/routes/admin.tsx:256-265`  
**Confidence:** 0.9

**What's broken:**  
The admin guard is purely client-side (line 66-69):
```ts
if (!accountLoading && email !== OWNER_EMAIL) {
  navigate({ to: "/dashboard" });
}
```

Any authenticated user can open DevTools and run:
```js
const { createClient } = await import('@supabase/supabase-js')
// use the published anon key (visible in page source)
const sb = createClient('https://xloppafivbvsljfxtjwh.supabase.co', ANON_KEY)
await sb.rpc('admin_upgrade_agency', {
  p_agency_id: 'their-own-agency-uuid',
  p_plan: 'agency',
  p_months: 12,
  p_amount: 0,
  p_notes: null
})
```

This upgrades their account to Agency plan for free — IF the database RPC has no `auth.email()` check.

**Fix needed:**  
Add to the `admin_upgrade_agency` SQL function:
```sql
IF auth.email() != 'devdabi32@gmail.com' THEN
  RAISE EXCEPTION 'Unauthorized';
END IF;
```

---

### VULN-003 — No Pagination: Memory DoS on Dashboard + Inbox
**STRIDE:** Denial of Service  
**CWE:** CWE-400 (Uncontrolled Resource Consumption)  
**Files:** `src/routes/dashboard.tsx:41`, `src/routes/inbox.tsx` (loadMessages)  
**Confidence:** 1.0

**What's broken:**
```ts
// Dashboard
const { data } = await supabase.from("messages").select("*").order("timestamp", { ascending: false });

// Inbox
const { data } = await supabase.from("messages").select("*").order("timestamp", { ascending: false });
```

No `.limit()`. An agency sending 10,000+ messages/month will eventually crash their own browser tab loading the dashboard. At scale (100K messages), this loads ~50MB of JSON into memory.

**Fix needed:**  
Add `.limit(500)` or `.range(0, 499)` for initial load, implement cursor-based pagination for inbox.

---

### VULN-004 — Weak Password Minimum (6 Characters)
**STRIDE:** Spoofing  
**CWE:** CWE-521 (Weak Password Requirements)  
**File:** `src/routes/signup.tsx:75`  
**Confidence:** 1.0

```tsx
<input type="password" required minLength={6} ... />
```

6-character minimum is a client-side-only constraint (Supabase default). Allows passwords like `abc123`. Credential stuffing attacks become trivial.

**Fix needed:**  
- Change `minLength={6}` to `minLength={8}`
- Add server-side validation via Supabase Auth `passwordMinLength` setting in dashboard

---

## MEDIUM

### VULN-005 — Supabase JWT Stored in localStorage (XSS Attack Surface)
**STRIDE:** Spoofing  
**CWE:** CWE-922 (Insecure Storage of Sensitive Information)  
**File:** `src/lib/supabase.ts`  
**Confidence:** 0.8

Supabase stores the user's JWT session in `localStorage` by default. If any XSS vulnerability is introduced (via user content rendered unsafely, or a compromised npm package), an attacker can steal the JWT and impersonate the user.

React + Tailwind makes XSS unlikely (no `dangerouslySetInnerHTML` found in codebase), but the attack surface exists.

**Fix needed (optional for now):**  
Configure Supabase to use `storage: cookieBasedStorage` with httpOnly cookies. Requires a backend middleware. Low priority until the product scales.

---

## LOW

### VULN-006 — api/render.js: Unbounded Request Body Buffer
**STRIDE:** Denial of Service  
**File:** `api/render.js:39-43`  
**Confidence:** 0.7

```js
for await (const chunk of req) chunks.push(chunk);
body = Buffer.concat(chunks);
```

No request body size limit. Vercel's payload cap (4.5MB for serverless functions) provides a practical ceiling, so real-world DoS impact is low.

**Fix (optional):**
```js
let bodySize = 0;
const MAX_BODY = 4 * 1024 * 1024; // 4MB
for await (const chunk of req) {
  bodySize += chunk.length;
  if (bodySize > MAX_BODY) { res.statusCode = 413; res.end(); return; }
  chunks.push(chunk);
}
```

---

### VULN-007 — Missing Security Headers
**STRIDE:** Tampering (Clickjacking)  
**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers)  
**File:** `vercel.json`  
**Confidence:** 0.8

No `Content-Security-Policy`, `X-Frame-Options`, or `X-Content-Type-Options` headers configured in `vercel.json`. Allows clickjacking and MIME-sniffing attacks.

**Fix — add to vercel.json:**
```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]
  }
]
```

---

## Dependency Scan

| Package | Severity | CVE | Reachability | Action |
|---------|----------|-----|--------------|--------|
| `vite ^7.3.1` | HIGH | Path traversal via dev server | **NOT_REACHABLE** (dev-only, not in prod bundle) | Update when available |
| `@cloudflare/vite-plugin ^1.25.5` | HIGH | Multiple | **NOT_REACHABLE** (build-time only) | Move to devDependencies |
| `wrangler` (transitive) | HIGH | Multiple | **NOT_REACHABLE** (build-time only) | No action |
| `miniflare` (transitive) | HIGH | Multiple | **NOT_REACHABLE** (build-time only) | No action |
| `undici 7.x` (transitive via supabase) | HIGH | Request smuggling | **NOT_REACHABLE** (browser uses native fetch, not undici) | Monitor |
| `ws 8.x` (transitive via supabase realtime) | HIGH | DoS | **NOT_REACHABLE** (browser uses native WebSocket) | Monitor |
| `js-yaml` (transitive) | MODERATE | Code injection via YAML | **NOT_REACHABLE** (no YAML parsing in app) | No action |
| `esbuild 0.27-0.28` (transitive) | LOW | Dev server only | **NOT_REACHABLE** | No action |
| `@babel/core` (transitive) | LOW | Build-time | **NOT_REACHABLE** | No action |

**Critical action:** Move `@cloudflare/vite-plugin` from `dependencies` → `devDependencies` in package.json.

---

## False Positives / Excluded

| Item | Reason |
|------|--------|
| Client-side admin route guard flash | RLS on Supabase is the real enforcement layer |
| Error messages from Supabase auth | Supabase returns uniform "Invalid login credentials" |
| Google OAuth redirect to `window.location.origin` | Browser-controlled, not injectable |
| Onboarding website URL field (no validation) | Not rendered as clickable link, low blast radius |
| `calcDaysLeft` magic number in admin.tsx:52 | Not a security issue |
| `localStorage` for API keys visibility state | UI state only, not sensitive |
| CSRF | Supabase uses bearer token auth, not cookies — CSRF not applicable |

---

## Priority Fix Order

1. 🔴 **VULN-002** — Add `auth.email()` check to `admin_upgrade_agency` RPC in Supabase SQL Editor (5 min)
2. 🔴 **VULN-001** — Rebuild `/api-configuration` to write keys to `connected_phone_numbers` table (2-3 hours)
3. 🟠 **VULN-003** — Add `.limit(500)` to dashboard + inbox queries (15 min)
4. 🟠 **VULN-004** — Change `minLength={6}` → `minLength={8}` in signup.tsx (2 min)
5. 🔵 **VULN-007** — Add security headers to vercel.json (5 min)
6. 📦 **DEP-001** — Move `@cloudflare/vite-plugin` to devDependencies (1 min)

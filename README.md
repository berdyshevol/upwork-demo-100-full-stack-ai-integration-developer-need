# AI Content Brief Generator — Demo

## Live demo

https://upwork-demo-100-full-stack-ai-integ.vercel.app

Enter a **topic**, **tone**, and **audience**, and watch a structured content brief stream in
token-by-token from GPT-4 or Claude. This demonstrates the core "AI Content Generation Module":
provider-agnostic LLM integration, streaming, and structured (typed, schema-enforced) output —
not a raw text blob.

## What this demonstrates

- **Single-page generator** (`/`) — topic / tone / audience inputs + a recent-briefs sidebar.
- **Live streaming** — the raw tokens stream into a live panel, then parse into discrete sections.
- **Structured output** — every result is a typed `{ title, keywords[], outline[], draftIntro }`.
- **Model toggle** — switch the model/provider; the same enforced structure always comes back.
- **Provider-agnostic** via the **Vercel AI SDK** (`@ai-sdk/anthropic`, `@ai-sdk/openai`,
  `@ai-sdk/google`) — calls go through `streamObject`, never a raw provider HTTP endpoint.
- **Persistence** — the last 5 briefs are saved (browser `localStorage`) and reopenable at
  `/brief/[id]` after a refresh.

## BYOK — Bring Your Own Key

There are **no server-side API keys**. Open **Settings**, pick a provider, paste *your* key, and
choose a model. The key lives only in your browser's `localStorage` (key: `byok`) and is sent with
each generation request for that request only — never logged or persisted on the server. The
deployed demo bills **your** account, no one else's.

Without a key, every non-AI part of the app works; the generator shows an inline hint and is
disabled until you add a key in Settings. Tests stub a `provider: "mock"` value so they never need
a real key.

### Settings controls
- **Provider**: Anthropic · OpenAI · Google
- **API key**: single field; label tracks the provider
- **Model** (first is default):
  - Anthropic: `claude-haiku-4-5`, `claude-sonnet-4-6`, `claude-opus-4-7`
  - OpenAI: `gpt-4o-mini`, `gpt-4o`, `o1-mini`
  - Google: `gemini-2.0-flash`, `gemini-2.5-pro`

## The system prompt

The documented **system prompt** lives in [`lib/brief.ts`](lib/brief.ts) as `SYSTEM_PROMPT`. It
takes three injected parameters — **topic**, **tone**, **audience** (via `buildUserPrompt`) — and
instructs the model to:

- write in the requested **tone** and address the target **audience**,
- produce one strong `title`,
- 4–7 target `keywords`,
- a 3–5 section H2/H3 `outline`,
- a 2–4 sentence `draftIntro`,
- and return **only** the JSON object below — no markdown, no prose.

## Enforced output schema

Defined as a Zod schema (`BriefContentSchema` in `lib/brief.ts`) and enforced by the AI SDK's
`streamObject` (real providers) and re-validated on the client:

```ts
{
  title: string,
  keywords: string[],
  outline: { heading: string /* H2 */, subpoints: string[] /* H3 */ }[],
  draftIntro: string
}
```

The same `draftIntro` / `title` / `keywords` / `outline` shape is what the UI renders as discrete,
typed sections.

## Run locally

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

### Test (no API key required)

```bash
pnpm exec playwright install --with-deps chromium   # once
pnpm test                                           # Playwright acceptance tests
```

### Build

```bash
pnpm build
```

## Tech stack

Next.js (App Router) + TypeScript · Tailwind CSS · Vercel AI SDK (`streamObject` + Zod) ·
Anthropic / OpenAI / Google providers · `localStorage` persistence. Deployed on Vercel.

## Architecture notes

- AI calls are proxied through the `nodejs` route handler `app/api/generate/route.ts`, which
  accepts the visitor's key **in the request body** and streams the structured JSON back. The key
  is never stored server-side. (Vercel's filesystem is ephemeral, so brief persistence is
  client-side `localStorage` rather than SQLite — same data model, deploy-friendly.)
- The `mock` provider returns deterministic, input-derived content so the demo and the test suite
  work with zero credentials.

## Deploy URL

https://upwork-demo-100-full-stack-ai-integ.vercel.app

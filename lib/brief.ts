import { z } from "zod";

/**
 * The enforced output schema for a content brief. Every provider (Anthropic,
 * OpenAI, Google, or the test "mock") must return this exact shape — it is what
 * `generateObject`/`streamObject` validates against and what the UI renders as
 * discrete, typed sections.
 */
export const OutlineItemSchema = z.object({
  heading: z.string().describe("An H2 section heading for the article."),
  subpoints: z.array(z.string()).describe("H3 talking points under the H2."),
});

export const BriefContentSchema = z.object({
  title: z.string().describe("A compelling, SEO-aware article title."),
  keywords: z.array(z.string()).describe("Target SEO keywords / search phrases."),
  outline: z.array(OutlineItemSchema).describe("The H2/H3 article outline."),
  draftIntro: z.string().describe("A first-draft introduction paragraph."),
});

export type BriefContent = z.infer<typeof BriefContentSchema>;

export type Brief = {
  id: string;
  topic: string;
  tone: string;
  audience: string;
  model: string;
  content: BriefContent;
  createdAt: string;
};

/**
 * The documented system prompt. Parameters {topic, tone, audience} are injected
 * via buildUserPrompt; the model is instructed to emit ONLY the JSON object that
 * matches BriefContentSchema.
 */
export const SYSTEM_PROMPT = `You are an expert SEO content strategist and editor.
Given a TOPIC, a desired TONE, and a target AUDIENCE, produce a structured content brief.

Rules:
- Write in the requested TONE and speak directly to the described AUDIENCE.
- "title": one strong, specific, search-friendly headline (no clickbait).
- "keywords": 4–7 realistic target search phrases a writer should rank for.
- "outline": 3–5 H2 sections, each with 2–4 H3 subpoints. Logical reading order.
- "draftIntro": a 2–4 sentence first-draft introduction that hooks the AUDIENCE.
- Return ONLY a JSON object matching this shape, with no markdown fences or prose:
  { "title": string, "keywords": string[],
    "outline": [{ "heading": string, "subpoints": string[] }], "draftIntro": string }`;

export function buildUserPrompt(topic: string, tone: string, audience: string): string {
  return `TOPIC: ${topic}\nTONE: ${tone}\nAUDIENCE: ${audience}\n\nWrite the content brief now.`;
}

/**
 * Deterministic, key-free brief used by the "mock" provider (default state and
 * the value the behavioral tests stub into localStorage.byok). Content is derived
 * from the inputs so it is specific — never lorem ipsum.
 */
export function mockBrief(topic: string, tone: string, audience: string, model: string): BriefContent {
  const t = topic.trim() || "Your topic";
  const flavor = model.includes("gpt") ? "Practical Guide" : "Strategic Playbook";
  return {
    title: `${t}: A ${flavor} for ${audience.trim() || "Your Audience"}`,
    keywords: [
      t.toLowerCase(),
      `${t.toLowerCase()} best practices`,
      `${t.toLowerCase()} for ${audience.toLowerCase() || "teams"}`,
      `how to ${t.toLowerCase()}`,
      `${t.toLowerCase()} checklist`,
    ],
    outline: [
      {
        heading: `Why ${t} Matters Now`,
        subpoints: [
          `The cost of ignoring ${t.toLowerCase()}`,
          `Where ${audience.trim() || "readers"} feel the pain today`,
        ],
      },
      {
        heading: `A ${tone.trim() || "Clear"} Framework`,
        subpoints: [
          `Step 1: Audit your current state`,
          `Step 2: Prioritize high-leverage changes`,
          `Step 3: Measure and iterate`,
        ],
      },
      {
        heading: `Common Pitfalls to Avoid`,
        subpoints: [
          `Over-engineering before validating`,
          `Skipping measurement`,
        ],
      },
    ],
    draftIntro: `If you care about ${t.toLowerCase()}, you already know the surface-level advice isn't enough. This brief gives ${audience.trim() || "you"} a ${tone.toLowerCase() || "clear"}, no-nonsense path from problem to measurable result — starting with the decisions that actually move the needle.`,
  };
}

// ── Client-side persistence (localStorage). Survives refresh; Vercel-friendly. ──
const STORAGE_KEY = "briefs";
const MAX_BRIEFS = 5;

export function loadBriefs(): Brief[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Brief[]) : [];
  } catch {
    return [];
  }
}

export function saveBrief(brief: Brief): Brief[] {
  const existing = loadBriefs().filter((b) => b.id !== brief.id);
  const next = [brief, ...existing].slice(0, MAX_BRIEFS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getBrief(id: string): Brief | undefined {
  return loadBriefs().find((b) => b.id === id);
}

// ── BYOK settings ──
export type Byok = { provider: string; apiKey: string; model: string };

export function loadByok(): Byok | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("byok");
    return raw ? (JSON.parse(raw) as Byok) : null;
  } catch {
    return null;
  }
}

export const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-7"],
  openai: ["gpt-4o-mini", "gpt-4o", "o1-mini"],
  google: ["gemini-2.0-flash", "gemini-2.5-pro"],
};

export const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

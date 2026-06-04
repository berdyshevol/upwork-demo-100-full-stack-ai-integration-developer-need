"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefView } from "@/components/BriefView";
import {
  BriefContentSchema,
  loadBriefs,
  loadByok,
  saveBrief,
  PROVIDER_MODELS,
  type Brief,
  type BriefContent,
  type Byok,
} from "@/lib/brief";

const MOCK_MODELS = ["mock-claude", "mock-gpt"];

export default function Home() {
  const [byok, setByok] = useState<Byok | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [model, setModel] = useState("mock-claude");

  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [brief, setBrief] = useState<{ content: BriefContent; model: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<Brief[]>([]);

  useEffect(() => {
    const b = loadByok();
    setByok(b);
    setRecent(loadBriefs());
    setHydrated(true);
  }, []);

  // Model toggle options depend on the configured provider; "mock" (tests +
  // default demo) exposes two stub models so the toggle is exercisable key-free.
  const modelOptions = useMemo(() => {
    if (byok && byok.provider !== "mock" && PROVIDER_MODELS[byok.provider]) {
      return PROVIDER_MODELS[byok.provider];
    }
    return MOCK_MODELS;
  }, [byok]);

  // Keep the selected model valid for the current provider.
  useEffect(() => {
    if (!modelOptions.includes(model)) setModel(modelOptions[0]);
  }, [modelOptions, model]);

  const hasKey = Boolean(byok && byok.apiKey && byok.provider);

  async function generate() {
    if (!hasKey || !byok) return;
    setGenerating(true);
    setStreamText("");
    setBrief(null);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          tone,
          audience,
          provider: byok.provider,
          apiKey: byok.apiKey,
          model,
        }),
      });

      if (!res.ok || !res.body) {
        setError((await res.text()) || "Generation failed.");
        setGenerating(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamText(acc);
      }

      const parsed = BriefContentSchema.safeParse(JSON.parse(acc));
      if (!parsed.success) {
        setError("The model returned an unexpected shape. Try again.");
        setGenerating(false);
        return;
      }

      const saved: Brief = {
        id: crypto.randomUUID(),
        topic,
        tone,
        audience,
        model,
        content: parsed.data,
        createdAt: new Date().toISOString(),
      };
      setRecent(saveBrief(saved));
      setBrief({ content: parsed.data, model });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            AI Content Brief Generator
          </h1>
          <p className="mt-1 max-w-2xl text-slate-400">
            Enter a topic, tone and audience. A structured brief — title, target keywords, an
            H2/H3 outline, and a first-draft intro — streams in live from your chosen model.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Topic" htmlFor="topic">
            <input
              id="topic"
              data-testid="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Serverless cost optimization"
              className="input"
            />
          </Field>
          <Field label="Tone" htmlFor="tone">
            <input
              id="tone"
              data-testid="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="Authoritative but friendly"
              className="input"
            />
          </Field>
          <Field label="Audience" htmlFor="audience">
            <input
              id="audience"
              data-testid="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Engineering managers at startups"
              className="input"
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <Field label="Model" htmlFor="model-toggle">
            <select
              id="model-toggle"
              data-testid="model-toggle"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="input"
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <button
            data-testid="generate-btn"
            onClick={generate}
            disabled={!hasKey || generating}
            className="rounded-md bg-gradient-to-r from-accent to-accent2 px-5 py-2.5 font-medium text-ink shadow-lg shadow-accent/20 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? "Streaming…" : "Generate brief"}
          </button>
        </div>

        {hydrated && !hasKey ? (
          <p
            data-testid="ai-hint"
            className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
          >
            Choose a provider and paste your API key in{" "}
            <Link href="/settings" className="underline">
              Settings
            </Link>{" "}
            to enable live AI.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {generating || streamText ? (
          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Live stream (raw tokens)
            </div>
            <pre
              data-testid="stream"
              className={`max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-300 ${
                generating ? "stream-live" : ""
              }`}
            >
              {streamText}
            </pre>
          </div>
        ) : null}

        {brief ? (
          <div className="rounded-xl border border-white/10 bg-panel/60 p-6">
            <BriefView
              content={brief.content}
              model={brief.model}
              meta={{ topic, tone, audience }}
            />
          </div>
        ) : null}
      </div>

      <aside className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Recent briefs
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">
            No briefs yet. Generate one and it&apos;ll be saved here (last 5).
          </p>
        ) : (
          <ul data-testid="sidebar" className="space-y-2">
            {recent.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/brief/${b.id}`}
                  data-testid="recent-brief"
                  className="block rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 hover:border-accent hover:text-white"
                >
                  <span className="line-clamp-2">{b.content.title}</span>
                  <span className="mt-1 block text-xs text-slate-500">{b.model}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

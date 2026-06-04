"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadByok,
  PROVIDER_LABELS,
  PROVIDER_MODELS,
} from "@/lib/brief";

const PROVIDERS = ["anthropic", "openai", "google"] as const;

export default function SettingsPage() {
  const [provider, setProvider] = useState<string>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string>(PROVIDER_MODELS.anthropic[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const b = loadByok();
    if (b && PROVIDER_MODELS[b.provider]) {
      setProvider(b.provider);
      setApiKey(b.apiKey ?? "");
      setModel(b.model || PROVIDER_MODELS[b.provider][0]);
    }
  }, []);

  // When provider changes, snap the model to that provider's default.
  function onProviderChange(next: string) {
    setProvider(next);
    setModel(PROVIDER_MODELS[next][0]);
    setSaved(false);
  }

  function save() {
    window.localStorage.setItem(
      "byok",
      JSON.stringify({ provider, apiKey, model }),
    );
    setSaved(true);
  }

  function clear() {
    window.localStorage.removeItem("byok");
    setProvider("anthropic");
    setApiKey("");
    setModel(PROVIDER_MODELS.anthropic[0]);
    setSaved(false);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings — Bring Your Own Key</h1>
        <p className="mt-1 text-sm text-slate-400">
          Your API key is stored only in this browser&apos;s localStorage and sent directly with
          each generation request. It is never logged or persisted on our server. The demo bills
          your account only — not anyone else&apos;s.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-white/10 bg-panel/60 p-6">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-300">Provider</span>
          <select
            data-testid="provider-select"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="input"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span data-testid="apikey-label" className="text-sm font-medium text-slate-300">
            {PROVIDER_LABELS[provider]} API key
          </span>
          <input
            data-testid="apikey-input"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setSaved(false);
            }}
            placeholder={`Paste your ${PROVIDER_LABELS[provider]} API key`}
            className="input"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-300">Model</span>
          <select
            data-testid="model-select"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setSaved(false);
            }}
            className="input"
          >
            {PROVIDER_MODELS[provider].map((m, i) => (
              <option key={m} value={m}>
                {m}
                {i === 0 ? " (default)" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            data-testid="save-byok"
            onClick={save}
            className="rounded-md bg-gradient-to-r from-accent to-accent2 px-4 py-2 font-medium text-ink"
          >
            Save
          </button>
          <button
            data-testid="clear-byok"
            onClick={clear}
            className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:border-red-400/50 hover:text-red-200"
          >
            Clear
          </button>
          {saved ? <span className="text-sm text-accent2">Saved ✓</span> : null}
        </div>
      </div>

      <Link href="/" className="inline-block text-sm text-accent2 hover:underline">
        ← Back to generator
      </Link>
    </div>
  );
}

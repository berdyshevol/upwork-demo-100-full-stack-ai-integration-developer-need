"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { BriefView } from "@/components/BriefView";
import { getBrief, type Brief } from "@/lib/brief";

export default function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBrief(getBrief(id) ?? null);
    setLoaded(true);
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/" className="inline-block text-sm text-accent2 hover:underline">
        ← Back to generator
      </Link>

      {!loaded ? null : brief ? (
        <div className="rounded-xl border border-white/10 bg-panel/60 p-6">
          <BriefView
            content={brief.content}
            model={brief.model}
            meta={{ topic: brief.topic, tone: brief.tone, audience: brief.audience }}
          />
          <p className="mt-6 text-xs text-slate-500">
            Saved {new Date(brief.createdAt).toLocaleString()} · topic: {brief.topic}
          </p>
        </div>
      ) : (
        <p
          data-testid="brief-missing"
          className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-6 text-slate-300"
        >
          This brief isn&apos;t in this browser. Briefs are stored locally (last 5) — generate one
          from the home page.
        </p>
      )}
    </div>
  );
}

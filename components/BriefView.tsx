import type { BriefContent } from "@/lib/brief";

export function BriefView({
  content,
  model,
  meta,
}: {
  content: BriefContent;
  model?: string;
  meta?: { topic: string; tone: string; audience: string };
}) {
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        {model ? (
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <span className="rounded-full bg-white/10 px-2 py-0.5">
              model: <span data-testid="brief-model" className="text-accent2">{model}</span>
            </span>
            {meta ? (
              <span className="text-slate-500">
                {meta.tone} · for {meta.audience}
              </span>
            ) : null}
          </div>
        ) : null}
        <h1
          data-testid="brief-title"
          className="text-2xl font-semibold leading-tight text-white"
        >
          {content.title}
        </h1>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Target keywords
        </h2>
        <ul className="flex flex-wrap gap-2">
          {content.keywords.map((kw, i) => (
            <li
              key={i}
              data-testid="brief-keyword"
              className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm text-accent2"
            >
              {kw}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Outline
        </h2>
        <ol className="space-y-4">
          {content.outline.map((item, i) => (
            <li key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <h3 data-testid="outline-h2" className="font-semibold text-white">
                H2 · {item.heading}
              </h3>
              <ul className="mt-2 space-y-1 pl-4">
                {item.subpoints.map((sp, j) => (
                  <li
                    key={j}
                    data-testid="outline-h3"
                    className="list-disc text-sm text-slate-300 marker:text-accent"
                  >
                    {sp}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          First-draft intro
        </h2>
        <p
          data-testid="brief-intro"
          className="rounded-lg border border-white/10 bg-white/[0.03] p-4 leading-relaxed text-slate-200"
        >
          {content.draftIntro}
        </p>
      </section>
    </article>
  );
}

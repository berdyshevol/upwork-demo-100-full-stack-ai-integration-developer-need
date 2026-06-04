import { streamObject } from "ai";
import { getModel } from "@/lib/llm";
import {
  BriefContentSchema,
  SYSTEM_PROMPT,
  buildUserPrompt,
  mockBrief,
} from "@/lib/brief";

// better-sqlite3 etc. would need this; we keep it here so any future Node-only
// dependency stays out of the Edge runtime. AI calls themselves are fetch-based.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateBody = {
  topic?: string;
  tone?: string;
  audience?: string;
  provider?: string;
  apiKey?: string;
  model?: string;
};

const encoder = new TextEncoder();

function streamString(text: string): ReadableStream<Uint8Array> {
  // Emit the JSON in small chunks so the client renders it token-by-token.
  const chunks: string[] = [];
  const size = Math.max(4, Math.ceil(text.length / 40));
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));

  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 25));
      }
      controller.close();
    },
  });
}

export async function POST(req: Request) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { topic = "", tone = "", audience = "", provider, apiKey, model = "" } = body;

  if (!provider || !apiKey) {
    return new Response(
      "Missing provider/apiKey. Choose a provider and paste your API key in Settings.",
      { status: 400 },
    );
  }

  if (!topic.trim()) {
    return new Response("Topic is required.", { status: 400 });
  }

  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  };

  // ── Mock provider: deterministic, key-free, used by tests + default demo. ──
  if (provider === "mock") {
    const json = JSON.stringify(mockBrief(topic, tone, audience, model));
    return new Response(streamString(json), { headers });
  }

  // ── Real BYOK provider: stream structured output via the Vercel AI SDK. ──
  try {
    const result = streamObject({
      model: getModel(provider, apiKey, model),
      schema: BriefContentSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(topic, tone, audience),
    });

    // textStream emits the growing JSON text; the client shows it live and
    // parses the final object into typed sections.
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const delta of result.textStream) {
            controller.enqueue(encoder.encode(delta));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return new Response(message, { status: 502 });
  }
}

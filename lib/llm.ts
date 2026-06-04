import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

/**
 * Returns a Vercel AI SDK model instance for the visitor's chosen provider,
 * built from the API key THEY supplied (BYOK). The key is used only for this
 * single request and never persisted or logged server-side.
 *
 * The "mock" provider is handled by the caller (no model needed) so tests and
 * the default no-key state never touch a real LLM.
 */
export function getModel(provider: string, apiKey: string, model: string): LanguageModel {
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(model);
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Each test() block maps to one PRD acceptance criterion (plus BYOK gate edge cases).
// The LLM is stubbed via a "mock" provider seeded into localStorage.byok — no real
// API key is ever required (per BYOK + test constraints).

const MOCK_BYOK = {
  provider: "mock",
  apiKey: "test",
  model: "mock-claude",
};

async function seedMockKey(page: Page) {
  await page.addInitScript((byok) => {
    window.localStorage.setItem("byok", JSON.stringify(byok));
  }, MOCK_BYOK);
}

async function clearKey(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem("byok");
  });
}

async function fillBriefForm(page: Page) {
  await page.getByTestId("topic").fill("Serverless cost optimization");
  await page.getByTestId("tone").fill("Authoritative but friendly");
  await page.getByTestId("audience").fill("Engineering managers at startups");
}

// ── Criterion 1: submitting topic/tone/audience streams a brief token-by-token ──
test("streams a content brief token-by-token after submitting topic/tone/audience", async ({ page }) => {
  await seedMockKey(page);
  await page.goto("/");
  await fillBriefForm(page);

  await page.getByTestId("generate-btn").click();

  // The live streaming region becomes visible while tokens arrive.
  const stream = page.getByTestId("stream");
  await expect(stream).toBeVisible();

  // Tokens accumulate: the streamed text grows over time.
  await expect.poll(async () => (await stream.textContent())?.length ?? 0).toBeGreaterThan(10);

  // And the finished, parsed brief renders its title.
  await expect(page.getByTestId("brief-title")).toBeVisible();
  await expect(page.getByTestId("brief-title")).not.toBeEmpty();
});

// ── Criterion 2: result renders as discrete sections, not a text blob ──
test("renders the brief as discrete sections: title, keywords, outline, intro", async ({ page }) => {
  await seedMockKey(page);
  await page.goto("/");
  await fillBriefForm(page);
  await page.getByTestId("generate-btn").click();

  await expect(page.getByTestId("brief-title")).toBeVisible();

  const keywords = page.getByTestId("brief-keyword");
  await expect(keywords.first()).toBeVisible();
  expect(await keywords.count()).toBeGreaterThan(0);

  const outlineH2 = page.getByTestId("outline-h2");
  await expect(outlineH2.first()).toBeVisible();
  expect(await outlineH2.count()).toBeGreaterThan(0);
  // At least one H3 subpoint exists under the outline.
  await expect(page.getByTestId("outline-h3").first()).toBeVisible();

  await expect(page.getByTestId("brief-intro")).toBeVisible();
  await expect(page.getByTestId("brief-intro")).not.toBeEmpty();
});

// ── Criterion 3: switching the model toggle changes provider, same valid structure ──
test("switching the model toggle changes the provider but returns the same structure", async ({ page }) => {
  await seedMockKey(page);
  await page.goto("/");
  await fillBriefForm(page);

  // Switch the model toggle to the GPT-style provider.
  await page.getByTestId("model-toggle").selectOption("mock-gpt");
  await page.getByTestId("generate-btn").click();

  await expect(page.getByTestId("brief-model")).toHaveText(/mock-gpt/);

  // Same discrete structure still present.
  await expect(page.getByTestId("brief-title")).toBeVisible();
  await expect(page.getByTestId("brief-keyword").first()).toBeVisible();
  await expect(page.getByTestId("outline-h2").first()).toBeVisible();
  await expect(page.getByTestId("brief-intro")).toBeVisible();
});

// ── Criterion 4: a generated brief is saved and reopenable from the sidebar after refresh ──
test("saves a brief to the sidebar and reopens it after a page refresh", async ({ page }) => {
  await seedMockKey(page);
  await page.goto("/");
  await fillBriefForm(page);
  await page.getByTestId("generate-btn").click();
  await expect(page.getByTestId("brief-title")).toBeVisible();

  const savedTitle = await page.getByTestId("brief-title").textContent();

  // Appears in the recent-briefs sidebar.
  const recent = page.getByTestId("recent-brief");
  await expect(recent.first()).toBeVisible();

  // Survives a hard refresh.
  await page.reload();
  await expect(page.getByTestId("recent-brief").first()).toBeVisible();

  // Reopen it from the sidebar → detail route renders the same brief.
  await page.getByTestId("recent-brief").first().click();
  await expect(page).toHaveURL(/\/brief\//);
  await expect(page.getByTestId("brief-title")).toHaveText(savedTitle ?? "");
  await expect(page.getByTestId("brief-intro")).toBeVisible();
});

// ── Criterion 5: README documents the system prompt and the enforced output schema ──
test("README documents the system prompt and the enforced output schema", () => {
  const readme = readFileSync(join(process.cwd(), "README.md"), "utf8").toLowerCase();
  expect(readme).toContain("system prompt");
  // The four enforced schema fields are documented.
  expect(readme).toContain("title");
  expect(readme).toContain("keywords");
  expect(readme).toContain("outline");
  expect(readme).toContain("draftintro");
});

// ── Edge case (BYOK gate): no key → AI feature disabled with the inline hint ──
test("with no API key, AI generation is disabled and shows the BYOK hint", async ({ page }) => {
  await clearKey(page);
  await page.goto("/");

  await expect(page.getByTestId("ai-hint")).toBeVisible();
  await expect(page.getByTestId("ai-hint")).toContainText(/api key in settings/i);
  await expect(page.getByTestId("generate-btn")).toBeDisabled();
});

// ── Edge case (BYOK gate): the Settings UI persists provider/key/model to localStorage ──
test("Settings persists provider, key and model to localStorage under 'byok'", async ({ page }) => {
  await clearKey(page);
  await page.goto("/settings");

  await page.getByTestId("provider-select").selectOption("openai");
  // Label tracks the selected provider.
  await expect(page.getByTestId("apikey-label")).toContainText(/openai/i);

  await page.getByTestId("apikey-input").fill("sk-test-123");
  await page.getByTestId("model-select").selectOption("gpt-4o");
  await page.getByTestId("save-byok").click();

  const stored = await page.evaluate(() => window.localStorage.getItem("byok"));
  expect(stored).not.toBeNull();
  const parsed = JSON.parse(stored as string);
  expect(parsed).toMatchObject({ provider: "openai", apiKey: "sk-test-123", model: "gpt-4o" });

  // Clear wipes it.
  await page.getByTestId("clear-byok").click();
  const afterClear = await page.evaluate(() => window.localStorage.getItem("byok"));
  expect(afterClear).toBeNull();
});

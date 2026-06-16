import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("profile site includes the compact blue portfolio structure", () => {
  const html = read("index.html");
  const css = read("styles.css");

  assert.match(html, /Personal AI portfolio/);
  assert.match(html, /Verneri Sirva/);
  assert.match(html, /class="brand-mark" aria-label="VS logo"/);
  assert.match(html, />VS</);
  assert.match(html, /I build AI systems, tools, automation, and workflows that take real work off people's plates/);
  assert.match(html, /class="profile-panel"/);
  assert.match(html, /class="profile-avatar"/);
  assert.match(html, /src="assets\/verneri-profile\.jpg"/);
  assert.match(html, /alt="Portrait of Verneri Sirva"/);
  assert.match(css, /--bg: #f6f8fc/);
  assert.match(css, /--accent: #0284c7/);
  assert.doesNotMatch(html, /AI consultant, builder, and writer at HiQ/);

  for (const id of ["about", "writing", "links"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  const sections = html.match(/<section\b/g) ?? [];
  assert.equal(sections.length, 4);

  for (const label of ["Substack", "LinkedIn", "GitHub", "Hugging Face"]) {
    assert.match(html, new RegExp(`>${label}<`));
  }

  assert.match(html, /https:\/\/huggingface\.co\/datasets\/vennu95/);

  const projectCards = html.match(/class="project-card"/g) ?? [];
  assert.equal(projectCards.length, 0);
  assert.doesNotMatch(html, /id="projects"|InvestmentAgent|Hilla assistant system|signal-panel/);

  assert.match(html, /Latest writing/);
  assert.match(html, /https:\/\/verneri\.substack\.com/);
  assert.match(html, /https:\/\/github\.com\/vernerisirva/);
  assert.match(html, /https:\/\/www\.linkedin\.com\/in\/vernerisirva\//);
  assert.match(html, /mailto:verneri\.sirva@hiq\.se/);
  assert.doesNotMatch(html, /your-profile|your\.email@example\.com/);
  assert.match(html, /Where companies can use autonomous research workflows today/);
  assert.match(html, /Enterprise AI is Becoming Workflow Infrastructure/);
  const postCards = html.match(/class="post-card"/g) ?? [];
  assert.equal(postCards.length, 3);
  assert.doesNotMatch(html, /Start a conversation|Want to explore where AI could create value/i);
});

test("profile site includes assets and no accidental filler", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("script.js");
  const combined = `${html}\n${css}\n${js}`;

  assert.match(html, /href="styles\.css(?:\?[^"]+)??"/);
  assert.match(html, /src="script\.js"/);
  assert.doesNotMatch(combined, /TODO|TBD|lorem|undefined/i);
});

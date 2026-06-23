import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("profile site includes the compact blue portfolio structure", () => {
  const html = read("index.html");
  const css = read("styles.css");

  assert.match(html, /AI &amp; ML developer/);
  assert.doesNotMatch(html, /Practical AI|practical AI/);
  assert.match(html, /Verneri Sirva/);
  assert.match(html, /class="brand-mark" aria-label="VS logo"/);
  assert.match(html, />VS</);
  assert.doesNotMatch(html, /AI systems &amp; software/);
  assert.match(html, /I work with AI, machine learning, and backend systems,\s+with a focus on reliable software around models and data/);
  assert.match(html, /Machine learning, AI systems, and backend engineering/);
  assert.doesNotMatch(html, /Machine learning, AI systems, and software/);
  assert.doesNotMatch(html, /I also write about what I learn/);
  assert.doesNotMatch(html, /Longer notes on AI, prototypes, and software work/);
  assert.doesNotMatch(html, /AI workflows and agents/);
  assert.doesNotMatch(html, /I build agentic workflows and the backend services that support them/);
  assert.doesNotMatch(html, /From prototypes to production/);
  assert.doesNotMatch(html, /I work on AI workflows, agent systems, and the backend software\s+needed to make them useful/);
  assert.doesNotMatch(html, /AI systems and workflows/);
  assert.doesNotMatch(html, /make software work more\s+useful/);
  assert.doesNotMatch(html, /I work with AI systems, automation, and backend software through\s+HiQ/);
  assert.match(html, /AI, ML, and backend engineering/);
  assert.match(html, /Notes on AI systems, model evaluation, and engineering work/);
  assert.match(html, /Technical writing and code/);
  assert.doesNotMatch(html, /Where the longer trail lives/);
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
  assert.match(html, /Professional interests/);
  assert.match(html, /class="about-copy"/);
  assert.match(css, /\.about-copy/);
  assert.match(css, /align-self: start/);
  assert.match(css, /padding: 56px 0 56px/);
  assert.match(html, /Agentic memory/);
  assert.match(html, /Deep research/);
  assert.match(html, /Personal interests/);
  assert.match(html, /Golf/);
  assert.match(html, /Gym/);
  assert.match(html, /Motorsport/);
  assert.match(html, /Dogs/);

  const projectCards = html.match(/class="project-card"/g) ?? [];
  assert.equal(projectCards.length, 0);
  assert.doesNotMatch(html, /id="projects"|InvestmentAgent|Hilla assistant system|signal-panel/);

  assert.match(html, /Latest writing/);
  assert.match(html, /https:\/\/verneri\.substack\.com/);
  assert.match(html, /https:\/\/github\.com\/vernerisirva/);
  assert.match(html, /https:\/\/www\.linkedin\.com\/in\/vernerisirva\//);
  assert.match(html, /mailto:verneri\.sirva@hiq\.se/);
  assert.doesNotMatch(html, /tel:|\+46 70|Available for new engagements|Open to assignments|cut costs|save time|Contact me/);
  assert.doesNotMatch(html, /your-profile|your\.email@example\.com/);
  assert.match(html, /How companies should evaluate Chinese and open-weight AI models/);
  assert.match(html, /Where companies can use autonomous research workflows today/);
  assert.match(html, /Enterprise AI is Becoming Workflow Infrastructure/);
  assert.doesNotMatch(html, /Eight things I’ve learned by 30/);
  const postCards = html.match(/class="post-card"/g) ?? [];
  assert.equal(postCards.length, 3);
  assert.doesNotMatch(html, /Start a conversation|Want to explore where AI could create value/i);
});

test("profile site includes assets and no accidental filler", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("script.js");
  const combined = `${html}\n${css}\n${js}`;

  assert.match(html, /href="styles\.css\?v=layout1"/);
  assert.match(html, /src="script\.js"/);
  assert.doesNotMatch(combined, /TODO|TBD|lorem|undefined/i);
});

test("Substack updater replaces the latest writing cards from an RSS feed", () => {
  const tmp = mkdtempSync(join(tmpdir(), "personalprofile-"));
  const tempIndex = join(tmp, "index.html");

  try {
    writeFileSync(tempIndex, read("index.html"));

    execFileSync("python3", [
      "scripts/update_substack_posts.py",
      "--feed-file",
      "tests/fixtures/substack-feed.xml",
      "--index",
      tempIndex,
    ]);

    const html = readFileSync(tempIndex, "utf8");
    assert.match(html, /<!-- latest-posts:start -->/);
    assert.match(html, /<!-- latest-posts:end -->/);
    assert.match(html, /Newest AI systems note/);
    assert.match(html, /Second practical workflow note/);
    assert.match(html, /Short summary for the second post with extra words/);
    assert.doesNotMatch(html, /once the updater keeps summaries compact/);
    assert.match(html, /Third model governance note/);
    assert.doesNotMatch(html, /Fourth older note/);

    const postCards = html.match(/class="post-card"/g) ?? [];
    assert.equal(postCards.length, 3);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("Substack updater can use the Substack archive JSON API", () => {
  const tmp = mkdtempSync(join(tmpdir(), "personalprofile-"));
  const tempIndex = join(tmp, "index.html");

  try {
    writeFileSync(tempIndex, read("index.html"));

    execFileSync("python3", [
      "scripts/update_substack_posts.py",
      "--archive-file",
      "tests/fixtures/substack-archive.json",
      "--index",
      tempIndex,
    ]);

    const html = readFileSync(tempIndex, "utf8");
    assert.match(html, /Newest archive post/);
    assert.match(html, /Second archive post/);
    assert.match(html, /Archive summaries are shorter and already plain text/);
    assert.doesNotMatch(html, /keeps the layout tidy and calm/);
    assert.match(html, /Third archive post/);
    assert.doesNotMatch(html, /Fourth older archive post/);

    const postCards = html.match(/class="post-card"/g) ?? [];
    assert.equal(postCards.length, 3);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("Substack updater can use the RSS proxy JSON source", () => {
  const tmp = mkdtempSync(join(tmpdir(), "personalprofile-"));
  const tempIndex = join(tmp, "index.html");

  try {
    writeFileSync(tempIndex, read("index.html"));

    execFileSync("python3", [
      "scripts/update_substack_posts.py",
      "--proxy-file",
      "tests/fixtures/substack-rss2json.json",
      "--index",
      tempIndex,
    ]);

    const html = readFileSync(tempIndex, "utf8");
    assert.match(html, /Newest proxy post/);
    assert.match(html, /Second proxy post/);
    assert.match(html, /Proxy summaries with R&amp;D should decode correctly/);
    assert.doesNotMatch(html, /R&amp;amp;D/);
    assert.doesNotMatch(html, /keeps the layout tidy and calm/);
    assert.match(html, /Third proxy post/);
    assert.doesNotMatch(html, /Fourth older proxy post/);

    const postCards = html.match(/class="post-card"/g) ?? [];
    assert.equal(postCards.length, 3);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("GitHub Action refreshes Substack posts automatically", () => {
  const workflow = read(".github/workflows/update-substack-posts.yml");
  const updater = read("scripts/update_substack_posts.py");

  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /scripts\/update_substack_posts\.py/);
  assert.doesNotMatch(workflow, /pip install curl_cffi/);
  assert.doesNotMatch(workflow, /curl -fsSL https:\/\/verneri\.substack\.com\/feed/);
  assert.match(updater, /api\/v1\/archive/);
  assert.match(updater, /api\.rss2json\.com/);
  assert.match(updater, /User-Agent/);
  assert.match(updater, /Accept/);
  assert.match(updater, /ssl\.create_default_context/);
  assert.doesNotMatch(updater, /curl_cffi/);
  assert.doesNotMatch(updater, /impersonate="chrome"/);
  assert.match(workflow, /node --test tests\/site\.test\.mjs/);
  assert.match(workflow, /git commit/);
});

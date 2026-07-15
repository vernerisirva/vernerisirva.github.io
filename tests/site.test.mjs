import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("profile site presents Verneri's current identity and portfolio structure", () => {
  const html = read("index.html");

  assert.match(html, /<h1>Verneri Sirva<\/h1>/);
  assert.match(html, /<p class="eyebrow">AI systems developer<\/p>/);
  assert.match(html, /I work with AI systems, research, and backend engineering,\s+with a focus on reliable software around models and data/);
  assert.match(html, /Consultant at HiQ/);
  assert.match(html, /Working with AI systems and software at HiQ/);
  assert.match(html, /applying AI to R&amp;D work/);
  assert.match(html, /MSc in Computer Science\s+\(Machine Learning, soon\)/);
  assert.match(html, /MSc Economics &middot; MSc Computer Science \(soon\)/);
  assert.match(html, /Agentic memory research/);
  assert.match(html, /Current research with/);
  assert.match(html, /https:\/\/www\.olaresearch\.org\//);
  assert.match(html, /https:\/\/github\.com\/OLAResearch/);
  assert.match(html, /Professional interests/);
  assert.match(html, /Agentic memory &middot; Deep research/);
  assert.match(html, /Personal interests/);
  assert.match(html, /Golf &middot; Gym &middot; Motorsport &middot; Dogs/);

  for (const id of ["about", "writing", "links"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  const sections = html.match(/<section\b/g) ?? [];
  assert.equal(sections.length, 4);

  for (const label of ["Substack", "LinkedIn", "GitHub", "Hugging Face", "Email"]) {
    assert.match(html, new RegExp(`>${label}<`));
  }

  const projectCards = html.match(/class="project-card"/g) ?? [];
  assert.equal(projectCards.length, 0);

  const latestBlock = html.match(/<!-- latest-posts:start -->([\s\S]*?)<!-- latest-posts:end -->/)?.[1] ?? "";
  assert.match(latestBlock, /href="https:\/\/verneri\.substack\.com\/p\//);
  assert.match(latestBlock, /<strong>[^<]+<\/strong>/);
  assert.match(latestBlock, /<small>[^<]+<\/small>/);
  const postCards = html.match(/class="post-card"/g) ?? [];
  assert.equal(postCards.length, 3);
  assert.doesNotMatch(html, /Available for new engagements|Open to assignments|cut costs|save time|Contact me/i);
});

test("profile site includes accessibility, responsive image, and sharing contracts", () => {
  const html = read("index.html");
  const css = read("styles.css");

  assert.match(html, /<html lang="en">/);
  assert.match(html, /class="skip-link" href="#main"/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /aria-label="VS, Verneri Sirva, back to top"/);
  assert.match(html, /class="brand-mark" aria-hidden="true"/);
  assert.match(html, /class="brand-dog"/);
  assert.match(html, /src="assets\/verneri-flatcoat-avatar\.webp"/);
  assert.match(html, /<h2 class="eyebrow">Links<\/h2>/);
  assert.match(css, /outline: 3px solid var\(--accent-strong\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /scroll-margin-top: 88px/);
  assert.match(css, /width: min\(100%, 420px\)/);
  assert.match(css, /@media \(max-width: 340px\)/);

  assert.match(html, /assets\/verneri-profile-320\.webp 320w/);
  assert.match(html, /assets\/verneri-profile-640\.webp 640w/);
  assert.match(html, /sizes="\(max-width: 640px\) 160px, 220px"/);
  assert.match(html, /src="assets\/verneri-profile\.jpg"/);
  assert.match(html, /alt="Portrait of Verneri Sirva"/);
  assert.ok(existsSync(new URL("../assets/verneri-profile-320.webp", import.meta.url)));
  assert.ok(existsSync(new URL("../assets/verneri-profile-640.webp", import.meta.url)));

  assert.match(html, /<title>Verneri Sirva \| AI systems developer<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/vernerisirva\.github\.io\/"/);
  assert.match(html, /property="og:image"\s+content="https:\/\/vernerisirva\.github\.io\/assets\/verneri-social-card\.jpg"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="twitter:image"/);
  assert.ok(existsSync(new URL("../assets/verneri-social-card.jpg", import.meta.url)));
});

test("profile site includes assets and no accidental filler", () => {
  const html = read("index.html");
  const css = read("styles.css");
  const js = read("script.js");
  const socialCard = read("assets/verneri-social-card.svg");
  const combined = `${html}\n${css}\n${js}\n${socialCard}`;

  assert.match(html, /href="styles\.css\?v=[^"]+"/);
  assert.match(html, /src="script\.js"/);
  assert.match(html, /href="assets\/favicon\.png" type="image\/png"/);
  assert.ok(existsSync(new URL("../assets/favicon.png", import.meta.url)));
  assert.ok(existsSync(new URL("../assets/verneri-flatcoat-avatar.webp", import.meta.url)));
  assert.match(socialCard, /width="1200" height="630"/);
  assert.match(socialCard, /href="verneri-flatcoat-avatar\.webp"/);
  assert.match(socialCard, /href="verneri-profile\.jpg"/);
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

# AI Consultant Profile Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, customer-facing one-page static website for an AI consultant at HiQ.

**Architecture:** The site is a static HTML/CSS/JS implementation that can be opened directly from disk. Content is business-first, with links to Substack, LinkedIn, and GitHub as supporting credibility signals.

**Tech Stack:** HTML, CSS, vanilla JavaScript.

---

## File Structure

- Create: `index.html` for page structure and content.
- Create: `styles.css` for responsive layout, typography, and component styling.
- Create: `script.js` for active navigation state and small browser enhancements.
- Keep: `docs/superpowers/specs/2026-06-13-ai-consultant-profile-design.md` as the design record.

### Task 1: Static Page Content

**Files:**
- Create: `index.html`

- [ ] **Step 1: Add semantic page sections**

Create `index.html` with a header, main content sections, and footer. Include sections for hero, credibility, how I help, process, projects, writing, technical proof, and contact.

- [ ] **Step 2: Add customer-facing copy**

Use the approved positioning: "I help business and operations leaders identify practical AI opportunities, validate them through prototypes, and turn promising ideas into clear next steps."

- [ ] **Step 3: Add editable external links**

Use clear link labels for Substack, LinkedIn, GitHub, and contact. Use placeholder `href` values that can be replaced with real URLs.

### Task 2: Visual Design

**Files:**
- Create: `styles.css`

- [ ] **Step 1: Add responsive base styles**

Set global typography, colors, spacing, and layout constraints.

- [ ] **Step 2: Style sections and cards**

Create polished layouts for project cards, help items, writing links, and contact calls to action.

- [ ] **Step 3: Add mobile responsive behavior**

Ensure navigation, hero content, cards, and link groups wrap cleanly on small screens.

### Task 3: Browser Enhancements

**Files:**
- Create: `script.js`

- [ ] **Step 1: Add active section navigation**

Use `IntersectionObserver` to highlight the current nav link as the user scrolls.

- [ ] **Step 2: Add current year**

Set the footer year dynamically when JavaScript is available.

### Task 4: Verification

**Files:**
- Verify: `index.html`
- Verify: `styles.css`
- Verify: `script.js`

- [ ] **Step 1: Run a local static server**

Run `python3 -m http.server 4173` from the workspace root.

- [ ] **Step 2: Open in browser**

Open `http://localhost:4173` and confirm the page renders, scrolls, and responds correctly.

- [ ] **Step 3: Check source files**

Run `rg "TODO|TBD|lorem|undefined" index.html styles.css script.js` and remove any accidental unfinished text. Intentional placeholder URLs are allowed only if visible labels make them easy to replace.

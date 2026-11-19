import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "../../..");
const releasesDir = path.join(root, "releases");
const latestRelease = fs
  .readdirSync(releasesDir)
  .filter((name) => name.startsWith("manual-production-dashboard-completion-"))
  .sort()
  .pop();

if (!latestRelease) {
  throw new Error("No manual-production-dashboard-completion-* release found in releases/.");
}

const webroot = path.join(releasesDir, latestRelease, "dist");
const server = http.createServer((req, res) => {
  const urlPath = new URL(req.url, "http://127.0.0.1:5179").pathname;
  if (urlPath === "/staff-api/v1/session") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        data: {
          user: null,
          csrfToken: "a11y-audit-csrf",
          serverTime: new Date().toISOString(),
        },
        requestId: "a11y-audit",
        serverTime: new Date().toISOString(),
      }),
    );
    return;
  }

  let filePath = path.join(webroot, urlPath === "/" ? "index.html" : urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(webroot, "ceo", "index.html");
  }

  const ext = path.extname(filePath);
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".ttf": "font/ttf",
    ".svg": "image/svg+xml",
  }[ext] || "application/octet-stream";

  res.writeHead(200, { "Content-Type": mime });
  res.end(fs.readFileSync(filePath));
});

await new Promise((resolve) => server.listen(5179, "127.0.0.1", resolve));

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleIssues = [];
  page.on("pageerror", (e) => consoleIssues.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleIssues.push(`console.error: ${msg.text()}`);
  });

  await page.goto("http://127.0.0.1:5179/ceo/", { waitUntil: "networkidle" });
  await page.locator("#staff-login-username").waitFor();

  // Confirm no Google Sign-In button
  const googleBtnCount = await page.locator('[data-testid="staff-google-signin-btn"]').count();
  assert.equal(googleBtnCount, 0, "Google Sign-In button must not be rendered");

  // Snippet 1: Find Orphaned Form Inputs
  const orphanedInputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("input, select, textarea"))
      .filter((i) => {
        const hasId = i.id && document.querySelector(`label[for="${i.id}"]`);
        const hasAria =
          i.getAttribute("aria-label") || i.getAttribute("aria-labelledby");
        return !hasId && !hasAria && !i.closest("label");
      })
      .map((i) => ({
        tag: i.tagName,
        id: i.id,
        name: i.name,
        placeholder: i.placeholder,
      })),
  );
  assert.deepEqual(orphanedInputs, [], `Orphaned inputs found: ${JSON.stringify(orphanedInputs)}`);

  // Snippet 2: Measure Tap Target Size on interactive controls
  const tapTargets = await page.evaluate(() => {
    const els = Array.from(
      document.querySelectorAll("button, input:not([type='checkbox']), .remember-label"),
    );
    return els.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        className: el.className,
        text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });
  });

  // Snippet 3: Check Color Contrast on key login text/buttons
  const contrastResults = await page.evaluate(() => {
    function getRGB(colorStr) {
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match
        ? [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)]
        : [255, 255, 255];
    }
    function luminance(r, g, b) {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }
    const check = (selector, fallbackBg) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const style = window.getComputedStyle(el);
      const fg = getRGB(style.color);
      const bgParsed = style.backgroundColor.includes("rgba(0, 0, 0, 0)")
        ? getRGB(fallbackBg)
        : getRGB(style.backgroundColor);
      const l1 = luminance(fg[0], fg[1], fg[2]);
      const l2 = luminance(bgParsed[0], bgParsed[1], bgParsed[2]);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      return { selector, color: style.color, contrastRatio: Number(ratio.toFixed(2)) };
    };
    return [
      check(".login-card h1", "rgb(2, 14, 58)"),
      check(".forgot-link-btn", "rgb(2, 14, 58)"),
      check(".login-contact-admin-btn", "rgb(2, 14, 58)"),
      check(".login-card button.button.full:not(.secondary)", "rgb(255, 255, 255)"),
    ].filter(Boolean);
  });

  // Snippet 4: Global Page Checks
  const globalChecks = await page.evaluate(() => ({
    lang: document.documentElement.lang || "MISSING",
    title: document.title || "MISSING",
    viewport: document.querySelector('meta[name="viewport"]')?.content || "MISSING",
    h1Count: document.querySelectorAll("h1").length,
  }));
  assert.notEqual(globalChecks.lang, "MISSING");
  assert.notEqual(globalChecks.title, "MISSING");
  assert.equal(globalChecks.h1Count, 1);

  // Keyboard Tab navigation & Forgot Password panel
  await page.keyboard.press("Tab");
  const focusedSequence = [];
  for (let i = 0; i < 7; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? `${el.tagName.toLowerCase()}#${el.id || el.className}` : "none";
    });
    focusedSequence.push(info);
    await page.keyboard.press("Tab");
  }

  await page.locator(".forgot-link-btn").click();
  await page.locator('[data-testid="login-forgot-panel"]').waitFor();
  const forgotText = await page.locator('[data-testid="login-forgot-panel"]').textContent();
  assert.match(forgotText || "", /CEO or Admin/i);

  const ariaTree = await page.locator("main.login-card").ariaSnapshot();

  assert.deepEqual(consoleIssues, [], `Console errors: ${consoleIssues.join("; ")}`);

  console.log(
    JSON.stringify(
      {
        release: latestRelease,
        orphanedInputs,
        tapTargets,
        contrastResults,
        globalChecks,
        focusedSequence,
        ariaTreePreview: ariaTree.split("\n").slice(0, 15).join("\n"),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

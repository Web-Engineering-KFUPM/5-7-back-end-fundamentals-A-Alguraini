#!/usr/bin/env node
/**
 * Lab 5-7-back-end-fundamentals — Autograder (grade.cjs)
 *
 * Scoring:
 * - Tasks total: 80 (full marks awarded when a valid submission exists)
 * - Submission: 20 (on-time=20, late=10, missing/empty server.js=0)
 * - Total: 100
 *
 * Due date: 11/03/2025 11:59 PM Riyadh (UTC+03:00)
 *
 * IMPORTANT (late check):
 * - We grade lateness using the latest *student-work* commit:
 *   - Excludes bot/workflow commits by author/message signals
 *   - Excludes commits that ONLY modify autograder/workflow files
 *
 * Status codes:
 * - 0 = on time
 * - 1 = late
 * - 2 = no submission OR empty server.js
 *
 * Outputs:
 * - artifacts/grade.csv  (structure unchanged)
 * - artifacts/feedback/README.md
 * - GitHub Actions Step Summary (GITHUB_STEP_SUMMARY)
 *
 * NOTE: In your workflow, make sure checkout uses full history:
 *   uses: actions/checkout@v4
 *   with: { fetch-depth: 0 }
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execSync } = require("child_process");

const LAB_NAME = "5-7-back-end-fundamentals";

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

/** Due date: 11/03/2025 11:59 PM Riyadh (UTC+03:00) */
const DUE_ISO = "2025-11-03T23:59:00+03:00";
const DUE_EPOCH_MS = Date.parse(DUE_ISO);

/** Lab-required submission file */
const REQUIRED_SERVER_PATH = path.join(
  "5-7-back-end-fundamentals",
  "backend",
  "server.js"
);

/** ---------- Student ID ---------- */
function getStudentId() {
  const repoFull = process.env.GITHUB_REPOSITORY || ""; // org/repo
  const repoName = repoFull.includes("/") ? repoFull.split("/")[1] : repoFull;
  const fromRepoSuffix =
    repoName && repoName.includes("-")
      ? repoName.split("-").slice(-1)[0]
      : "";
  return (
    process.env.STUDENT_USERNAME ||
    fromRepoSuffix ||
    process.env.GITHUB_ACTOR ||
    repoName ||
    "student"
  );
}

/** ---------- Git helpers: latest *student-work* commit time ---------- */
const BOT_SIGNALS = [
  "[bot]",
  "github-actions",
  "actions@github.com",
  "github classroom",
  "classroom[bot]",
  "dependabot",
  "autograding",
  "workflow",
  "grader",
  "autograder",
];

const IGNORED_FILE_PREFIXES = [
  ".github/workflows/",
  "artifacts/",
  "node_modules/",
];

const IGNORED_FILES_EXACT = new Set([
  "grade.cjs",
  "package.json",
  "package-lock.json",
  "grade.yml",
  ".gitignore",
]);

function looksLikeBotCommit(hayLower) {
  return BOT_SIGNALS.some((s) => hayLower.includes(s));
}

function isIgnoredPath(p) {
  if (!p) return true;
  if (IGNORED_FILES_EXACT.has(p)) return true;
  return IGNORED_FILE_PREFIXES.some((pre) => p.startsWith(pre));
}

function getChangedFilesForCommit(sha) {
  try {
    const out = execSync(`git diff-tree --no-commit-id --name-only -r ${sha}`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (!out) return [];
    return out
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getHeadCommitInfo() {
  try {
    const out = execSync("git log -1 --format=%H|%ct|%an|%ae|%s", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    if (!out) return null;

    const [sha, ct, an, ae, ...subjParts] = out.split("|");
    const seconds = Number(ct);
    const epochMs = Number.isFinite(seconds) ? seconds * 1000 : null;

    return {
      sha: sha || "unknown",
      epochMs,
      iso: epochMs ? new Date(epochMs).toISOString() : "unknown",
      author: an || "unknown",
      email: ae || "unknown",
      subject: subjParts.join("|") || "",
    };
  } catch {
    return null;
  }
}

function getLatestStudentWorkCommitInfo() {
  // Returns: { epochMs, iso, sha, author, email, subject, note }
  try {
    const out = execSync("git log --format=%H|%ct|%an|%ae|%s -n 800", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    if (!out) {
      return {
        epochMs: null,
        iso: "unknown",
        sha: "unknown",
        author: "unknown",
        email: "unknown",
        subject: "",
        note: "git log returned no commits",
      };
    }

    const lines = out.split("\n");
    for (const line of lines) {
      const parts = line.split("|");
      const sha = parts[0] || "";
      const ct = parts[1] || "";
      const an = parts[2] || "";
      const ae = parts[3] || "";
      const subject = parts.slice(4).join("|") || "";

      const hay = `${an} ${ae} ${subject}`.toLowerCase();
      if (looksLikeBotCommit(hay)) continue;

      // Exclude commits that ONLY touch autograder/workflow infra
      const changed = getChangedFilesForCommit(sha);
      if (changed.length > 0) {
        const hasStudentWorkChange = changed.some((f) => !isIgnoredPath(f));
        if (!hasStudentWorkChange) continue;
      }

      const seconds = Number(ct);
      if (!Number.isFinite(seconds)) continue;

      const epochMs = seconds * 1000;
      return {
        epochMs,
        iso: new Date(epochMs).toISOString(),
        sha: sha || "unknown",
        author: an || "unknown",
        email: ae || "unknown",
        subject,
        note: "selected latest non-bot commit that changes student work (ignores grader-only commits)",
      };
    }

    // Fallback to HEAD (best effort)
    const head = getHeadCommitInfo();
    return {
      epochMs: head ? head.epochMs : null,
      iso: head ? head.iso : "unknown",
      sha: head ? head.sha : "unknown",
      author: head ? head.author : "unknown",
      email: head ? head.email : "unknown",
      subject: head ? head.subject : "",
      note: "fallback to HEAD (no student-work commit detected)",
    };
  } catch (e) {
    return {
      epochMs: null,
      iso: "unknown",
      sha: "unknown",
      author: "unknown",
      email: "unknown",
      subject: "",
      note: `git inspection failed: ${String(e)}`,
    };
  }
}

function wasSubmittedLate(commitEpochMs) {
  if (!commitEpochMs) return false; // best-effort: don't penalize on unknown
  return commitEpochMs > DUE_EPOCH_MS;
}

/** ---------- File helpers ---------- */
function readTextSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function stripJsComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}
function compactWs(s) {
  return s.replace(/\s+/g, " ").trim();
}
function isEmptyCode(code) {
  const stripped = compactWs(stripJsComments(code));
  return stripped.length < 10;
}

/** ---------- VM helpers (DO NOT crash on SyntaxError) ---------- */
function canCompileInVm(studentCode) {
  try {
    new vm.Script(`(function(){ ${studentCode} })();`);
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: String(e && e.stack ? e.stack : e) };
  }
}
function runInSandbox(studentCode, { postlude = "" } = {}) {
  const logs = [];
  const context = {
    console: {
      log: (...args) => logs.push(args.map((a) => String(a)).join(" ")),
      warn: (...args) => logs.push(args.map((a) => String(a)).join(" ")),
      error: (...args) => logs.push(args.map((a) => String(a)).join(" ")),
    },
    globalThis: {},
    __RUNTIME_ERROR__: null,
  };
  context.globalThis = context;

  const wrapped = `
    (function(){
      "use strict";
      try {
        ${studentCode}
        ${postlude}
      } catch (e) {
        globalThis.__RUNTIME_ERROR__ = (e && e.stack) ? String(e.stack) : String(e);
      }
    })();
  `;

  try {
    const script = new vm.Script(wrapped);
    const ctx = vm.createContext(context);
    script.runInContext(ctx, { timeout: 800 });
  } catch (e) {
    context.__RUNTIME_ERROR__ = String(e && e.stack ? e.stack : e);
  }

  return {
    logs,
    runtimeError: context.__RUNTIME_ERROR__ || null,
  };
}

/** ---------- Requirement helpers ---------- */
function req(label, ok, detailIfFail = "") {
  return { label, ok: !!ok, detailIfFail };
}
function formatReqs(reqs) {
  const lines = [];
  for (const r of reqs) {
    if (r.ok) lines.push(`- ✅ ${r.label}`);
    else lines.push(`- ❌ ${r.label}${r.detailIfFail ? ` — ${r.detailIfFail}` : ""}`);
  }
  return lines;
}

/** ---------- Locate submission: server.js at required path ---------- */
const studentId = getStudentId();
const serverPath = REQUIRED_SERVER_PATH;
const hasServer = fs.existsSync(serverPath) && fs.statSync(serverPath).isFile();
const serverCode = hasServer ? readTextSafe(serverPath) : "";
const serverEmpty = hasServer ? isEmptyCode(serverCode) : true;

const fileNote = hasServer
  ? serverEmpty
    ? `⚠️ Found \`${serverPath}\` but it appears empty (or only comments).`
    : `✅ Found \`${serverPath}\`.`
  : `❌ Required file not found: \`${serverPath}\`.`;

/** ---------- Submission time + status ---------- */
const commitInfo = getLatestStudentWorkCommitInfo();
const headInfo = getHeadCommitInfo();

const late = hasServer && !serverEmpty ? wasSubmittedLate(commitInfo.epochMs) : false;

let status = 0;
if (!hasServer || serverEmpty) status = 2;
else status = late ? 1 : 0;

const submissionMarks = status === 2 ? 0 : status === 1 ? 10 : 20;

const submissionStatusText =
  status === 2
    ? "No submission detected (missing/empty server.js): submission marks = 0/20."
    : status === 1
      ? `Late submission via latest *student-work* commit: 10/20. (commit: ${commitInfo.sha} @ ${commitInfo.iso})`
      : `On-time submission via latest *student-work* commit: 20/20. (commit: ${commitInfo.sha} @ ${commitInfo.iso})`;

/** ---------- Optional dynamic run (only if compiles) ---------- */
let runGeneral = null;
let compileError = null;

if (hasServer && !serverEmpty) {
  const cc = canCompileInVm(serverCode);
  if (!cc.ok) compileError = cc.error;
  else runGeneral = runInSandbox(serverCode);
}

/** ---------- Tasks (2 tasks, 40 each = 80) ---------- */
const tasks = [
  { id: "Task 1", name: "Data flow understanding notes (backend route + frontend fetch)", marks: 40 },
  { id: "Task 2", name: "Back-end fundamentals requirements", marks: 40 },
];

/**
 * Task grading rule:
 * - If status === 2 (missing/empty server.js): tasks = 0
 * - Otherwise: full marks for both tasks (80/80)
 * Feedback checklist stays ✅ when submission exists.
 */
let earnedTasks = 0;

const taskResults = tasks.map((t) => {
  if (status === 2) {
    const reqs = [req("No submission / empty server.js → cannot grade tasks", false)];
    return { id: t.id, name: t.name, earned: 0, max: t.marks, reqs };
  }
  const reqs = [req("Completed", true)];
  earnedTasks += t.marks;
  return { id: t.id, name: t.name, earned: t.marks, max: t.marks, reqs };
});

const totalEarned = Math.min(earnedTasks + submissionMarks, 100);

/** ---------- Build Summary ---------- */
const now = new Date().toISOString();

let summary = `# Lab | ${LAB_NAME} | Autograding Summary

- Student: \`${studentId}\`
- ${fileNote}
- ${submissionStatusText}
- Due (Riyadh): \`${DUE_ISO}\`

- Repo HEAD commit:
  - SHA: \`${headInfo ? headInfo.sha : "unknown"}\`
  - Author: \`${headInfo ? headInfo.author : "unknown"}\` <${headInfo ? headInfo.email : "unknown"}>
  - Time (UTC ISO): \`${headInfo ? headInfo.iso : "unknown"}\`

- Chosen commit for submission timing:
  - SHA: \`${commitInfo.sha}\`
  - Author: \`${commitInfo.author}\` <${commitInfo.email}>
  - Time (UTC ISO): \`${commitInfo.iso}\`
  - Note: ${commitInfo.note}

- Status: **${status}** (0=on time, 1=late, 2=no submission/empty)
- Run: \`${now}\`

## Marks Breakdown

| Item | Marks |
|------|------:|
`;

for (const tr of taskResults) {
  summary += `| ${tr.id}: ${tr.name} | ${tr.earned}/${tr.max} |\n`;
}
summary += `| Submission | ${submissionMarks}/20 |\n`;

summary += `
## Total Marks

**${totalEarned} / 100**

## Detailed Feedback
`;

for (const tr of taskResults) {
  summary += `\n### ${tr.id}: ${tr.name}\n`;
  summary += formatReqs(tr.reqs).join("\n") + "\n";
}

if (compileError) {
  summary += `\n---\n⚠️ **SyntaxError: code could not compile.** Dynamic checks were skipped.\n\n\`\`\`\n${compileError}\n\`\`\`\n`;
} else if (runGeneral && runGeneral.runtimeError) {
  summary += `\n---\n⚠️ **Runtime error detected (best-effort captured):**\n\n\`\`\`\n${runGeneral.runtimeError}\n\`\`\`\n`;
}

/** ---------- Write outputs ---------- */
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

/** DO NOT change CSV structure */
const csv = `student_username,obtained_marks,total_marks,status
${studentId},${totalEarned},100,${status}
`;

fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), summary);

console.log(`✔ Lab graded: ${totalEarned}/100 (status=${status})`);

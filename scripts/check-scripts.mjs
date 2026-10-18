// Syntax-checks every <script> in index.html, including the tools that are
// embedded in it as text/plain. A single syntax error stops that whole script
// from running, and the browser only reports it in the console.
//
//   node scripts/check-scripts.mjs
//
// Exits 1 and names the tool and the error if anything fails to parse.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const file = process.argv[2] || new URL("../index.html", import.meta.url).pathname;
const html = readFileSync(file, "utf8");

// Embedded tools: <script type="text/plain" id="src-...">...</script>, with
// "</script>" written as "<\/script>" inside so the outer tag does not end early.
const embedded = [];
const outer = html.replace(/<script type="text\/plain" id="([^"]+)">([\s\S]*?)<\/script>/g, (_, id, body) => {
  embedded.push({ name: id, doc: body.replaceAll("<\\/", "</") });
  return "";
});

function scriptsIn(doc) {
  const found = [];
  for (const m of doc.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1];
    if (/\bsrc=/.test(attrs)) continue;
    const type = /type="([^"]*)"/.exec(attrs)?.[1];
    if (type && !/javascript|module/.test(type)) continue; // JSON, text/plain, etc.
    if (m[2].trim()) found.push(m[2]);
  }
  return found;
}

const targets = [{ name: "page", doc: outer }, ...embedded];
const dir = mkdtempSync(path.join(os.tmpdir(), "kit-check-"));
let failures = 0;
let checked = 0;

for (const { name, doc } of targets) {
  scriptsIn(doc).forEach((code, i) => {
    const tmp = path.join(dir, `${name}-${i}.cjs`);
    writeFileSync(tmp, code);
    checked++;
    try {
      execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" });
    } catch (err) {
      failures++;
      const message = String(err.stderr).split("\n").find((l) => /^\w*Error:/.test(l)) || "syntax error";
      console.error(`FAIL  ${name} (script ${i + 1}): ${message.slice(0, 160)}`);
    }
  });
}

rmSync(dir, { recursive: true, force: true });
console.log(`${checked} scripts checked, ${failures} failed.`);
process.exit(failures ? 1 : 0);

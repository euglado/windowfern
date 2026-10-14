import { execFileSync } from "node:child_process";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const licenses = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "0BSD",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Unlicense",
  "MIT OR Apache-2.0",
  "(MIT OR Apache-2.0)",
]);
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
let dependencies = 0;
for (const [name, entry] of Object.entries(lock.packages)) {
  if (!name) continue;
  if (
    !licenses.has(entry.license) ||
    !entry.resolved?.startsWith("https://registry.npmjs.org/") ||
    !/^sha512-[A-Za-z0-9+/]+=*$/.test(entry.integrity ?? "") ||
    entry.hasInstallScript
  )
    throw new Error(`Dependency policy failed: ${name}`);
  dependencies++;
}
let tracked = [];
try {
  tracked = execFileSync("git", ["ls-files", "-z"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .split("\0")
    .filter(Boolean);
} catch {
  /* Initial check before git init. */
}
if (tracked.some((name) => /(^|\/)\.env(?:$|\.)/.test(name) && !name.endsWith(".env.example")))
  throw new Error("Private environment file is tracked");
const patterns = [
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bnpm_[A-Za-z0-9]{20,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{25,}\b/,
];
let sources = 0;
function walk(directory) {
  for (const name of readdirSync(directory)) {
    if (
      [".git", "node_modules", "dist", "coverage"].includes(name) ||
      (name.startsWith(".env") && name !== ".env.example") ||
      name.endsWith(".log")
    )
      continue;
    const file = join(directory, name);
    const stat = lstatSync(file);
    if (stat.isSymbolicLink()) throw new Error("Source symlinks are unsupported");
    if (stat.isDirectory()) {
      walk(file);
      continue;
    }
    if (stat.size > 2_000_000) throw new Error(`Unexpected large source: ${relative(".", file)}`);
    const content = readFileSync(file, "utf8");
    if (patterns.some((pattern) => pattern.test(content)))
      throw new Error(`Possible credential in ${relative(".", file)} (value hidden)`);
    sources++;
  }
}
walk(".");
console.log(
  `Supply checks passed: ${dependencies} dependency license/registry/SHA-512/no-install-script entries; ${sources} source credential-pattern scans. Heuristics are not a guarantee.`,
);

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const [name, file] of [
  ["main", "dist/main.js"],
  ["register", "dist/register.js"],
  ["noninteractive setup", "scripts/setup.mjs"],
])
  test(`${name} safely fails without configuration, writes or credentials`, () => {
    const directory = mkdtempSync(join(tmpdir(), "windowfern-test-"));
    assert.ok(isAbsolute(directory) && directory.startsWith(resolve(tmpdir()) + sep));
    const env = { ...process.env };
    delete env.DISCORD_TOKEN;
    delete env.DISCORD_APPLICATION_ID;
    delete env.DISCORD_GUILD_ID;
    let output;
    try {
      output = spawnSync(process.execPath, [join(root, file)], {
        cwd: directory,
        env,
        encoding: "utf8",
        timeout: 10_000,
      });
      assert.equal(existsSync(join(directory, ".env")), false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
    assert.equal(output.status, 1);
    assert.match(output.stderr, /setup|Setup|Registration/);
    assert.doesNotMatch(output.stderr, /DISCORD_TOKEN=|Authorization:|Error:.*\n\s+at/);
  });

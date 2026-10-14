import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const target = process.argv[2];
if (Number(process.versions.node.split(".")[0]) !== 24 || !["start", "register"].includes(target)) {
  console.error("Use Node.js 24 LTS and npm start / npm run register. / Node.js 24 LTS kullanın.");
  process.exitCode = 1;
} else {
  const file = target === "start" ? "dist/main.js" : "dist/register.js";
  if (!existsSync(file)) {
    console.error(
      "Run setup.cmd or bash setup.sh first / Önce setup.cmd veya bash setup.sh çalıştırın.",
    );
    process.exitCode = 1;
  } else {
    const child = spawnSync(process.execPath, [file], { stdio: "inherit" });
    process.exitCode = child.status ?? 1;
  }
}

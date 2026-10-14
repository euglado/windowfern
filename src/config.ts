import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

export function loadConfig() {
  const local = existsSync(".env") ? parseEnv(readFileSync(".env", "utf8")) : {};
  const get = (name: string) => process.env[name] ?? local[name] ?? "";
  const token = get("DISCORD_TOKEN");
  const application = get("DISCORD_APPLICATION_ID");
  const guild = get("DISCORD_GUILD_ID");
  if (
    !token ||
    token === "replace_with_your_bot_token" ||
    /\s/.test(token) ||
    !/^\d{17,20}$/.test(application) ||
    !/^\d{17,20}$/.test(guild)
  )
    throw new Error(
      "Configuration missing or invalid. Run npm run setup / Kurulum için npm run setup çalıştırın.",
    );
  return { token, application, guild };
}

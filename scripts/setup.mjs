import { existsSync, writeFileSync } from "node:fs";
import { emitKeypressEvents } from "node:readline";

async function ask(label, hidden = false) {
  process.stdout.write(label);
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => {
      process.stdin.off("keypress", keypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const keypress = (text, key) => {
      if (key.ctrl && key.name === "c") {
        finish();
        reject(new Error("cancelled"));
        return;
      }
      if (key.name === "return" || key.name === "enter") {
        finish();
        resolve(value);
        return;
      }
      if (key.name === "backspace") {
        if (value) {
          value = value.slice(0, -1);
          if (!hidden) process.stdout.write("\b \b");
        }
        return;
      }
      if (!key.ctrl && !key.meta && text && !/[\p{Cc}\p{Cf}]/u.test(text) && value.length < 200) {
        value += text;
        if (!hidden) process.stdout.write(text);
      }
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("keypress", keypress);
  });
}

async function setup() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("tty");
  if (existsSync(".env")) throw new Error("exists");
  console.log(
    "WindowFern setup / Kurulum. Token stays hidden; Ctrl+C cancels. / Token gizlidir; Ctrl+C iptal eder.",
  );
  emitKeypressEvents(process.stdin);
  const token = await ask("Bot token / Bot tokenı (hidden/gizli): ", true);
  const application = await ask("Application ID / Uygulama kimliği: ");
  const guild = await ask("Server ID / Sunucu kimliği: ");
  if (
    !/^[A-Za-z0-9_.-]{20,200}$/.test(token) ||
    !/^\d{17,20}$/.test(application) ||
    !/^\d{17,20}$/.test(guild)
  )
    throw new Error("invalid");
  writeFileSync(
    ".env",
    `DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${application}\nDISCORD_GUILD_ID=${guild}\n`,
    { flag: "wx", mode: 0o600 },
  );
  const invite = new URL("https://discord.com/oauth2/authorize");
  invite.search = new URLSearchParams({
    client_id: application,
    scope: "bot applications.commands",
    permissions: "3072",
    guild_id: guild,
    disable_guild_select: "true",
    integration_type: "0",
  }).toString();
  console.log(
    `.env saved locally / Yerel .env kaydedildi.\nInstall / Sunucuya ekle: ${invite}\nThen / Sonra: npm run register ; npm start`,
  );
}
setup().catch((error) => {
  const reason =
    error.message === "exists"
      ? ".env already exists; it was not changed. / .env zaten var; değiştirilmedi."
      : "Setup needs an interactive terminal and valid values. No token was logged. / Etkileşimli terminal ve geçerli değerler gerekli; token kaydedilmedi.";
  console.error(reason);
  process.exitCode = 1;
});

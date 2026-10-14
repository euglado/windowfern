import { REST, Routes } from "discord.js";
import { loadConfig } from "./config.js";
import { command } from "./ui.js";

async function register() {
  const config = loadConfig();
  const rest = new REST({ version: "10", retries: 0, timeout: 10_000 }).setToken(config.token);
  // POST upserts only this named command; unrelated commands are preserved.
  await rest.post(Routes.applicationGuildCommands(config.application, config.guild), {
    body: command.toJSON(),
  });
  console.log("/windowfern registered for your server / Sunucu komutu kaydedildi.");
}
register().catch(() => {
  console.error(
    "Registration failed. Check setup, bot token, application/server IDs and server installation. / Komut kaydı başarısız; kurulumu ve kimlikleri kontrol edin.",
  );
  process.exitCode = 1;
});

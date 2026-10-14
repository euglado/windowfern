import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { loadConfig } from "./config.js";
import { createHandler } from "./handler.js";
import { Store } from "./store.js";

async function main() {
  const config = loadConfig();
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
      GuildMemberManager: 0,
      UserManager: 0,
    }),
    rest: { retries: 0, timeout: 10_000 },
    allowedMentions: { parse: [], repliedUser: false },
  });
  const store = new Store();
  const cleanup = setInterval(() => store.prune(), 30_000);
  cleanup.unref();
  client.once(Events.ClientReady, (ready) => {
    if (ready.application.id !== config.application) {
      console.error("Application ID mismatch / Uygulama kimliği eşleşmiyor.");
      client.destroy();
      process.exitCode = 1;
      return;
    }
    const handler = createHandler(store, { ...config, bot: ready.user.id });
    client.on(Events.InteractionCreate, (interaction) => {
      void handler(interaction).catch(() =>
        console.error("Interaction failed / Etkileşim başarısız."),
      );
    });
    console.log("WindowFern connected / WindowFern bağlandı.");
  });
  client.on(Events.Error, () => console.error("Discord connection error / Bağlantı hatası."));
  const stop = () => {
    clearInterval(cleanup);
    store.sessions.clear();
    store.users.clear();
    store.channels.clear();
    client.destroy();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  await client.login(config.token);
}
main().catch(() => {
  console.error(
    "Startup failed. Check .env and connection; run npm run setup if unconfigured. / Başlatılamadı; .env ve bağlantıyı kontrol edin.",
  );
  process.exitCode = 1;
});

import { ChannelType, type Interaction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { calculate, InputError, inputMessage, type Language, render } from "./domain.js";
import type { Binding, Store } from "./store.js";
import { buttons, modal } from "./ui.js";

export type Options = { application: string; guild: string; bot: string };
export const permissions = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;
export const allowedMentions = {
  parse: [] as ("users" | "roles" | "everyone")[],
  repliedUser: false,
};

export async function authorize(interaction: Interaction): Promise<boolean> {
  if (!interaction.inGuild() || !interaction.channelId) return false;
  const guild = interaction.guild;
  if (!guild) return false;
  // Fetch roles as well: old cached roles must not authorize a later publication.
  await guild.roles.fetch();
  const [channel, member, bot] = await Promise.all([
    guild.channels.fetch(interaction.channelId, { force: true, cache: false }),
    guild.members.fetch({ user: interaction.user.id, force: true, cache: false }),
    guild.members.fetchMe({ force: true, cache: false }),
  ]);
  if (!channel || ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type))
    return false;
  return (
    channel.permissionsFor(member)?.has(permissions) === true &&
    channel.permissionsFor(bot)?.has(permissions) === true
  );
}

export function createHandler(store: Store, options: Options, canPublish = authorize) {
  return async (interaction: Interaction): Promise<void> => {
    if (
      !interaction.isChatInputCommand() &&
      !interaction.isModalSubmit() &&
      !interaction.isButton()
    )
      return;
    if (
      interaction.isChatInputCommand()
        ? interaction.commandName !== "windowfern"
        : !interaction.customId.startsWith("wf:")
    )
      return;
    let language: Language = interaction.locale === "tr" ? "tr" : "en";
    const say = async (content: string) => {
      const payload = { content, allowedMentions, components: [] };
      if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
      else await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
    };
    const expired = () =>
      language === "tr"
        ? "Bu işlem geçersiz, süresi dolmuş veya kullanılmış. /windowfern ile yeniden başlayın."
        : "This action is invalid, expired or already used. Start again with /windowfern.";
    try {
      if (
        !interaction.inGuild() ||
        !interaction.channelId ||
        interaction.guildId !== options.guild ||
        interaction.applicationId !== options.application
      ) {
        await say(expired());
        return;
      }
      const binding: Binding = {
        user: interaction.user.id,
        guild: interaction.guildId,
        channel: interaction.channelId,
        application: interaction.applicationId,
      };
      if (interaction.isChatInputCommand()) {
        const chosen = interaction.options.getString("language");
        if (chosen === "tr" || chosen === "en") language = chosen;
        if (
          !interaction.memberPermissions?.has(permissions) ||
          !interaction.appPermissions?.has(permissions) ||
          (interaction.channel?.type !== ChannelType.GuildText &&
            interaction.channel?.type !== ChannelType.GuildAnnouncement)
        ) {
          await say(
            language === "tr"
              ? "Normal metin kanalında, hem sizin hem botun Kanalı Görüntüle ve Mesaj Gönder izinleri olmalı."
              : "Use a normal text channel where both you and the bot have View Channel and Send Messages.",
          );
          return;
        }
        const id = store.open(binding, language);
        if (!id) {
          await say(
            language === "tr"
              ? "Yoğunluk sınırı: beş saniye bekleyip tekrar deneyin."
              : "Capacity or cooldown reached: wait five seconds and try again.",
          );
          return;
        }
        await interaction.showModal(modal(id, language));
        return;
      }
      const match = /^wf:(form|share|discard):([a-f0-9]{36})$/.exec(interaction.customId);
      if (!match?.[2]) {
        await say(expired());
        return;
      }
      const id = match[2];
      if (interaction.isModalSubmit()) {
        if (match[1] !== "form") {
          await say(expired());
          return;
        }
        const session = store.claim(id, binding, "form");
        if (!session) {
          await say(expired());
          return;
        }
        language = session.language;
        const result = calculate(
          interaction.fields.getTextInputValue("title"),
          interaction.fields.getTextInputValue("rows"),
          interaction.fields.getTextInputValue("minimum"),
        );
        if (!result.fits) {
          await say(render(result, language));
          return;
        }
        store.preview(id, session, result);
        await interaction.reply({
          content: `${render(result, language)}\n\n${language === "tr" ? "Özel önizleme: yalnızca yukarıdaki özet bu kanala paylaşılır. Ayrı uygunluk satırları paylaşılmaz. Düğmeler 5 dakika geçerli." : "Private preview: only the summary above will be shared to this channel. Individual availability lines are excluded. Buttons expire in 5 minutes."}`,
          components: buttons(id, language),
          allowedMentions,
          flags: MessageFlags.Ephemeral,
        });
        const message = await interaction.fetchReply();
        store.bind(id, message.id);
        return;
      }
      if (
        match[1] === "form" ||
        !interaction.message.flags.has(MessageFlags.Ephemeral) ||
        interaction.message.author.id !== options.bot ||
        interaction.message.webhookId !== options.application
      ) {
        await say(expired());
        return;
      }
      const session = store.claim(id, binding, "preview", interaction.message.id);
      if (!session?.result) {
        await say(expired());
        return;
      }
      language = session.language;
      await interaction.deferUpdate();
      if (match[1] === "discard") {
        await say(
          language === "tr"
            ? "Taslak silindi; hiçbir şey paylaşılmadı."
            : "Draft discarded; nothing was shared.",
        );
        return;
      }
      if (!store.reserveChannel(binding)) {
        await say(
          language === "tr"
            ? "Bu kanala dakikada bir paylaşım yapılabilir. Daha sonra yeni önizleme açın."
            : "This channel allows one share per minute. Create a new preview later.",
        );
        return;
      }
      if (!(await canPublish(interaction))) {
        await say(
          language === "tr"
            ? "Paylaşım izni yok. Kanalı ve iki tarafın izinlerini kontrol edip yeni önizleme açın."
            : "Sharing is unavailable. Check the channel and both users' permissions, then create a new preview.",
        );
        return;
      }
      // Fetch the target again after authorization; never send to a caller-supplied channel.
      const channel = await interaction.guild?.channels.fetch(binding.channel, {
        force: true,
        cache: false,
      });
      if (
        !channel ||
        (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)
      ) {
        await say(expired());
        return;
      }
      await channel.send({
        content: render(session.result, language),
        allowedMentions,
        flags: MessageFlags.SuppressEmbeds,
      });
      await say(
        language === "tr"
          ? "Ortak aralık bu kanala paylaşıldı. Bot bir rezervasyon veya hatırlatma oluşturmadı."
          : "Common window shared to this channel. No booking or reminder was created.",
      );
    } catch (error) {
      const message =
        error instanceof InputError
          ? inputMessage(error, language)
          : language === "tr"
            ? "İşlem tamamlanamadı. Kanala bakın; paylaşım gerçekleşmiş olabilir. Tekrar denemeden önce kontrol edin. Ham hata kaydedilmedi."
            : "The action could not finish. Check the channel; a share may already have succeeded. Check before retrying. No raw error was logged.";
      await say(message).catch(() => {});
    }
  };
}

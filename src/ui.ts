import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  LabelBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { Language } from "./domain.js";

export const command = new SlashCommandBuilder()
  .setName("windowfern")
  .setDescription("Find a common availability window privately")
  .setDescriptionLocalizations({ tr: "Ortak uygunluk aralığını özel olarak hesapla" })
  .setContexts(InteractionContextType.Guild)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
  .addStringOption((option) =>
    option
      .setName("language")
      .setDescription("Form and result language / Dil")
      .addChoices({ name: "Türkçe", value: "tr" }, { name: "English", value: "en" }),
  );

export function modal(id: string, language: Language): ModalBuilder {
  const tr = language === "tr";
  const field = (key: string, label: string, max: number, placeholder: string, paragraph = false) =>
    new LabelBuilder().setLabel(label).setTextInputComponent(
      new TextInputBuilder()
        .setCustomId(key)
        .setStyle(paragraph ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(max)
        .setPlaceholder(placeholder),
    );
  return new ModalBuilder()
    .setCustomId(`wf:form:${id}`)
    .setTitle(tr ? "Ortak zaman bul" : "Find a common window")
    .addLabelComponents(
      field(
        "title",
        tr ? "Etkinlik başlığı (özel bilgi yazmayın)" : "Event title (no private information)",
        70,
        tr ? "Topluluk çalışması" : "Community workshop",
      ),
      field(
        "rows",
        tr ? "2–6 uygunluk satırı: başlangıç / bitiş" : "2–6 availability lines: start / end",
        1000,
        "2026-10-20T18:00+03:00 / 2026-10-20T21:00+03:00\n2026-10-20T16:00Z / 2026-10-20T19:00Z",
        true,
      ),
      field(
        "minimum",
        tr ? "En az ortak dakika (5–720)" : "Minimum shared minutes (5–720)",
        3,
        "30",
      ),
    );
}

export function buttons(id: string, language: Language) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`wf:share:${id}`)
        .setLabel(language === "tr" ? "Ortak aralığı paylaş" : "Share common window")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`wf:discard:${id}`)
        .setLabel(language === "tr" ? "Vazgeç" : "Discard")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

import { escapeMarkdown } from "discord.js";

export type Language = "tr" | "en";
export type WindowResult = {
  title: string;
  count: number;
  start: number;
  end: number;
  minutes: number;
  minimum: number;
  fits: boolean;
};

export class InputError extends Error {}

const floor = Date.UTC(2000, 0, 1);
const ceiling = Date.UTC(2101, 0, 1);

// Round-trip calendar validation prevents Date's silent day/month rollover.
export function parseInstant(text: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(Z|([+-])(\d{2}):(\d{2}))$/.exec(
    text.trim(),
  );
  if (!match) throw new InputError("date");
  const [, ys, ms, ds, hs, mins, zone, sign, ohs, oms] = match;
  const [y, m, d, h, minute, oh, om] = [ys, ms, ds, hs, mins, ohs ?? 0, oms ?? 0].map(Number);
  if (
    y === undefined ||
    m === undefined ||
    d === undefined ||
    h === undefined ||
    minute === undefined ||
    oh === undefined ||
    om === undefined
  )
    throw new InputError("date");
  if (
    y < 2000 ||
    y > 2100 ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    h > 23 ||
    minute > 59 ||
    oh > 14 ||
    om > 59 ||
    (oh === 14 && om !== 0) ||
    zone === "-00:00"
  )
    throw new InputError("date");
  const wall = Date.UTC(y, m - 1, d, h, minute);
  const round = new Date(wall);
  if (round.getUTCFullYear() !== y || round.getUTCMonth() !== m - 1 || round.getUTCDate() !== d)
    throw new InputError("date");
  const offset = (oh * 60 + om) * (sign === "-" ? -1 : 1);
  const utc = wall - offset * 60_000;
  if (utc < floor || utc >= ceiling) throw new InputError("date");
  return utc / 1000;
}

export function calculate(titleInput: string, rows: string, minimumInput: string): WindowResult {
  const title = titleInput.trim();
  if (!title || title.length > 70 || /[@<>\p{Cc}\p{Cf}]|https?:|www\./iu.test(title))
    throw new InputError("title");
  if (!/^\d{1,3}$/.test(minimumInput.trim())) throw new InputError("minimum");
  const minimum = Number(minimumInput.trim());
  if (minimum < 5 || minimum > 720) throw new InputError("minimum");
  if (rows.length > 1000) throw new InputError("rows");
  const lines = rows.trim().split(/\r?\n/);
  if (lines.length < 2 || lines.length > 6) throw new InputError("rows");
  const intervals = lines.map((line) => {
    const parts = line.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) throw new InputError("rows");
    const start = parseInstant(parts[0]);
    const end = parseInstant(parts[1]);
    if (end <= start || end - start > 48 * 3600) throw new InputError("range");
    return { start, end };
  });
  const start = Math.max(...intervals.map((w) => w.start));
  const end = Math.min(...intervals.map((w) => w.end));
  const minutes = Math.max(0, (end - start) / 60);
  return { title, count: lines.length, start, end, minutes, minimum, fits: minutes >= minimum };
}

export function render(result: WindowResult, language: Language): string {
  const tr = language === "tr";
  const name = escapeMarkdown(result.title);
  if (!result.fits)
    return `${name}\n${tr ? "İstenen süreye uygun ortak aralık yok." : "No common window meets the requested duration."}\n${tr ? "Ortak dakika" : "Shared minutes"}: ${result.minutes}; ${tr ? "en az" : "minimum"}: ${result.minimum}.`;
  return [
    `WindowFern — ${name}`,
    `${tr ? "Ortak başlangıç" : "Common start"}: <t:${result.start}:F>`,
    `${tr ? "Ortak bitiş" : "Common end"}: <t:${result.end}:F>`,
    `${result.minutes} ${tr ? "dakika ortak uygunluk" : "minutes of shared availability"} (${result.count} ${tr ? "aralık" : "intervals"}; ${tr ? "istenen en az" : "requested minimum"} ${result.minimum}).`,
    tr
      ? "Saatler görüntüleyenin saat diliminde. Bu bir rezervasyon değildir; UTC farklarını ve uygunluğu katılımcılarla doğrulayın."
      : "Times use the viewer's timezone. This is not a booking; confirm UTC offsets and availability with participants.",
  ].join("\n");
}

export function inputMessage(error: InputError, language: Language): string {
  const tr = language === "tr";
  switch (error.message) {
    case "title":
      return tr
        ? "Başlık 1–70 karakter olmalı; bağlantı, etiket ve kontrol karakteri içermemeli."
        : "Use a 1–70 character title without links, mentions or control characters.";
    case "minimum":
      return tr
        ? "En az süre için 5–720 arasında tam dakika girin."
        : "Enter a whole minimum duration from 5 to 720 minutes.";
    case "range":
      return tr
        ? "Her bitiş başlangıçtan sonra ve en çok 48 saat içinde olmalı."
        : "Each end must be after its start and within 48 hours.";
    case "rows":
      return tr
        ? "2–6 satır girin; her satır: başlangıç / bitiş. Boş satır veya isim eklemeyin."
        : "Enter 2–6 lines, each: start / end. Do not add blank lines or names.";
    default:
      return tr
        ? "Tarih örneği: 2026-10-20T18:00+03:00. Gerçek takvim tarihi, açık UTC farkı veya Z kullanın (2000–2100); -00:00 kabul edilmez."
        : "Example: 2026-10-20T18:00+03:00. Use a real calendar date and explicit UTC offset or Z (2000–2100); -00:00 is unsupported.";
  }
}

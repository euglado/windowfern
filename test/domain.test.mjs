import assert from "node:assert/strict";
import test from "node:test";
import { calculate, InputError, inputMessage, parseInstant, render } from "../dist/domain.js";

const rows =
  "2026-10-20T18:00+03:00 / 2026-10-20T21:00+03:00\n2026-10-20T16:00Z / 2026-10-20T19:00Z";
test("intersects different UTC offsets without exposing individual schedules", () => {
  const result = calculate("Workshop", rows, "30");
  assert.equal(result.start, Date.parse("2026-10-20T16:00Z") / 1000);
  assert.equal(result.end, Date.parse("2026-10-20T18:00Z") / 1000);
  assert.equal(result.minutes, 120);
  assert.equal(result.fits, true);
  assert.equal(render(result, "en").includes("15:00"), false);
});
for (const [value, expected] of [
  ["2024-02-29T12:00Z", "2024-02-29T12:00Z"],
  ["2026-10-20T18:00+03:30", "2026-10-20T14:30Z"],
  ["2026-10-20T18:00-05:45", "2026-10-20T23:45Z"],
  ["2026-10-20T18:00+14:00", "2026-10-20T04:00Z"],
  ["2026-10-20T00:00-14:00", "2026-10-20T14:00Z"],
  ["2026-10-20T18:00+00:00", "2026-10-20T18:00Z"],
])
  test(`parses ${value}`, () => assert.equal(parseInstant(value), Date.parse(expected) / 1000));
for (const value of [
  "2026-02-29T12:00Z",
  "2100-02-29T12:00Z",
  "2026-04-31T12:00Z",
  "2026-00-01T12:00Z",
  "2026-13-01T12:00Z",
  "2026-01-00T12:00Z",
  "2026-01-01T24:00Z",
  "2026-01-01T12:60Z",
  "2026-01-01T12:00+14:01",
  "2026-01-01T12:00-15:00",
  "2026-01-01T12:00+01:60",
  "2026-01-01T12:00-00:00",
  "2026-01-01T12:00",
  "2026-01-01 12:00Z",
  "2026-01-01T12:00:00Z",
  "2026-01-01T12:00z",
  "1999-12-31T12:00Z",
  "2101-01-01T12:00Z",
  "2000-01-01T00:00+00:01",
  "2100-12-31T23:59-00:01",
  "NaN",
  "2026-1-1T12:00Z",
])
  test(`rejects invalid instant ${value}`, () =>
    assert.throws(() => parseInstant(value), InputError));
test("supports different explicit offsets at each endpoint across DST", () => {
  const result = calculate(
    "DST",
    "2026-10-25T01:00+02:00 / 2026-10-25T04:00+01:00\n2026-10-24T23:00Z / 2026-10-25T03:00Z",
    "240",
  );
  assert.equal(result.minutes, 240);
  assert.equal(result.fits, true);
});
test("touching intervals have no meeting duration", () => {
  const result = calculate(
    "Touch",
    "2026-10-20T10:00Z / 2026-10-20T11:00Z\n2026-10-20T11:00Z / 2026-10-20T12:00Z",
    "5",
  );
  assert.equal(result.minutes, 0);
  assert.equal(result.fits, false);
  assert.doesNotMatch(render(result, "tr"), /<t:/);
});
test("disjoint intervals clamp shared duration to zero", () => {
  const result = calculate(
    "Gap",
    "2026-10-20T10:00Z / 2026-10-20T11:00Z\n2026-10-21T11:00Z / 2026-10-21T12:00Z",
    "5",
  );
  assert.equal(result.minutes, 0);
  assert.equal(result.fits, false);
});
test("short overlap is not shareable", () =>
  assert.equal(calculate("Short", rows, "121").fits, false));
test("exact minimum is shareable", () => assert.equal(calculate("Exact", rows, "120").fits, true));
test("six intervals and CRLF supported", () => {
  const row = "2026-10-20T10:00Z / 2026-10-20T11:00Z";
  assert.equal(calculate("Six", Array(6).fill(row).join("\r\n"), "5").count, 6);
});
for (const value of ["0", "4", "721", "1.5", "1e2", "-5", "", "Infinity", "0030"])
  test(`rejects duration ${value}`, () =>
    assert.throws(() => calculate("Event", rows, value), InputError));
for (const title of [
  "",
  " ",
  "a".repeat(71),
  "@everyone",
  "<@123>",
  "https://example.com",
  "www.example.com",
  "a\nb",
  "a\u202eb",
])
  test(`rejects unsafe title ${JSON.stringify(title)}`, () =>
    assert.throws(() => calculate(title, rows, "30"), InputError));
for (const invalid of [
  "",
  rows.split("\n")[0],
  `${rows}\n\n${rows}`,
  Array(7).fill(rows.split("\n")[0]).join("\n"),
  `${rows}\nname`,
  "a".repeat(1001),
  "2026-10-20T10:00Z / 2026-10-20T10:00Z\n2026-10-20T10:00Z / 2026-10-20T11:00Z",
  "2026-10-20T10:00Z / 2026-10-22T10:01Z\n2026-10-20T10:00Z / 2026-10-20T11:00Z",
])
  test(`rejects invalid rows ${invalid.slice(0, 30)}`, () =>
    assert.throws(() => calculate("Event", invalid, "5"), InputError));
test("escaped worst-case title remains bounded in both languages", () => {
  const result = calculate("*".repeat(70), rows, "30");
  for (const language of ["tr", "en"]) {
    const output = render(result, language);
    assert.ok(output.length < 1000);
    assert.ok(output.includes("\\*"));
  }
});
for (const code of ["title", "minimum", "range", "rows", "date"])
  test(`localized validation for ${code}`, () => {
    assert.notEqual(
      inputMessage(new InputError(code), "tr"),
      inputMessage(new InputError(code), "en"),
    );
  });

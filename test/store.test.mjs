import assert from "node:assert/strict";
import test from "node:test";
import { Store } from "../dist/store.js";

const binding = { user: "user", guild: "guild", channel: "channel", application: "app" };
const result = {
  title: "Event",
  count: 2,
  start: 1,
  end: 601,
  minutes: 10,
  minimum: 5,
  fits: true,
};
test("nonces are random and owner action is single use", () => {
  const store = new Store();
  const id = store.open(binding, "tr");
  assert.match(id, /^[a-f0-9]{36}$/);
  assert.ok(store.claim(id, binding, "form"));
  assert.equal(store.claim(id, binding, "form"), undefined);
});
for (const key of Object.keys(binding))
  test(`binding rejects wrong ${key} without consuming`, () => {
    const store = new Store();
    const id = store.open(binding, "en");
    assert.equal(store.claim(id, { ...binding, [key]: "wrong" }, "form"), undefined);
    assert.ok(store.claim(id, binding, "form"));
  });
test("TTL is enforced at exact boundary", () => {
  let now = 0;
  const store = new Store(() => now);
  const id = store.open(binding, "en");
  now = 300_000;
  assert.equal(store.claim(id, binding, "form"), undefined);
  assert.equal(store.users.size, 0);
});
test("preview requires bound message and correct stage", () => {
  const store = new Store();
  const id = store.open(binding, "en");
  const form = store.claim(id, binding, "form");
  store.preview(id, form, result);
  assert.equal(store.claim(id, binding, "form"), undefined);
  assert.equal(store.claim(id, binding, "preview", "message"), undefined);
  store.bind(id, "message");
  assert.equal(store.claim(id, binding, "preview", "other"), undefined);
  assert.equal(store.claim(id, binding, "preview", "message").result, result);
  assert.equal(store.claim(id, binding, "preview", "message"), undefined);
});
test("preview expiry begins after form completion", () => {
  let now = 0;
  const store = new Store(() => now);
  const id = store.open(binding, "en");
  now = 299_999;
  const session = store.claim(id, binding, "form");
  store.preview(id, session, result);
  store.bind(id, "message");
  now = 300_001;
  assert.ok(store.claim(id, binding, "preview", "message"));
});
test("same owner replaces prior session only after cooldown", () => {
  let now = 0;
  const store = new Store(() => now);
  const first = store.open(binding, "en");
  assert.equal(store.open(binding, "en"), undefined);
  now = 5000;
  const next = store.open(binding, "tr");
  assert.notEqual(first, next);
  assert.equal(store.sessions.size, 1);
  assert.equal(store.claim(first, binding, "form"), undefined);
});
test("draft capacity is bounded and an existing owner can replace their draft", () => {
  let now = 0;
  const store = new Store(() => now);
  for (let n = 0; n < 100; n++) assert.ok(store.open({ ...binding, user: String(n) }, "en"));
  assert.equal(store.open({ ...binding, user: "extra" }, "en"), undefined);
  now = 5000;
  assert.ok(store.open({ ...binding, user: "0" }, "en"));
  assert.equal(store.sessions.size, 100);
});
test("channel rate limit is synchronous and independent across channels", () => {
  let now = 0;
  const store = new Store(() => now);
  assert.equal(store.reserveChannel(binding), true);
  assert.equal(store.reserveChannel(binding), false);
  assert.equal(store.reserveChannel({ ...binding, channel: "other" }), true);
  now = 60_000;
  assert.equal(store.reserveChannel(binding), true);
});
test("cooldown maps remain bounded", () => {
  const store = new Store(() => 0);
  for (let n = 0; n < 500; n++)
    assert.equal(store.reserveChannel({ ...binding, channel: String(n) }), true);
  assert.equal(store.reserveChannel({ ...binding, channel: "extra" }), false);
  assert.equal(store.channels.size, 500);
  for (let n = 0; n < 500; n++) store.users.set(String(n), 9999);
  assert.equal(store.open(binding, "en"), undefined);
  assert.equal(store.users.size, 500);
});
test("preview data contains no individual availability rows", () => {
  const store = new Store();
  const id = store.open(binding, "en");
  const session = store.claim(id, binding, "form");
  store.preview(id, session, result);
  assert.deepEqual(Object.keys(store.sessions.get(id)).sort(), [
    "application",
    "channel",
    "expires",
    "guild",
    "language",
    "result",
    "user",
  ]);
});

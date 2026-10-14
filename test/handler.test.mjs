import assert from "node:assert/strict";
import test from "node:test";
import { ChannelType, MessageFlags, MessageFlagsBitField, PermissionsBitField } from "discord.js";
import { authorize, createHandler, permissions } from "../dist/handler.js";
import { Store } from "../dist/store.js";
import { command, modal } from "../dist/ui.js";

const options = { application: "app", guild: "guild", bot: "bot" };
const validRows =
  "2026-10-20T18:00+03:00 / 2026-10-20T21:00+03:00\n2026-10-20T16:00Z / 2026-10-20T19:00Z";
function fake(kind = "command", overrides = {}) {
  const calls = [];
  const sent = [];
  const channel = {
    type: ChannelType.GuildText,
    send: async (payload) => {
      sent.push(payload);
    },
  };
  const interaction = {
    applicationId: "app",
    guildId: "guild",
    channelId: "channel",
    user: { id: "user" },
    locale: "en-US",
    channel,
    commandName: "windowfern",
    options: { getString: () => null },
    memberPermissions: new PermissionsBitField(permissions),
    appPermissions: new PermissionsBitField(permissions),
    guild: { channels: { fetch: async () => channel } },
    deferred: false,
    replied: false,
    customId: "",
    fields: {
      getTextInputValue: (key) => ({ title: "Workshop", rows: validRows, minimum: "30" })[key],
    },
    message: {
      id: "preview",
      author: { id: "bot" },
      webhookId: "app",
      flags: new MessageFlagsBitField(MessageFlags.Ephemeral),
    },
    isChatInputCommand: () => kind === "command",
    isModalSubmit: () => kind === "modal",
    isButton: () => kind === "button",
    inGuild: () => true,
    reply: async (payload) => {
      calls.push({ method: "reply", payload });
      interaction.replied = true;
    },
    editReply: async (payload) => {
      calls.push({ method: "editReply", payload });
    },
    fetchReply: async () => ({ id: "preview" }),
    showModal: async (payload) => {
      calls.push({ method: "showModal", payload: payload.toJSON() });
      interaction.replied = true;
    },
    deferUpdate: async () => {
      calls.push({ method: "deferUpdate" });
      interaction.deferred = true;
    },
    ...overrides,
  };
  return { interaction, calls, sent };
}
async function prepared(canPublish = async () => true) {
  const store = new Store();
  const handler = createHandler(store, options, canPublish);
  const opening = fake();
  await handler(opening.interaction);
  const id = opening.calls[0].payload.custom_id.split(":")[2];
  const preview = fake("modal", { customId: `wf:form:${id}` });
  await handler(preview.interaction);
  return { store, handler, id, preview };
}
test("command is guild-install only with current modal Label components", () => {
  const json = command.toJSON();
  assert.deepEqual(json.contexts, [0]);
  assert.deepEqual(json.integration_types, [0]);
  const form = modal("a".repeat(36), "tr").toJSON();
  assert.equal(form.components.length, 3);
  assert.ok(
    form.components.every((component) => component.type === 18 && component.component.type === 4),
  );
  assert.ok(form.components[1].component.placeholder.length <= 100);
});
test("command opens private form in selected language", async () => {
  const store = new Store();
  const handler = createHandler(store, options);
  const item = fake("command", { options: { getString: () => "tr" } });
  await handler(item.interaction);
  assert.equal(item.calls[0].method, "showModal");
  assert.equal(store.sessions.values().next().value.language, "tr");
  assert.equal(item.sent.length, 0);
});
test("preview is ephemeral, full summary visible and input rows discarded", async () => {
  const { store, preview } = await prepared();
  const payload = preview.calls[0].payload;
  assert.equal(payload.flags, MessageFlags.Ephemeral);
  assert.equal(payload.components.length, 1);
  assert.match(payload.content, /120 minutes/);
  assert.ok(payload.content.length < 2000);
  assert.deepEqual(payload.allowedMentions.parse, []);
  assert.equal(JSON.stringify([...store.sessions.values()]).includes("+03:00"), false);
  assert.equal(preview.sent.length, 0);
});
test("explicit share sends only the common window and removes controls", async () => {
  let checked = 0;
  const { handler, id, store } = await prepared(async () => {
    checked++;
    return true;
  });
  const click = fake("button", { customId: `wf:share:${id}` });
  await handler(click.interaction);
  assert.equal(checked, 1);
  assert.equal(click.sent.length, 1);
  assert.match(click.sent[0].content, /120 minutes/);
  assert.doesNotMatch(click.sent[0].content, /\+03:00/);
  assert.deepEqual(click.sent[0].allowedMentions.parse, []);
  assert.equal(click.sent[0].flags, MessageFlags.SuppressEmbeds);
  assert.deepEqual(click.calls.at(-1).payload.components, []);
  assert.equal(store.sessions.size, 0);
});
test("discard sends no public message", async () => {
  const { handler, id, store } = await prepared();
  const click = fake("button", { customId: `wf:discard:${id}` });
  await handler(click.interaction);
  assert.equal(click.sent.length, 0);
  assert.equal(store.sessions.size, 0);
  assert.match(click.calls.at(-1).payload.content, /discarded/);
});
test("revoked permission is checked immediately before publication", async () => {
  const { handler, id } = await prepared(async () => false);
  const click = fake("button", { customId: `wf:share:${id}` });
  await handler(click.interaction);
  assert.equal(click.sent.length, 0);
  assert.match(click.calls.at(-1).payload.content, /unavailable/);
});
for (const [name, override] of [
  ["user", { user: { id: "other" } }],
  ["guild", { guildId: "other" }],
  ["channel", { channelId: "other" }],
  ["application", { applicationId: "other" }],
  [
    "message",
    {
      message: {
        id: "other",
        author: { id: "bot" },
        webhookId: "app",
        flags: new MessageFlagsBitField(64),
      },
    },
  ],
  [
    "author",
    {
      message: {
        id: "preview",
        author: { id: "other" },
        webhookId: "app",
        flags: new MessageFlagsBitField(64),
      },
    },
  ],
  [
    "webhook",
    {
      message: {
        id: "preview",
        author: { id: "bot" },
        webhookId: "other",
        flags: new MessageFlagsBitField(64),
      },
    },
  ],
  [
    "public message",
    {
      message: {
        id: "preview",
        author: { id: "bot" },
        webhookId: "app",
        flags: new MessageFlagsBitField(0),
      },
    },
  ],
])
  test(`rejects wrong ${name} without consuming legitimate draft`, async () => {
    const { handler, id, store } = await prepared();
    const click = fake("button", { customId: `wf:share:${id}`, ...override });
    await handler(click.interaction);
    assert.equal(click.sent.length, 0);
    assert.equal(store.sessions.size, 1);
    assert.equal(click.calls[0].payload.flags, MessageFlags.Ephemeral);
  });
test("simultaneous share clicks can send at most once", async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const { handler, id } = await prepared(async () => {
    await gate;
    return true;
  });
  const first = fake("button", { customId: `wf:share:${id}` });
  const second = fake("button", { customId: `wf:share:${id}` });
  const pending = handler(first.interaction);
  await handler(second.interaction);
  release();
  await pending;
  assert.equal(first.sent.length + second.sent.length, 1);
});
test("ambiguous network failure consumes preview and sanitizes errors", async () => {
  const { handler, id } = await prepared();
  const click = fake("button", {
    customId: `wf:share:${id}`,
    guild: {
      channels: {
        fetch: async () => {
          throw new Error("private-network-value");
        },
      },
    },
  });
  await handler(click.interaction);
  assert.doesNotMatch(JSON.stringify(click.calls), /private-network-value/);
  const retry = fake("button", { customId: `wf:share:${id}` });
  await handler(retry.interaction);
  assert.equal(retry.sent.length, 0);
});
test("two different users cannot bypass channel share cooldown", async () => {
  const { handler, id, store } = await prepared();
  const first = fake("button", { customId: `wf:share:${id}` });
  await handler(first.interaction);
  const other = fake("command", { user: { id: "other" } });
  await handler(other.interaction);
  const otherId = other.calls[0].payload.custom_id.split(":")[2];
  const form = fake("modal", { user: { id: "other" }, customId: `wf:form:${otherId}` });
  await handler(form.interaction);
  const click = fake("button", { user: { id: "other" }, customId: `wf:share:${otherId}` });
  await handler(click.interaction);
  assert.equal(click.sent.length, 0);
  assert.match(click.calls.at(-1).payload.content, /one share per minute/);
  assert.equal(store.sessions.size, 0);
});
test("invalid date yields actionable private validation", async () => {
  const store = new Store();
  const handler = createHandler(store, options);
  const open = fake();
  await handler(open.interaction);
  const id = open.calls[0].payload.custom_id.split(":")[2];
  const form = fake("modal", {
    customId: `wf:form:${id}`,
    fields: {
      getTextInputValue: (key) =>
        ({ title: "Event", rows: validRows.replace("2026-10-20", "2026-02-30"), minimum: "30" })[
          key
        ],
    },
  });
  await handler(form.interaction);
  assert.match(form.calls[0].payload.content, /real calendar date/);
  assert.equal(form.sent.length, 0);
  assert.equal(store.sessions.size, 0);
});
test("no common window has no publication buttons", async () => {
  const store = new Store();
  const handler = createHandler(store, options);
  const open = fake();
  await handler(open.interaction);
  const id = open.calls[0].payload.custom_id.split(":")[2];
  const form = fake("modal", {
    customId: `wf:form:${id}`,
    fields: {
      getTextInputValue: (key) => ({ title: "Event", rows: validRows, minimum: "121" })[key],
    },
  });
  await handler(form.interaction);
  assert.deepEqual(form.calls[0].payload.components, []);
  assert.match(form.calls[0].payload.content, /No common window/);
  assert.equal(store.sessions.size, 0);
});
for (const override of [
  { memberPermissions: new PermissionsBitField(0n) },
  { appPermissions: new PermissionsBitField(0n) },
  { channel: { type: ChannelType.PublicThread } },
  { inGuild: () => false },
])
  test("unsupported context or permission opens no form", async () => {
    const store = new Store();
    const handler = createHandler(store, options);
    const item = fake("command", override);
    await handler(item.interaction);
    assert.equal(store.sessions.size, 0);
    assert.equal(item.calls[0].method, "reply");
    assert.equal(item.sent.length, 0);
  });
test("unrelated commands ignored", async () => {
  const item = fake("command", { commandName: "other" });
  await createHandler(new Store(), options)(item.interaction);
  assert.equal(item.calls.length, 0);
});
test("fresh authorization fetches roles, channel and both members without caching", async () => {
  const calls = [];
  const channel = {
    type: ChannelType.GuildText,
    permissionsFor: () => new PermissionsBitField(permissions),
  };
  const interaction = fake().interaction;
  interaction.guild = {
    roles: { fetch: async () => calls.push("roles") },
    channels: {
      fetch: async (id, opts) => {
        assert.equal(id, "channel");
        assert.deepEqual(opts, { force: true, cache: false });
        calls.push("channel");
        return channel;
      },
    },
    members: {
      fetch: async (opts) => {
        assert.deepEqual(opts, { user: "user", force: true, cache: false });
        calls.push("member");
        return {};
      },
      fetchMe: async (opts) => {
        assert.deepEqual(opts, { force: true, cache: false });
        calls.push("bot");
        return {};
      },
    },
  };
  assert.equal(await authorize(interaction), true);
  assert.deepEqual(calls, ["roles", "channel", "member", "bot"]);
  channel.permissionsFor = () => new PermissionsBitField(0n);
  assert.equal(await authorize(interaction), false);
  channel.type = ChannelType.PublicThread;
  assert.equal(await authorize(interaction), false);
});

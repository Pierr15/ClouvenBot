import test from "node:test";
import assert from "node:assert/strict";
import { commandReply, BASIC_COMMANDS } from "../src/discord/commands.js";

test("exposes only the three approved starter commands", () => {
  assert.deepEqual(BASIC_COMMANDS.map((command) => command.name), ["help", "health", "version"]);
});

test("help explains the MVP boundary", () => {
  const reply = commandReply("help");
  assert.equal(reply.ephemeral, true);
  assert.match(reply.content, /belum diaktifkan/i);
});

test("unknown commands fail closed with an ephemeral response", () => {
  const reply = commandReply("admin");
  assert.equal(reply.ephemeral, true);
  assert.match(reply.content, /belum dikenal/i);
});
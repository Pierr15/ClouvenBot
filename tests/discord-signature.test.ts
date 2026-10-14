import test from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import { verifyDiscordSignature } from "../src/security/discord-signature.js";

test("accepts a valid Ed25519 signature", () => {
  const keys = nacl.sign.keyPair();
  const timestamp = "1760000000";
  const body = Buffer.from(JSON.stringify({ type: 1 }));
  const message = Buffer.concat([Buffer.from(timestamp), Buffer.from("."), body]);
  const signature = Buffer.from(nacl.sign.detached(new Uint8Array(message), keys.secretKey)).toString("hex");
  assert.equal(verifyDiscordSignature({
    publicKey: Buffer.from(keys.publicKey).toString("hex"),
    signature, timestamp, rawBody: body, nowSeconds: Number(timestamp)
  }), true);
});

test("rejects a modified body", () => {
  const keys = nacl.sign.keyPair();
  const timestamp = "1760000000";
  const body = Buffer.from('{"type":1}');
  const message = Buffer.concat([Buffer.from(timestamp), Buffer.from("."), body]);
  const signature = Buffer.from(nacl.sign.detached(new Uint8Array(message), keys.secretKey)).toString("hex");
  assert.equal(verifyDiscordSignature({
    publicKey: Buffer.from(keys.publicKey).toString("hex"),
    signature, timestamp, rawBody: Buffer.from('{"type":2}'), nowSeconds: Number(timestamp)
  }), false);
});

test("rejects missing, malformed, and stale signatures", () => {
  const body = Buffer.from("{}");
  assert.equal(verifyDiscordSignature({ publicKey: undefined, signature: "x", timestamp: "1", rawBody: body }), false);
  assert.equal(verifyDiscordSignature({ publicKey: "bad", signature: "bad", timestamp: "1", rawBody: body }), false);
  assert.equal(verifyDiscordSignature({
    publicKey: "a".repeat(64), signature: "b".repeat(128), timestamp: "100", rawBody: body, nowSeconds: 1000
  }), false);
});
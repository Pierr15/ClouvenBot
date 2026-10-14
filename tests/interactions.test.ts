import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import nacl from "tweetnacl";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../api/interactions.js";

function mockRequest(method: string, body: Buffer, headers: Record<string, string> = {}) {
  const stream = Readable.from([body]);
  Object.assign(stream, { method, headers });
  return stream as unknown as VercelRequest;
}

function mockResponse() {
  const result: { statusCode: number; headers: Record<string, string>; body?: unknown } = {
    statusCode: 200,
    headers: {}
  };
  const response = {
    setHeader(name: string, value: string) { result.headers[name] = value; return response; },
    status(code: number) { result.statusCode = code; return response; },
    json(body: unknown) { result.body = body; return response; }
  };
  return { response: response as unknown as VercelResponse, result };
}

function signedHeaders(body: Buffer, publicKey: Uint8Array, secretKey: Uint8Array) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const message = Buffer.concat([Buffer.from(timestamp), Buffer.from("."), body]);
  const signature = Buffer.from(nacl.sign.detached(new Uint8Array(message), secretKey)).toString("hex");
  return {
    "x-signature-ed25519": signature,
    "x-signature-timestamp": timestamp,
    publicKeyHex: Buffer.from(publicKey).toString("hex")
  };
}

test("Discord PING returns PONG after signature validation", async () => {
  const keys = nacl.sign.keyPair();
  const body = Buffer.from(JSON.stringify({ type: 1 }));
  const signed = signedHeaders(body, keys.publicKey, keys.secretKey);
  process.env.DISCORD_PUBLIC_KEY = signed.publicKeyHex;
  const req = mockRequest("POST", body, {
    "x-signature-ed25519": signed["x-signature-ed25519"],
    "x-signature-timestamp": signed["x-signature-timestamp"]
  });
  const { response, result } = mockResponse();

  await handler(req, response);

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { type: 1 });
  assert.equal(result.headers["Cache-Control"], "no-store");
});

test("unsigned requests are rejected before parsing", async () => {
  process.env.DISCORD_PUBLIC_KEY = "a".repeat(64);
  const req = mockRequest("POST", Buffer.from("{"));
  const { response, result } = mockResponse();

  await handler(req, response);

  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.body, { error: "INVALID_DISCORD_SIGNATURE" });
});

test("non-POST requests are rejected", async () => {
  const req = mockRequest("GET", Buffer.from(""));
  const { response, result } = mockResponse();

  await handler(req, response);

  assert.equal(result.statusCode, 405);
  assert.equal(result.headers.Allow, "POST");
});

import nacl from "tweetnacl";

const MAX_CLOCK_SKEW_SECONDS = 5 * 60;

export function verifyDiscordSignature(input: {
  publicKey: string | undefined;
  signature: string | undefined;
  timestamp: string | undefined;
  rawBody: Buffer;
  nowSeconds?: number;
}): boolean {
  const { publicKey, signature, timestamp, rawBody } = input;
  if (!publicKey || !signature || !timestamp) return false;
  if (!/^[0-9a-f]{128}$/i.test(signature)) return false;
  if (!/^[0-9a-f]{64}$/i.test(publicKey)) return false;
  if (!/^\d{1,20}$/.test(timestamp)) return false;

  const timestampSeconds = Number(timestamp);
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(timestampSeconds) ||
      Math.abs(nowSeconds - timestampSeconds) > MAX_CLOCK_SKEW_SECONDS) return false;

  try {
    const message = Buffer.concat([Buffer.from(timestamp, "utf8"), Buffer.from("."), rawBody]);
    return nacl.sign.detached.verify(
      new Uint8Array(message),
      new Uint8Array(Buffer.from(signature, "hex")),
      new Uint8Array(Buffer.from(publicKey, "hex"))
    );
  } catch {
    return false;
  }
}
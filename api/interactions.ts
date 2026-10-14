import type { VercelRequest, VercelResponse } from "@vercel/node";
import { InteractionResponseType, InteractionType, MessageFlags } from "discord.js";
import { verifyDiscordSignature } from "../src/security/discord-signature.js";
import { commandReply } from "../src/discord/commands.js";

const MAX_INTERACTION_BODY_BYTES = 1024 * 1024;

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += bytes.length;
    if (totalBytes > MAX_INTERACTION_BODY_BYTES) {
      throw new Error("INTERACTION_BODY_TOO_LARGE");
    }
    chunks.push(bytes);
  }
  return Buffer.concat(chunks, totalBytes);
}

// Discord signatures must be checked against the original request bytes.
// Disable Vercel's automatic JSON parsing so the body stream remains readable.
export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  let rawBody: Buffer;
  try { rawBody = await readRawBody(req); }
  catch (error) {
    if (error instanceof Error && error.message === "INTERACTION_BODY_TOO_LARGE") {
      return res.status(413).json({ error: "PAYLOAD_TOO_LARGE" });
    }
    return res.status(400).json({ error: "INVALID_BODY" });
  }

  const signatureHeader = req.headers["x-signature-ed25519"];
  const timestampHeader = req.headers["x-signature-timestamp"];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const timestamp = Array.isArray(timestampHeader) ? timestampHeader[0] : timestampHeader;

  if (!verifyDiscordSignature({
    publicKey: process.env.DISCORD_PUBLIC_KEY,
    signature,
    timestamp,
    rawBody
  })) return res.status(401).json({ error: "INVALID_DISCORD_SIGNATURE" });

  let interaction: unknown;
  try { interaction = JSON.parse(rawBody.toString("utf8")); }
  catch { return res.status(400).json({ error: "INVALID_JSON" }); }

  if (!interaction || typeof interaction !== "object" || Array.isArray(interaction)) {
    return res.status(400).json({ error: "INVALID_INTERACTION" });
  }
  const data = interaction as { type?: number; data?: { name?: unknown } };
  if (data?.type === InteractionType.Ping) {
    return res.status(200).json({ type: InteractionResponseType.Pong });
  }

  if (data?.type === InteractionType.ApplicationCommand) {
    const name = typeof data.data?.name === "string" ? data.data.name : "";
    const reply = commandReply(name);
    return res.status(200).json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: reply.content, flags: reply.ephemeral ? MessageFlags.Ephemeral : undefined }
    });
  }

  return res.status(200).json({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content: "Jenis interaksi ini belum didukung.", flags: MessageFlags.Ephemeral }
  });
}
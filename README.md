# ClouvenBot

Official Discord community assistant for ClouvenTwo, built with TypeScript, discord.js, and Vercel Functions.

## MVP scope

- Discord HTTP interactions on Vercel Functions; no persistent Gateway process.
- Ed25519 signature verification over the exact raw request body with a five-minute timestamp window.
- Basic slash commands: `/help`, `/health`, and `/version`.
- Public health endpoint at `GET /api/health`.
- Automated signature tests and GitHub Actions CI.
- ClouvenTwo mutations and administrative commands are intentionally not enabled yet.

## Requirements

- Node.js 22+
- npm
- A Discord Application in the Discord Developer Portal
- Vercel CLI for local function emulation

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`.
3. Set `DISCORD_PUBLIC_KEY` from the Discord Developer Portal.
4. Run `npm run typecheck` and `npm test`.
5. Run `npm run dev` to start Vercel local development.

The interactions endpoint is `/api/interactions`. Configure the Discord Developer Portal Interactions Endpoint URL to your deployed URL plus `/api/interactions`. Discord requires this URL to be publicly reachable and to pass its signed PING challenge.

## Register slash commands

Set `DISCORD_BOT_TOKEN` and `DISCORD_APPLICATION_ID` in your local environment, then run:

```sh
npx tsx scripts/register-commands.ts
```

This registers global commands. Global command propagation can take time; a guild-scoped registration script can be added when the test server ID is known.

## Vercel Preview

1. Import this repository into Vercel.
2. Add `DISCORD_PUBLIC_KEY` to Preview environment variables.
3. Set `APP_ENV=preview`.
4. Do not add Production service credentials to Preview.
5. Deploy a preview and configure the Discord test application to use its `/api/interactions` URL.
6. Confirm Discord's PING challenge, then test the basic commands.

The health endpoint reports only service status and environment name. Do not expose secrets or stack traces in health responses.

## Security boundaries

- Discord interaction signatures are verified against the exact raw request bytes before parsing JSON.
- Unknown HTTP methods are rejected.
- The bot does not use a persistent Discord Gateway.
- The initial MVP has no administrative commands and no ClouvenTwo write integration.
- Never log tokens, keys, raw authorization headers, or private payloads.
- ClouvenTwo integration must use a dedicated server-to-server API contract, allowlisted operations, backend authorization, audit logging, and idempotency for mutations. Do not use a Supabase service-role key as a general-purpose bot credential.

## Current status

This is a foundation MVP. Before a community rollout, verify the deployed interaction endpoint, configure a test Discord application, and finish the read-only audit of ClouvenTwo routes before enabling integration features.

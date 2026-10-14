import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { BASIC_COMMANDS } from "../src/discord/commands.js";

const token = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;
if (!token || !applicationId) {
  throw new Error("Set DISCORD_BOT_TOKEN and DISCORD_APPLICATION_ID before registering commands.");
}

const commands = BASIC_COMMANDS.map((command) =>
  new SlashCommandBuilder().setName(command.name).setDescription(command.description).toJSON()
);
const rest = new REST({ version: "10" }).setToken(token);
await rest.put(Routes.applicationCommands(applicationId), { body: commands });
console.log(`Registered ${commands.length} global ClouvenBot commands.`);
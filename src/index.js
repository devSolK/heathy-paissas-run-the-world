import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  Events,
} from "discord.js";
import { definitions, handleInteraction } from "./commands/index.js";
import { startScheduler } from "./scheduler.js";
import { setupReactionHandler } from "./reactions.js";

// Permissions : View Channals, Send Massages, Manage Massages, Add Reactions, Read Message History
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Routing
client.on(Events.InteractionCreate, async (interaction) => {
  console.log("Interaction received:", interaction.commandName);

  if (!interaction.isChatInputCommand()) return;

  try {
    await handleInteraction(interaction, client);
  } catch (error) {
    console.error("Handler error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "오류가 발생했습니다.",
        flags: 64,
      });
    }
  }
});

// Reaction Handler / Scheduler
setupReactionHandler(client);
startScheduler(client);

// Deployment
(async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: definitions.map((d) => d.toJSON()) }
  );
  console.log("Slash commands deployed.");
  await client.login(process.env.DISCORD_TOKEN);
})();

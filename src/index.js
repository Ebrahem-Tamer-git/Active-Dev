import './web/server.js';
import { Client, Collection, GatewayIntentBits, Partials, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initDb } from './utils/database.js';
import { startAutoSync } from './utils/autoSync.js';
import {
  ensureLinkPanelMessage,
  handleDmCodeMessage,
  handlePanelButton,
  isPanelButton
} from './panel/linkPanel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await initDb();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
const commandsData = [];

for (const file of commandFiles) {
  const { default: command } = await import(`file://${path.join(commandsPath, file)}`);
  client.commands.set(command.data.name, command);
  commandsData.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.token);
await rest.put(
  Routes.applicationGuildCommands(config.clientId, config.guildId),
  { body: commandsData }
);
console.log('[Boot] commands registered');

client.once('clientReady', () => {
  console.log(`[Boot] logged in as ${client.user.tag}`);
  startAutoSync(client);
  ensureLinkPanelMessage(client).catch((error) => {
    console.error('[Panel] startup error:', error.message);
  });
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton() && isPanelButton(interaction.customId)) {
      await handlePanelButton(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    await command.execute(interaction);
  } catch (error) {
    console.error('[Interaction]', error.message);

    const payload = {
      content: 'حدث خطأ أثناء تنفيذ الطلب.',
      ephemeral: true
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }
});

client.on('messageCreate', async (message) => {
  try {
    await handleDmCodeMessage(client, message);
  } catch (error) {
    console.error('[DM] code handler error:', error.message);
  }
});

client.login(config.token);

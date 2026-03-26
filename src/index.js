// © 2026 Ebrahem
import './web/server.js';
import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { config } from './config.js';
import { startAutoSync } from './utils/autoSync.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.commands = new Collection();

// تحميل الأوامر
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
const commandsData = [];

for (const file of commandFiles) {
  const { default: command } = await import(`file://${path.join(commandsPath, file)}`);
  client.commands.set(command.data.name, command);
  commandsData.push(command.data.toJSON());
}

// تسجيل الأوامر
const rest = new REST({ version: '10' }).setToken(config.token);
await rest.put(
  Routes.applicationGuildCommands(config.clientId, config.guildId),
  { body: commandsData }
);
console.log('✅ تم تسجيل الأوامر');

client.once('clientReady', () => {
  console.log(`✅ تم تسجيل الدخول كـ ${client.user.tag}`);
  startAutoSync(client);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const msg = { content: '❌ حدث خطأ أثناء تنفيذ الأمر.', flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(config.token);


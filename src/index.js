// ملف الدخول الرئيسي للبوت
import './web/server.js';
import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { config } from './config.js';
import { startAutoSync } from './utils/autoSync.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// تحميل جميع أوامر الـ slash من مجلد commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commandsData = [];
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const { default: command } = await import(`file://${filePath}`);
  client.commands.set(command.data.name, command);
  commandsData.push(command.data.toJSON());
}

// تسجيل الأوامر على السيرفر المحدد
const rest = new REST({ version: '10' }).setToken(config.token);
await rest.put(
  Routes.applicationGuildCommands(config.clientId, config.guildId),
  { body: commandsData }
);

client.once('ready', () => {
  console.log(`✅ تم تسجيل الدخول كـ ${client.user.tag}`);
  startAutoSync(client); // 🔄 تشغيل المزامنة التلقائية
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true });
    }
  }
});

client.login(config.token);

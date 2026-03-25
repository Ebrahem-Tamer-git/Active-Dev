// © 2026 Ebrahem
import { SlashCommandBuilder } from 'discord.js';
import { generateVerifyCode } from '../utils/verification.js';
import { codesStore } from '../web/server.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('إنشاء رمز تحقق لربط حساب MTA بديسكورد')
    .addStringOption(opt =>
      opt.setName('username')
        .setDescription('اسم حسابك داخل MTA')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const { code, expiresAt } = generateVerifyCode(interaction.user.id, username);

    codesStore[username] = code;

    const seconds = Math.floor((expiresAt - Date.now()) / 1000);

    console.log(`[Verify] Code for ${username}: ${code}`);

    await interaction.reply({
      content: [
        `✅ تم إنشاء رمز التحقق!`,
        ``,
        `**الرمز:** \`${code}\``,
        `**المستخدم:** \`${username}\``,
        ``,
        `📌 ادخل اللعبة واكتب: \`/linkcheck ${code}\``,
        `⏰ الرمز صالح لمدة **${seconds} ثانية**`,
      ].join('\n'),
      flags: 64
    });
  }
};

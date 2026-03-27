// © 2026 Ebrahem
import { SlashCommandBuilder } from 'discord.js';
import { generateVerifyCode } from '../utils/verification.js';
import { getLink, getLinkByUsername } from '../utils/database.js';
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

    const currentLink = await getLink(interaction.user.id);
    if (currentLink && currentLink.mta_username !== username) {
      return interaction.reply({
        content: `❌ حسابك مربوط بالفعل على **${currentLink.mta_username}**. استخدم \`/unlink\` أولاً.`,
        flags: 64
      });
    }

    const usernameLink = await getLinkByUsername(username);
    if (usernameLink && usernameLink.discord_id !== interaction.user.id) {
      return interaction.reply({
        content: '❌ حساب الـ MTA ده مربوط بالفعل بحساب ديسكورد آخر.',
        flags: 64
      });
    }

    const result = generateVerifyCode(interaction.user.id, username);
    if (result.error === 'username_pending_elsewhere') {
      return interaction.reply({
        content: '❌ في طلب تحقق مفتوح بالفعل لهذا الحساب من شخص آخر.',
        flags: 64
      });
    }

    const { code, expiresAt } = result;
    const seconds = Math.floor((expiresAt - Date.now()) / 1000);

    codesStore[username] = code;
    setTimeout(() => {
      if (codesStore[username] === code) {
        delete codesStore[username];
      }
    }, seconds * 1000);

    await interaction.reply({
      content: [
        '✅ تم إنشاء رمز التحقق!',
        '',
        `**الرمز:** \`${code}\``,
        `**المستخدم:** \`${username}\``,
        '',
        `📌 ادخل اللعبة واكتب: \`/linkcheck ${code}\``,
        `⏰ الرمز صالح لمدة **${seconds} ثانية**`,
      ].join('\n'),
      flags: 64
    });
  }
};

// © 2026 Ebrahem
import { SlashCommandBuilder } from 'discord.js';
import { getPendingVerification, deletePendingVerification } from '../utils/verification.js';
import { saveLink, getLink, getLinkByUsername } from '../utils/database.js';
import { codesStore } from '../web/server.js';

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('ربط حساب MTA بحساب ديسكورد بعد التحقق في اللعبة'),

  async execute(interaction) {
    const pending = getPendingVerification(interaction.user.id);
    if (!pending) {
      return interaction.reply({
        content: '❌ مفيش طلب تحقق. اكتب `/verify` الأول.',
        flags: 64
      });
    }

    const existingOwnLink = await getLink(interaction.user.id);
    if (existingOwnLink && existingOwnLink.mta_username !== pending.mtaUsername) {
      return interaction.reply({
        content: `❌ حسابك مربوط بالفعل على **${existingOwnLink.mta_username}**. استخدم \`/unlink\` أولاً.`,
        flags: 64
      });
    }

    const usernameLink = await getLinkByUsername(pending.mtaUsername);
    if (usernameLink && usernameLink.discord_id !== interaction.user.id) {
      return interaction.reply({
        content: '❌ حساب الـ MTA ده مربوط بالفعل بحساب ديسكورد آخر.',
        flags: 64
      });
    }

    const verifiedCode = codesStore[pending.mtaUsername];
    if (!verifiedCode || verifiedCode !== pending.code) {
      return interaction.reply({
        content: [
          '⏳ لسه ما اتحققتش في اللعبة!',
          '',
          `ادخل اللعبة واكتب: \`/linkcheck ${pending.code}\``,
          'وبعدين ارجع اكتب `/link` هنا.',
        ].join('\n'),
        flags: 64
      });
    }

    await saveLink(interaction.user.id, pending.mtaUsername);
    delete codesStore[pending.mtaUsername];
    deletePendingVerification(interaction.user.id);

    await interaction.reply({
      content: `✅ تم ربط حساب **${pending.mtaUsername}** بحسابك على ديسكورد بنجاح!`,
      flags: 64
    });
  }
};

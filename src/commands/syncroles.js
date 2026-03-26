// © 2026 Ebrahem
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getAllLinks } from '../utils/database.js';
import { syncMemberRoles } from '../utils/autoSync.js';

export default {
  data: new SlashCommandBuilder()
    .setName('syncroles')
    .setDescription('مزامنة رولات جميع الأعضاء المرتبطين يدويًا')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const players = getAllLinks();
    if (players.length === 0) {
      return interaction.editReply({
        content: '❌ لا يوجد أي حسابات مربوطة في قاعدة البيانات.'
      });
    }

    let success = 0;
    let failed = 0;
    const failReasons = [];

    for (const { discord_id, mta_username } of players) {
      try {
        const result = await syncMemberRoles(interaction.guild, discord_id);

        if (result.ok) {
          success++;
        } else {
          failed++;
          if (result.reason === 'missing_sector') {
            failReasons.push(`• ${mta_username}: لا توجد بيانات قطاع بعد.`);
          } else if (result.reason === 'member_not_found') {
            failReasons.push(`• ${mta_username}: العضو غير موجود داخل السيرفر.`);
          } else {
            failReasons.push(`• ${mta_username}: فشل غير معروف.`);
          }
        }
      } catch (error) {
        failed++;
        failReasons.push(`• ${mta_username}: ${error.message}`);
      }
    }

    const details = failReasons.length
      ? `\n\nأسباب الفشل:\n${failReasons.slice(0, 10).join('\n')}`
      : '';

    await interaction.editReply({
      content: `✅ تمت المزامنة! نجح: **${success}** | فشل: **${failed}**${details}`
    });
  }
};

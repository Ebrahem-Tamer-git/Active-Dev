// © 2026 Ebrahem
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getAllLinks, updateSector } from '../utils/database.js';
import { sectorsCache } from '../utils/autoSync.js';
import { getRoleId, sectorRoleMap } from '../utils/sectorRoles.js';

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

    const allRoleIds = Object.values(sectorRoleMap)
      .flatMap(r => [r.member, r.leader])
      .filter(Boolean);

    for (const { discord_id, mta_username } of players) {
      try {
        const cached = sectorsCache.get(discord_id);
        if (!cached) {
          failed++;
          failReasons.push(`• ${mta_username}: لا توجد بيانات قطاع بعد. القطاع ما زال غير متزامن من MTA.`);
          continue;
        }

        const member = await interaction.guild.members.fetch(discord_id).catch(() => null);
        if (!member) {
          failed++;
          failReasons.push(`• ${mta_username}: العضو غير موجود داخل السيرفر أو البوت لا يستطيع الوصول له.`);
          continue;
        }

        const roleId = getRoleId(cached.sector, cached.isLeader);
        if (!roleId) {
          failed++;
          failReasons.push(`• ${mta_username}: لا يوجد رول معرف للقطاع [${cached.sector}].`);
          continue;
        }

        await member.roles.remove(allRoleIds).catch(() => null);
        await member.roles.add(roleId);

        updateSector(discord_id, cached.sector, cached.isLeader);
        success++;
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

// © 2026 Ebrahem
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getAllLinks, updateSector } from '../utils/database.js';
import { sectorsCache } from '../utils/autoSync.js';
import { getRoleId, sectorRoleMap } from '../utils/sectorRoles.js';

export default {
  data: new SlashCommandBuilder()
    .setName('syncroles')
    .setDescription('مزامنة رولات جميع الأعضاء المرتبطين يدوياً')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const players = getAllLinks();
    let success = 0, failed = 0;

    const allRoleIds = Object.values(sectorRoleMap)
      .flatMap(r => [r.member, r.leader])
      .filter(Boolean);

    for (const { discord_id } of players) {
      try {
        const cached = sectorsCache.get(discord_id);
        if (!cached) { failed++; continue; }

        const member = await interaction.guild.members.fetch(discord_id).catch(() => null);
        if (!member) { failed++; continue; }

        const roleId = getRoleId(cached.sector, cached.isLeader);
        if (!roleId) { failed++; continue; }

        await member.roles.remove(allRoleIds).catch(() => null);
        await member.roles.add(roleId);
        updateSector(discord_id, cached.sector, cached.isLeader);
        success++;
      } catch {
        failed++;
      }
    }

    await interaction.editReply({
      content: `✅ تمت المزامنة! نجح: **${success}** | فشل: **${failed}**`
    });
  }
};
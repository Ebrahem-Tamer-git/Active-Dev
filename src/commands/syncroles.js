//loqmanas dev
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getAllLinkedPlayers, getMtaSector } from '../utils/mtaAPI.js';
import { sectorRoleMap } from '../utils/sectorRoles.js';

export default {
  data: new SlashCommandBuilder()
    .setName('syncroles')
    .setDescription('مزامنة جميع رولات Discord مع حالة القطاعات في MTA')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const linkedPlayers = await getAllLinkedPlayers();
    let success = 0;
    let failed = 0;
    for (const { discordId } of linkedPlayers) {
      const member = await interaction.guild.members.fetch(discordId).catch(() => null);
      if (!member) { failed++; continue; }
      const mtaInfo = await getMtaSector(discordId);
      if (!mtaInfo.success) { failed++; continue; }
      const roleId = sectorRoleMap[mtaInfo.sector];
      if (!roleId) { failed++; continue; }
      try {
        await member.roles.add(roleId);
        success++;
      } catch {
        failed++;
      }
    }
    await interaction.editReply({ content: `✅ تم مزامنة الرولات. نجح: ${success}, فشل: ${failed}` });
  }
};
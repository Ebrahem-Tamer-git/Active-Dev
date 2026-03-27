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

    const players = await getAllLinks();
    if (players.length === 0) {
      return interaction.editReply({ content: '❌ لا يوجد أي حسابات مربوطة في قاعدة البيانات.' });
    }

    let success = 0;
    let failed = 0;

    for (const { discord_id } of players) {
      const result = await syncMemberRoles(interaction.guild, discord_id).catch(() => null);
      if (result?.ok) success++;
      else failed++;
    }

    await interaction.editReply({
      content: `✅ تمت المزامنة! نجح: **${success}** | فشل: **${failed}**`
    });
  }
};

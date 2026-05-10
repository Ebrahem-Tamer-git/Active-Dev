import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { ensureLinkPanelMessage } from '../panel/linkPanel.js';

export default {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('نشر أو تحديث لوحة الربط')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await ensureLinkPanelMessage(interaction.client, interaction.channelId);
    await interaction.editReply({ content: 'تم نشر/تحديث لوحة الربط.' });
  }
};

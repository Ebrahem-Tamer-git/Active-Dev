import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { ensureLinkPanelMessage } from '../panel/linkPanel.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Publish or refresh the account linking panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await ensureLinkPanelMessage(interaction.client, interaction.channelId);
    await interaction.editReply({ content: 'Panel published/updated.' });
  }
};

export const data = command.data;
export const execute = command.execute;
export default command;

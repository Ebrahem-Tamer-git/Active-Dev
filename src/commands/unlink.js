// © 2026 Ebrahem
import { SlashCommandBuilder } from 'discord.js';
import { deleteLink, getLink } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('إلغاء ربط حساب MTA بحساب ديسكورد'),

  async execute(interaction) {
    const link = getLink(interaction.user.id);
    if (!link) {
      return interaction.reply({
        content: '❌ حسابك مش مرتبط بأي حساب MTA.',
        flags: 64
      });
    }
    deleteLink(interaction.user.id);
    await interaction.reply({
      content: `✅ تم إلغاء ربط حساب **${link.mta_username}** بنجاح.`,
      flags: 64
    });
  }
};

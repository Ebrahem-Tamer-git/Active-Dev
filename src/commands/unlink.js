//loqmanas dev
import { SlashCommandBuilder } from 'discord.js';
import { unbindMtaAccount } from '../utils/mtaAPI.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('إلغاء ربط حساب MTA بحساب Discord الحالي'),

  async execute(interaction) {
    const result = await unbindMtaAccount(interaction.user.id);
    if (result.success) {
      await interaction.reply({ content: '✅ تم إلغاء الربط بنجاح.', ephemeral: true });
    } else {
      await interaction.reply({ content: `❌ فشل الإلغاء: ${result.message}`, ephemeral: true });
    }
  }
};
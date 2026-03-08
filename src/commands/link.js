import { SlashCommandBuilder } from 'discord.js';
import { getPendingVerification } from '../utils/verification.js';
import { bindMtaAccount } from '../utils/mtaAPI.js';
import { saveLink } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('ربط حساب MTA الخاص بك بحساب Discord')
    .addStringOption(opt => opt.setName('code').setDescription('رمز التحقق الذي حصلت عليه داخل اللعبة').setRequired(true)),

  async execute(interaction) {
    const code = interaction.options.getString('code');
    const pending = getPendingVerification(interaction.user.id);
    if (!pending || pending.code !== code) {
      return interaction.reply({ content: '❌ الرمز غير صالح أو منتهي الصلاحية.', ephemeral: true });
    }
    // استدعاء API اللعبة لتأكيد الربط
    const result = await bindMtaAccount(pending.mtaUsername, interaction.user.id);
    if (result.success) {
      saveLink(interaction.user.id, pending.mtaUsername);
      await interaction.reply({ content: `✅ تم ربط حساب **${pending.mtaUsername}** بحسابك على Discord.`, ephemeral: true });
    } else {
      await interaction.reply({ content: `❌ فشل الربط: ${result.message}`, ephemeral: true });
    }
  }
};
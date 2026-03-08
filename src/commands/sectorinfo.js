//loqmanas dev
import { SlashCommandBuilder } from 'discord.js';
import { getMtaSector } from '../utils/mtaAPI.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sectorinfo')
    .setDescription('عرض معلومات القطاع الحالي للعضو داخل MTA')
    .addUserOption(opt => opt.setName('member').setDescription('العضو المطلوب').setRequired(true)),

  async execute(interaction) {
    const member = interaction.options.getUser('member');
    const info = await getMtaSector(member.id);
    if (!info.success) {
      return interaction.reply({ content: `❌ لا يمكن جلب معلومات القطاع: ${info.message}`, ephemeral: true });
    }
    await interaction.reply({ content: `🛰️ العضو **${member.tag}** في قطاع **${info.sector}** مع رتبة **${info.rank || 'غير محدد'}**.`, ephemeral: true });
  }
};
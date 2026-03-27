// © 2026 Ebrahem
import { SlashCommandBuilder } from 'discord.js';
import { getLink } from '../utils/database.js';
import { sectorsCache } from '../utils/autoSync.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sectorinfo')
    .setDescription('عرض معلومات القطاع الحالي للعضو')
    .addUserOption(opt =>
      opt.setName('member')
        .setDescription('العضو المطلوب')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('member');
    const link = await getLink(user.id);

    if (!link) {
      return interaction.reply({
        content: `❌ العضو **${user.tag}** مش مرتبط بأي حساب MTA.`,
        flags: 64
      });
    }

    const cached = sectorsCache.get(user.id);
    const sector = cached?.sector || link.sector || 'غير معروف';
    const isLeader = cached?.isLeader || Boolean(link.is_leader);

    await interaction.reply({
      content: [
        `👤 **${user.tag}**`,
        `🎮 حساب MTA: \`${link.mta_username}\``,
        `🏛️ القطاع: **${sector}**`,
        `⭐ الرتبة: **${isLeader ? 'قيادة' : 'فرد'}**`,
      ].join('\n'),
      flags: 64
    });
  }
};

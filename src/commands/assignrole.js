//loqmanas dev
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getMtaSector } from '../utils/mtaAPI.js';
import { sectorRoleMap } from '../utils/sectorRoles.js';

export default {
  data: new SlashCommandBuilder()
    .setName('assignrole')
    .setDescription('إعطاء رولت Discord تلقائياً بناءً على قطاع MTA الحالي')
    .addUserOption(opt => opt.setName('member').setDescription('العضو الذي تريد تحديث روله').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const member = interaction.options.getMember('member');
    const mtaInfo = await getMtaSector(member.id);
    if (!mtaInfo.success) {
      return interaction.reply({ content: `❌ لا يمكن جلب معلومات القطاع: ${mtaInfo.message}`, ephemeral: true });
    }
    const sector = mtaInfo.sector; // مثال: 'Police'
    const roleId = sectorRoleMap[sector];
    if (!roleId) {
      return interaction.reply({ content: `❌ لا توجد رولت معرفة للقطاع **${sector}**.`, ephemeral: true });
    }
    try {
      await member.roles.add(roleId);
      await interaction.reply({ content: `✅ تم إضافة رولت <@&${roleId}> للعضو ${member.user.tag} وفقاً لقطاع **${sector}**.`, ephemeral: true });
    } catch (e) {
      console.error(e);
      await interaction.reply({ content: '❌ فشلت عملية إضافة الرولت.', ephemeral: true });
    }
  }
};
// © 2026 Ebrahem
import { SlashCommandBuilder } from 'discord.js';
import { getPendingVerification, deletePendingVerification } from '../utils/verification.js';
import { saveLink } from '../utils/database.js';
import { codesStore } from '../web/server.js';
import { syncMemberRoles, sectorsCache } from '../utils/autoSync.js';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('ربط حساب MTA بحساب ديسكورد بعد التحقق في اللعبة'),

  async execute(interaction) {
    const pending = getPendingVerification(interaction.user.id);
    if (!pending) {
      return interaction.reply({
        content: '❌ مفيش طلب تحقق. اكتب `/verify` الأول.',
        flags: 64
      });
    }

    const verifiedCode = codesStore[pending.mtaUsername];
    if (!verifiedCode || verifiedCode !== pending.code) {
      return interaction.reply({
        content: [
          '⏳ لسه ما اتحققتش في اللعبة!',
          '',
          `ادخل اللعبة واكتب: \`/linkcheck ${pending.code}\``,
          'وبعدين ارجع اكتب `/link` هنا.',
        ].join('\n'),
        flags: 64
      });
    }

    saveLink(interaction.user.id, pending.mtaUsername);
    delete codesStore[pending.mtaUsername];
    deletePendingVerification(interaction.user.id);

    await interaction.reply({
      content: `✅ تم ربط حساب **${pending.mtaUsername}** بحسابك على ديسكورد بنجاح! جاري محاولة مزامنة الرول...`,
      flags: 64
    });

    const guild = interaction.guild;
    if (!guild) {
      return;
    }

    let syncResult = null;

    for (let i = 0; i < 4; i++) {
      if (sectorsCache.has(interaction.user.id)) {
        syncResult = await syncMemberRoles(guild, interaction.user.id).catch(() => null);
        if (syncResult?.ok) break;
      }
      await wait(5000);
    }

    if (syncResult?.ok) {
      return interaction.followUp({
        content: `✅ تم إعطاء الرول تلقائيًا بنجاح. القطاع: **${syncResult.sector}**`,
        flags: 64
      });
    }

    return interaction.followUp({
      content: 'ℹ️ تم الربط بنجاح، لكن بيانات القطاع لم تصل في الوقت الحالي. الرول سيتعمل له مزامنة تلقائية خلال ثوانٍ، أو استخدم `/syncroles`.',
      flags: 64
    });
  }
};

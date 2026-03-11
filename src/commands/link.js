// © 2026 Ebrahem
import { SlashCommandBuilder } from 'discord.js';
import { getPendingVerification, deletePendingVerification } from '../utils/verification.js';
import { saveLink } from '../utils/database.js';
import { codesStore } from '../web/server.js';

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

    // تحقق إن اللاعب كتب /linkcheck في اللعبة
    const verifiedCode = codesStore[pending.mtaUsername];
    if (!verifiedCode || verifiedCode !== pending.code) {
      return interaction.reply({
        content: [
          `⏳ لسه ما اتحققتش في اللعبة!`,
          ``,
          `ادخل اللعبة واكتب: \`/linkcheck ${pending.code}\``,
          `وبعدين ارجع اكتب \`/link\` هنا.`,
        ].join('\n'),
        flags: 64
      });
    }

    // احفظ الربط
    saveLink(interaction.user.id, pending.mtaUsername);
    delete codesStore[pending.mtaUsername];
    deletePendingVerification(interaction.user.id);

    await interaction.reply({
      content: `✅ تم ربط حساب **${pending.mtaUsername}** بحسابك على ديسكورد بنجاح! 🎉`,
      flags: 64
    });
  }
};

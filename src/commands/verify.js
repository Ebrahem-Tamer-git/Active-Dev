//loqmanas dev
import { SlashCommandBuilder } from 'discord.js';
import { generateVerifyCode } from '../utils/verification.js';
import { sendVerificationCodeToMta } from '../utils/mtaAPI.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('إنشاء رمز تحقق جديد لاستخدامه داخل MTA')
    .addStringOption(opt => opt.setName('username').setDescription('اسم حسابك داخل MTA').setRequired(true)),

  async execute(interaction) {
    const username = interaction.options.getString('username');
    const { code, expiresAt } = generateVerifyCode(interaction.user.id, username);
    
    console.log(`[Verify] محاولة إرسال كود للاعب ${username}: ${code}`);
    
    const sent = await sendVerificationCodeToMta(username, code);
    
    console.log(`[Verify] نتيجة الإرسال: ${sent}`);
    
    if (!sent) {
      return interaction.reply({ 
        content: '❌ فشل إرسال الرمز إلى اللعبة. تأكد من تشغيل خادم MTA API.', 
        flags: 64
      });
    }
    await interaction.reply({
      content: `✅ تم إنشاء رمز verification. استخدم الرمز **${code}** داخل اللعبة خلال ${Math.floor((expiresAt - Date.now()) / 1000)} ثانية.`,
      flags: 64
    });
  }
};

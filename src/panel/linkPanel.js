import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder
} from 'discord.js';
import { config } from '../config.js';
import { consumeVerifiedCode } from '../web/server.js';
import { deleteLink, getLink, getLinkByUsername, saveLink } from '../utils/database.js';
import { syncMemberRoles } from '../utils/autoSync.js';


const BUTTON_IDS = {
  start: 'panel:start_link',
  status: 'panel:link_status',
  unlink: 'panel:unlink',
  sync: 'panel:sync_roles',
  help: 'panel:help'
};

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('لوحة ربط الحساب')
    .setDescription(
      [
        '1) ادخل MTA ثم F1 وأنشئ كود الربط.',
        '2) اضغط زر "بدء الربط" هنا.',
        '3) البوت سيرسل لك رسالة خاصة، أرسل فيها الكود.',
        '4) بعد نجاح الربط، الرتب تتحدث تلقائيًا.'
      ].join('\n')
    );
}

function buildPanelRows() {
  const rowOne = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BUTTON_IDS.start).setLabel('بدء الربط').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(BUTTON_IDS.status).setLabel('حالة الربط').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BUTTON_IDS.unlink).setLabel('فك الربط').setStyle(ButtonStyle.Danger)
  );

  const rowTwo = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BUTTON_IDS.sync).setLabel('مزامنة الرتب').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(BUTTON_IDS.help).setLabel('المساعدة').setStyle(ButtonStyle.Secondary)
  );

  return [rowOne, rowTwo];
}

function normalizeCode(input) {
  return String(input || '').trim().toUpperCase();
}

export function isPanelButton(customId) {
  return Object.values(BUTTON_IDS).includes(customId);
}

export async function ensureLinkPanelMessage(client, preferredChannelId = null) {
  const channelId = preferredChannelId || config.panelChannelId;
  if (!channelId) {
    console.warn('[Panel] PANEL_CHANNEL_ID is missing. Panel message was not created.');
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) {
    console.warn('[Panel] PANEL_CHANNEL_ID is invalid or not a text channel.');
    return;
  }

  const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  const existing = recent?.find(
    (message) =>
      message.author?.id === client.user.id &&
      message.embeds?.[0]?.title === 'لوحة ربط الحساب' &&
      message.components?.some((row) =>
        row.components?.some((component) => component.customId === BUTTON_IDS.start)
      )
  );

  const payload = {
    embeds: [buildPanelEmbed()],
    components: buildPanelRows()
  };

  if (existing) {
    await existing.edit(payload);
    console.log('[Panel] Existing panel message updated.');
    return;
  }

  await channel.send(payload);
  console.log('[Panel] New panel message sent.');
}

async function sendDmStartFlow(user) {
  await user.send({
    embeds: [
      new EmbedBuilder()
        .setTitle('إكمال الربط')
        .setDescription(
          [
            'أرسل كود الربط هنا في الخاص الآن.',
            'الكود يجب أن يكون نفس الذي أنشأته من داخل MTA (F1).'
          ].join('\n')
        )
    ]
  });
}

async function showLinkStatus(interaction) {
  const link = await getLink(interaction.user.id);
  if (!link) {
    return interaction.editReply({ content: 'حسابك غير مربوط بأي حساب MTA.' });
  }

  return interaction.editReply({
    content: `حسابك مربوط على MTA: \`${link.mta_username}\``
  });
}

async function unlinkAccount(interaction) {
  const link = await getLink(interaction.user.id);
  if (!link) {
    return interaction.editReply({ content: 'لا يوجد ربط لإلغائه.' });
  }

  await deleteLink(interaction.user.id);
  return interaction.editReply({
    content: `تم فك ربط حساب \`${link.mta_username}\` بنجاح.`
  });
}

async function syncMyRoles(interaction) {
  const link = await getLink(interaction.user.id);
  if (!link) {
    return interaction.editReply({ content: 'اربط حسابك أولاً ثم أعد المحاولة.' });
  }

  if (!interaction.guild) {
    return interaction.editReply({ content: 'زر المزامنة يعمل من داخل السيرفر فقط.' });
  }

  const fallback = {
    sector: link.sector ?? null,
    isLeader: Boolean(link.is_leader)
  };
  const result = await syncMemberRoles(interaction.guild, interaction.user.id, fallback).catch(() => null);

  if (!result?.ok) {
    return interaction.editReply({ content: `فشلت المزامنة الآن: \`${result?.reason || 'unknown'}\`` });
  }

  return interaction.editReply({ content: 'تمت مزامنة الرتب بنجاح.' });
}

async function showHelp(interaction) {
  return interaction.editReply({
    content: [
      'خطوات الربط:',
      '1) من MTA ادخل F1 وأنشئ الكود.',
      '2) اضغط "بدء الربط".',
      '3) أرسل الكود في خاص البوت.',
      '4) سيتم ربط حسابك وتحديث الرتب.'
    ].join('\n')
  });
}

export async function handlePanelButton(interaction) {
  await interaction.deferReply({ ephemeral: true });

  if (interaction.customId === BUTTON_IDS.start) {
    const dmChannel = await interaction.user.createDM().catch(() => null);
    if (!dmChannel) {
      return interaction.editReply({ content: 'لا أستطيع إرسال خاص لك. افتح الرسائل الخاصة ثم أعد المحاولة.' });
    }

    await sendDmStartFlow(interaction.user);
    return interaction.editReply({ content: 'تم إرسال رسالة خاصة لك. أرسل الكود هناك.' });
  }

  if (interaction.customId === BUTTON_IDS.status) {
    return showLinkStatus(interaction);
  }

  if (interaction.customId === BUTTON_IDS.unlink) {
    return unlinkAccount(interaction);
  }

  if (interaction.customId === BUTTON_IDS.sync) {
    return syncMyRoles(interaction);
  }

  if (interaction.customId === BUTTON_IDS.help) {
    return showHelp(interaction);
  }

  return interaction.editReply({ content: 'زر غير معروف.' });
}

export async function handleDmCodeMessage(client, message) {
  if (!message || message.author.bot) return false;
  if (message.channel.type !== ChannelType.DM) return false;

  const code = normalizeCode(message.content);
  if (!code) return false;

  const verified = consumeVerifiedCode(code);
  if (!verified) {
    await message.reply('الكود غير صحيح أو منتهي. أنشئ كود جديد من داخل MTA ثم أرسله هنا.');
    return true;
  }

  const currentLink = await getLink(message.author.id);
  if (currentLink && currentLink.mta_username !== verified.mtaUsername) {
    await message.reply(
      `حسابك مربوط حاليًا على \`${currentLink.mta_username}\`. فك الربط أولاً من لوحة الأزرار.`
    );
    return true;
  }

  const usernameLinked = await getLinkByUsername(verified.mtaUsername);
  if (usernameLinked && usernameLinked.discord_id !== message.author.id) {
    await message.reply('هذا الحساب مربوط بحساب ديسكورد آخر.');
    return true;
  }

  await saveLink(message.author.id, verified.mtaUsername);

  const guild = client.guilds.cache.get(config.guildId);
  if (guild) {
    const link = await getLink(message.author.id);
    const fallback = {
      sector: link?.sector ?? null,
      isLeader: Boolean(link?.is_leader)
    };
    await syncMemberRoles(guild, message.author.id, fallback).catch(() => null);
  }

  await message.reply(`تم الربط بنجاح: \`${verified.mtaUsername}\``);
  return true;
}

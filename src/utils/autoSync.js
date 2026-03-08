import { getMtaSector } from './mtaAPI.js';
import { sectorRoleMap } from './sectorRoles.js';
import { getAllLinks, updateSector } from './database.js';

const SYNC_INTERVAL_MS = 10_000; // 10 ثواني

export function startAutoSync(client) {
  console.log('🔄 Auto-sync started (every 10s)');

  setInterval(async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const players = getAllLinks();
    if (players.length === 0) return;

    let success = 0, failed = 0;

    for (const { discord_id } of players) {
      try {
        const member = await guild.members.fetch(discord_id).catch(() => null);
        if (!member) { failed++; continue; }

        const mtaInfo = await getMtaSector(discord_id);
        if (!mtaInfo.success) { failed++; continue; }

        const roleId = sectorRoleMap[mtaInfo.sector];
        if (!roleId) { failed++; continue; }

        // إزالة كل رولات القطاعات القديمة أولاً
        const sectorRoleIds = Object.values(sectorRoleMap);
        await member.roles.remove(sectorRoleIds).catch(() => null);

        // إضافة الرول الجديد
        await member.roles.add(roleId);

        // حفظ القطاع في قاعدة البيانات
        updateSector(discord_id, mtaInfo.sector);

        success++;
      } catch (e) {
        console.error(`[AutoSync] خطأ مع ${discord_id}:`, e.message);
        failed++;
      }
    }

    if (success > 0 || failed > 0) {
      console.log(`[AutoSync] ✅ نجح: ${success} | ❌ فشل: ${failed}`);
    }
  }, SYNC_INTERVAL_MS);
}

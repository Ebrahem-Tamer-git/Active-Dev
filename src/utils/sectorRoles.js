// © 2026 Ebrahem
// خريطة ربط القطاعات برولات ديسكورد
// faction name (من MTA) => discord role id

export const sectorRoleMap = {
  // شرطة L.S.P.D
  '|| L.S.P.D ||': {
    member: '1479113920718442552',  // الأفراد
    leader: '1479113920718442553',  // القيادات
  },

  // مدنيين (بدون فاكشن)
  'Civilians': {
    member: '1479113920697335941',
    leader: null,
  }
};

// جيب الرول المناسب بناءً على القطاع والرتبة
export function getRoleId(factionName, isLeader = false) {
  const entry = sectorRoleMap[factionName];
  if (!entry) return null;
  return isLeader ? entry.leader : entry.member;
}

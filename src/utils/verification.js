//loqmanas dev
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

// تخزين رموز التحقق مؤقتاً في الذاكرة (يمكن استبداله بقاعدة بيانات)
const pendingVerifications = new Map();

export function generateVerifyCode(discordId, mtaUsername) {
  const code = uuidv4().split('-')[0]; // رمز قصير
  const expiresAt = Date.now() + config.verifyCodeTTL * 1000;
  pendingVerifications.set(discordId, { code, mtaUsername, expiresAt });
  // حذف الرمز بعد الانتهاء
  setTimeout(() => pendingVerifications.delete(discordId), config.verifyCodeTTL * 1000);
  return { code, expiresAt };
}

export function getPendingVerification(discordId) {
  const data = pendingVerifications.get(discordId);
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    pendingVerifications.delete(discordId);
    return null;
  }
  return data;
}

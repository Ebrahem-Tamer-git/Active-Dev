//loqmanas dev
import fetch from 'node-fetch';
import { config } from '../config.js';

// هذه الوظائف هي مجرد نماذج وتحتاج إلى تنفيذ جانبي على خادم MTA لتستجيب للطلبات
export async function bindMtaAccount(mtaUsername, discordId) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/bind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mtaUsername, discordId })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return { success: false, message: 'خطأ في الاتصال بخادم MTA.' };
  }
}

export async function unbindMtaAccount(discordId) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/unbind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return { success: false, message: 'خطأ في الاتصال بخادم MTA.' };
  }
}

export async function sendVerificationCodeToMta(mtaUsername, code) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mtaUsername, code })
    });
    const data = await res.json();
    return data.success;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function getMtaSector(discordId) {
  try {
    const res = await fetch(`${config.mtaApiUrl}/sector/${discordId}`);
    return await res.json();
  } catch (e) {
    console.error(e);
    return { success: false, message: 'فشل جلب البيانات من MTA.' };
  }
}

export async function getAllLinkedPlayers() {
  try {
    const res = await fetch(`${config.mtaApiUrl}/linked`);
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

// © 2026 Ebrahem
import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  token:          process.env.DISCORD_TOKEN,
  clientId:       process.env.CLIENT_ID,
  guildId:        process.env.GUILD_ID,
  panelChannelId: process.env.PANEL_CHANNEL_ID,
  verifyCodeTTL:  Number(process.env.VERIFY_CODE_TTL) || 300,
  port:           Number(process.env.PORT) || 5000,
};

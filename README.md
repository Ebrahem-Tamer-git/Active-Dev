# Active-Dev (Button-First Linking)

Discord bot for linking MTA accounts to Discord using a code generated in-game.

## User flow

1. Player opens MTA `F1` tab and generates link code.
2. Player presses `بدء الربط` button in Discord panel.
3. Bot sends DM and asks player to send the code.
4. Bot validates code, links account, and syncs roles.

## Required env vars

- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID`
- `PORT`
- `DATABASE_URL`
- `DATABASE_SSL` (`true` for hosted Postgres with SSL)
- `VERIFY_CODE_TTL` (default `300`)
- `PANEL_CHANNEL_ID` (channel where the panel is auto-published)

## Commands

- `/panel` (admin): publish or refresh linking panel in current channel.
- `/syncroles` (admin): force role sync for all linked users.

## API endpoints (used by MTA/resource)

- `POST /mta/verified` with `{ mtaUsername, code }`
- `POST /mta/sector` with `{ discordId | mtaUsername, sector, isLeader }`
- `GET /api/linked`
- `GET /api/get-code/:username`

## Notes

- Bot needs `Manage Roles` permission.
- `Message Content Intent` must be enabled in Discord Developer Portal so DM code messages can be read.

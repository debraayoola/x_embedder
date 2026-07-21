# Teco — X/Twitter Components V2 Bot

Auto-detects X/Twitter links in chat and posts them as a Discord
**Components V2 Container** (not a classic embed) with author, avatar,
tweet text, **all photos and full playable videos** (not just a
thumbnail), and reply/retweet/like/view stats.

## Files

- `index.js` — bot logic + tiny keep-alive HTTP server (for Render)
- `package.json` — dependencies
- `render.yaml` — optional Render service config

## Deploy on Render

1. Push these files to a GitHub repo (e.g. `teco-bot`).
1. On [render.com](https://render.com) → **New +** → **Web Service**.
1. Connect your repo.
1. Settings:
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free is fine to start
1. Under **Environment Variables**, add:
- `DISCORD_TOKEN` = your bot token (from discord.com/developers → your app → Bot)
1. Click **Create Web Service**. Render will build and start the bot.
1. Once live, invite the bot to your server (OAuth2 → URL Generator →
   scopes `bot`, permissions `Send Messages`, `Embed Links`,
   `Use External Emojis`).

## Notes

- Render’s free web services spin down after inactivity and spin back
  up on the next request — the built-in Express server keeps a port
  open so Render’s health checks succeed, but if the bot needs to stay
  **always on** (not sleep), use Render’s paid **Starter** plan instead
  of Free, or ping the `/` route periodically with an external uptime
  monitor (e.g. UptimeRobot) hitting your Render URL every few minutes.
- Components V2 requires **discord.js v14.16.0+** and the
  `MessageFlags.IsComponentsV2` flag — you cannot mix `content` or
  `embeds` with `components` on the same message when this flag is set.
- Make sure **Message Content Intent** is enabled for your bot in the
  Discord Developer Portal (Bot settings), or it won’t see message text.
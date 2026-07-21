// Teco - Discord bot entry point (Render-ready)
// Combines the X/Twitter Components V2 embedder with a tiny HTTP
// server so Render's health check has a port to bind to.

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Teco is running.'));
app.listen(PORT, () => console.log(`Keep-alive server on port ${PORT}`));

const {
  Client,
  GatewayIntentBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  MessageFlags,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TWEET_URL_REGEX = /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/i;

client.once('ready', () => {
  console.log(`Teco is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const match = message.content.match(TWEET_URL_REGEX);
  if (!match) return;

  const [originalUrl, , tweetId] = match;

  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${tweetId}`);
    if (!res.ok) return;

    const data = await res.json();
    const tweet = data.tweet;
    if (!tweet) return;

    const postedDate = new Date(tweet.created_timestamp * 1000).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    // Header: author name/handle + avatar thumbnail
    const headerSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**${tweet.author.name}** (@${tweet.author.screen_name})\n${tweet.text ?? ''}`
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(tweet.author.avatar_url)
      );

    const container = new ContainerBuilder()
      .setAccentColor(0x1d9bf0)
      .addSectionComponents(headerSection);

    // Media: pull in every photo AND full video (not just a thumbnail),
    // supporting posts with multiple attachments. Discord's Media
    // Gallery accepts up to 10 items and renders both images and
    // playable videos when given a direct media URL.
    const galleryItems = [];

    for (const photo of tweet.media?.photos ?? []) {
      galleryItems.push(new MediaGalleryItemBuilder().setURL(photo.url));
    }

    for (const video of tweet.media?.videos ?? []) {
      // variants are different bitrate/quality renditions — pick the highest bitrate mp4
      const best = (video.variants ?? [])
        .filter((v) => v.content_type === 'video/mp4')
        .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];
      const videoUrl = best?.url ?? video.url;
      if (videoUrl) {
        galleryItems.push(new MediaGalleryItemBuilder().setURL(videoUrl));
      }
    }

    if (galleryItems.length) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(...galleryItems.slice(0, 10))
      );
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    // Footer: stats + open link + timestamp
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `💬 ${tweet.replies ?? 0}  🔁 ${tweet.retweets ?? 0}  ❤️ ${tweet.likes ?? 0}  👁 ${tweet.views ?? 'N/A'}\n` +
        `[Open in X](${originalUrl}) • Posted ${postedDate}`
      )
    );

    await message.suppressEmbeds(true).catch(() => {});

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (err) {
    console.error('Teco embed error:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);

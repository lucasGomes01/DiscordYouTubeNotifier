import { config } from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import { google } from 'googleapis';
import { schedule } from 'node-cron';

config();

const discordClient = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds
    ]
});

const youtubeClient = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

let latestVideoId = '';

discordClient.login(process.env.DISCORD_TOKEN);

discordClient.on('ready', () => {
    console.log(`Bot is ready, logged in as ${discordClient.user?.tag}`);    
    checkNewVideos();
    schedule('* * 0 * * *', checkNewVideos);
});

async function checkNewVideos() {
    try {
        const response = await youtubeClient.search.list({
            channelId: process.env.YOUTUBE_CHANNEL_ID,
            order: 'date',
            part: 'snippet',
            type: 'video',
            maxResults: 1
        }).then(res => res);

        const latestVideo = response.data.items?.[0];
        
        if (latestVideo?.id.videoId !== latestVideoId){
            latestVideoId = latestVideo?.id.videoId;
            const videoUrl = `https://www.youtube.com/watch?v=${latestVideo?.id.videoId}`;
            const message = "Confira o último vídeo do canal";
            const channel = discordClient.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
            channel.send(`${message} ${videoUrl}`);
        }
    } catch (error) {
        console.error(error);
    }
};
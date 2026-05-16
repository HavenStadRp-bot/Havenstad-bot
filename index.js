const {
    Client,
    GatewayIntentBits
} = require('discord.js');

const express = require('express');
const app = express();

// ====== WEB SERVER (voor uptime) ======
app.get('/', (req, res) => {
    res.send('Bot is alive');
});

app.listen(3000, () => {
    console.log('Webserver running');
});

// ====== DISCORD BOT ======
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const TOKEN = process.env.JE_BOT_TOKEN;
const TARGET_CHANNEL_ID = '1505314324976242840';

// whitelist (niet bannen)
const whitelist = [
    '1189931854657224858'
];

client.once('ready', () => {
    console.log(`${client.user.tag} is online`);
});

client.on('messageCreate', async (message) => {

    if (!message.guild) return;
    if (message.author.bot) return;
    if (whitelist.includes(message.author.id)) return;
    if (message.channel.id !== TARGET_CHANNEL_ID) return;

    try {

        // ===== DM sturen =====
        try {
            await message.author.send(
                'You are banned.\nReason: Anti Raid/Scam\nFor unban DM @brammetjeb123.'
            );
            console.log('DM verstuurd');
        } catch (err) {
            console.log('DM mislukt:', err.message);
        }

        // kleine delay zodat DM kan aankomen
        await new Promise(r => setTimeout(r, 1500));

        // bericht verwijderen
        await message.delete().catch(() => {});

        // ban
        await message.guild.members.ban(message.author.id, {
            deleteMessageSeconds: 60 * 60 * 24 * 7,
            reason: 'Anti Raid/Scam'
        });

        console.log(`${message.author.tag} geband`);

    } catch (err) {
        console.error('FOUT:', err);
    }

});

client.login(TOKEN);

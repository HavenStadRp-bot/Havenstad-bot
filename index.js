const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const prefix = "!";
const SSU_ROLE = "1404867280546041986"; // SSU ping rol
const SSU_PERMISSION_ROLE = "1404873533951312024"; // Rol die SSU mag starten/stoppen
const SSU_CHANNEL = "1404865394094637227"; // Kanaal voor SSU berichten

let ssuMessageId = null; // Om het bericht later te verwijderen

client.on("ready", () => {
    console.log(`✅ Ingelogd als ${client.user.tag}`);
});

// Command handler
client.on("messageCreate", async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // SSU START
    if (command === "ssu" && args[0] === "start") {
        if (!message.member.roles.cache.has(SSU_PERMISSION_ROLE)) {
            return message.reply("❌ Je hebt geen rechten om dit te doen.");
        }

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("Onze server is opgestart!")
            .setDescription(`Zorg ervoor dat je een beroep hebt.\nWe hopen dat je een goeie RP sessie hebt!\n[Ingame Server](roblox://placeId=2534724415&launchData=%7B%22psCode%22%3A%22YdJXu%22%7D)`)
            .setImage("https://cdn.discordapp.com/attachments/1394316929518272512/1404869627636351049/IMG_4993.jpg?ex=689cc24c&is=689b70cc&hm=e49efb45f259d7d92bda1caa7451668138479e1afb0d178f70dddb8f2e81eb13&")
            .setFooter({ text: `Gestart door ${message.author.tag}` });

        const channel = await client.channels.fetch(SSU_CHANNEL);
        const msg = await channel.send({ content: `<@&${SSU_ROLE}>`, embeds: [embed] });
        ssuMessageId = msg.id;
    }

    // SSU STOP
    if (command === "ssu" && args[0] === "stop") {
        if (!message.member.roles.cache.has(SSU_PERMISSION_ROLE)) {
            return message.reply("❌ Je hebt geen rechten om dit te doen.");
        }

        const channel = await client.channels.fetch(SSU_CHANNEL);
        if (ssuMessageId) {
            try {
                const oldMsg = await channel.messages.fetch(ssuMessageId);
                await oldMsg.delete();
            } catch (err) {
                console.log("Kon het oude SSU-bericht niet verwijderen:", err);
            }
            ssuMessageId = null;
        }

        const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Onze server is nu gesloten!")
            .setDescription(`Dit betekent niet dat je niet kan joinen, maar er is geen staff online!\nJoinen kan nog altijd via [Klik hier](roblox://placeId=2534724415&launchData=%7B%22psCode%22%3A%22YdJXu%22%7D)`)
            .setImage("https://cdn.discordapp.com/attachments/1394316929518272512/1404871028227706880/IMG_4996.jpg?ex=689cc39a&is=689b721a&hm=109cc458f150ba7b5e7663a75376e4e13762c53bd41ff1366fe22c9fa65ea08d&")
            .setFooter({ text: `Gestopt door ${message.author.tag}` });

        await channel.send({ embeds: [embed] });
    }

    // Kick command
    if (command === "kick") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply("❌ Je hebt geen rechten om dit te doen.");
        }
        const member = message.mentions.members.first();
        if (!member) return message.reply("Geef een gebruiker op om te kicken.");
        await member.kick();
        message.channel.send(`✅ ${member.user.tag} is gekickt.`);
    }

    // Ban command
    if (command === "ban") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply("❌ Je hebt geen rechten om dit te doen.");
        }
        const member = message.mentions.members.first();
        if (!member) return message.reply("Geef een gebruiker op om te bannen.");
        await member.ban();
        message.channel.send(`✅ ${member.user.tag} is verbannen.`);
    }
});

client.login(process.env.TOKEN);

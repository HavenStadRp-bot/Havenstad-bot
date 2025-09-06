const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    PermissionsBitField, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require("discord.js");
const express = require("express");

const app = express();
const port = process.env.PORT || 4000;

app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(port, () => console.log(`Express running on port ${port}`));

const client = new Client({ 
    intents: [ 
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ],
    partials: [Partials.Channel] 
});

const prefix = "!";
const staffRoles = [
    "1406025210527879238",
    "1406942631522734231",
    "1406942944627265536",
    "1406943073694515280",
    "1406943251826606234",
    "1406943483658371214"
];
const advocaatRole = "1405092984688611398";
const logChannelId = "1406026722620739654";

let activeMessage = null;

client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ---------- SSU START ----------
    if (command === "ssu" && args[0] === "start") {
        if (!staffRoles.some(r => message.member.roles.cache.has(r))) 
            return message.reply("❌ Je hebt geen permissie om dit te doen.");

        const embed = new EmbedBuilder()
            .setTitle(`🔰 HavenStad RP Server Opgestart (door ${message.author.tag})`)
            .setDescription(`Met onze server is opgestart!
Zorg ervoor dat je een beroep hebt.
We hopen dat je een goeie RP sessie hebt!

[Ingame Server](https://policeroleplay.community/join/YdJXu)`)
            .setColor("#006400")
            .setImage("https://cdn.discordapp.com/attachments/1394316929518272512/1404869627636351049/IMG_4993.jpg");

        const channel = message.guild.channels.cache.get("1404865394094637227");

        if (activeMessage) await activeMessage.delete().catch(() => {});
        activeMessage = await channel.send({ content: "<@&1404867280546041986>", embeds: [embed] });
    }

    // ---------- SSU STOP ----------
    if (command === "ssu" && args[0] === "stop") {
        if (!staffRoles.some(r => message.member.roles.cache.has(r))) 
            return message.reply("❌ Je hebt geen permissie om dit te doen.");

        const embed = new EmbedBuilder()
            .setTitle(`❌ HavenStad RP Server Gesloten (door ${message.author.tag})`)
            .setDescription(`Onze server is nu gesloten.
Dit betekent niet dat je niet kan joinen, maar er is geen staff online.
Joinen kan nog altijd via [Klik hier](https://policeroleplay.community/join/YdJXu)`)
            .setColor("#8B0000")
            .setImage("https://cdn.discordapp.com/attachments/1394316929518272512/1409458645938470942/image.png");

        const channel = message.guild.channels.cache.get("1404865394094637227");

        if (activeMessage) await activeMessage.delete().catch(() => {});
        activeMessage = await channel.send({ embeds: [embed] });
    }

    // ---------- EMBED ----------
    if (command === "embed") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) 
            return message.reply("❌ Geen permissie.");

        const targetChannel = message.mentions.channels.first();
        if (!targetChannel) return message.reply("⚠ Gebruik: !embed #kanaal tekst | kleur | imageURL");

        const parts = args.slice(1).join(" ").split("|").map(p => p.trim());
        const text = parts[0] || "Geen tekst";
        const color = parts[1] || "#FFFF00";
        const image = parts[2] || null;

        const embed = new EmbedBuilder().setDescription(text).setColor(color);
        if (image) embed.setImage(image);

        targetChannel.send({ embeds: [embed] });
    }

    // ---------- BLOXLINK ----------
    if (command === "bloxlink6388") {
        const embed = new EmbedBuilder()
            .setTitle("🌴 Welkom bij HavenStad ER:LC!")
            .setDescription("Welkom in de server!\nKlik op **Verifieer hier** om je Roblox te koppelen via Bloxlink en toegang te krijgen tot mededelingen en voicechat.")
            .setColor("#FEE75C");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("✅ Verifieer hier")
                .setStyle(ButtonStyle.Link)
                .setURL("https://blox.link/verify/6388"),
            new ButtonBuilder()
                .setLabel("ℹ️ Info")
                .setStyle(ButtonStyle.Link)
                .setURL("https://blox.link/info")
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }

    // ---------- RECHTZAAK ----------
    if (command === "rechtzaak") {
        if (!message.member.roles.cache.has(advocaatRole)) 
            return message.reply("❌ Alleen advocaten kunnen dit doen.");

        const [user1, user2, advocaatMention, type] = args;
        const partij1 = message.mentions.users.at(0) || message.mentions.users.first();
        const partij2 = message.mentions.users.at(1) || message.mentions.users.at(1);
        const advocaat = message.mentions.users.at(2) || message.mentions.users.at(2);

        if (!partij1 || !partij2 || !advocaat) 
            return message.reply("Gebruik: !rechtzaak @persoon1 @persoon2 @advocaat tekst/vc");

        if (type !== "tekst" && type !== "vc") 
            return message.reply("❌ Geef aan: tekst of vc");

        const category = message.guild.channels.cache.get("1406026219966693558");
        const channelName = `rechtzaak-${partij1.username}-vs-${partij2.username}`;

        const overwrites = [
            { id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: partij1.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: partij2.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: advocaat.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ];

        staffRoles.forEach(r => overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }));

        const newChannel = await message.guild.channels.create({
            name: channelName,
            type: type === "tekst" ? 0 : 2,
            parent: category.id,
            permissionOverwrites: overwrites
        });

        message.reply(`✅ Rechtzaak kanaal aangemaakt: ${newChannel}`);

        const logEmbed = new EmbedBuilder()
            .setTitle("⚖️ Nieuwe Rechtzaak")
            .setDescription(`Partijen: ${partij1} vs ${partij2}\nAdvocaat: ${advocaat}\nType: ${type}`)
            .setColor("#3498db")
            .setFooter({ text: `Aangemaakt door ${message.author.tag}` });

        message.guild.channels.cache.get(logChannelId).send({ embeds: [logEmbed] });
    }

    // ... de rest van je commands (case, close, mod commands) kun je op dezelfde manier fixen
});

client.login(process.env.TOKEN);

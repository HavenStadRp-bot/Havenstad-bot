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

// ---------- Invite Giveaway Variabelen ----------
const activeInviteGiveaways = new Map();
let guildInvites = new Map();

// Bij bot ready: invites opslaan
client.on("ready", async () => {
    client.guilds.cache.forEach(async (guild) => {
        const firstInvites = await guild.invites.fetch();
        guildInvites.set(guild.id, new Map(firstInvites.map(inv => [inv.code, inv.uses])));
    });
    console.log(`Bot online als ${client.user.tag}`);
});

// Bijhouden wie een invite gebruikt
client.on("guildMemberAdd", async (member) => {
    const newInvites = await member.guild.invites.fetch();
    const oldInvites = guildInvites.get(member.guild.id);
    guildInvites.set(member.guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));

    const usedInvite = newInvites.find(inv => oldInvites.get(inv.code) < inv.uses);
    if (!usedInvite) return;

    const inviterId = usedInvite.inviter.id;

    for (const g of activeInviteGiveaways.values()) {
        const huidige = g.deelnemers.get(inviterId) || 0;
        g.deelnemers.set(inviterId, huidige + 1);
    }
});

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

    // ---------- INVITE GIVEAWAY ----------
    if (command === "invitegiveaway") {
        if (!staffRoles.some(r => message.member.roles.cache.has(r)))
            return message.reply("❌ Je hebt geen permissie om dit te doen.");

        const prijs = args.join(" ");
        if (!prijs) return message.reply("⚠ Gebruik: !invitegiveaway <prijs>");

        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const eindTijd = Date.now() + weekMs;

        const embed = new EmbedBuilder()
            .setTitle("🎉 Havenstad Invite Giveaway!")
            .setDescription(`Prijs: **${prijs}**\nMaak je persoonlijke link met **!mijnlink** en nodig zoveel mogelijk vrienden uit!\n⏰ Eindigt over **7 dagen**.`)
            .setColor("#FFD700")
            .setTimestamp(eindTijd);

        const msg = await message.channel.send({ embeds: [embed] });

        activeInviteGiveaways.set(msg.id, { prijs, eind: eindTijd, deelnemers: new Map() });

        setTimeout(async () => {
            const data = activeInviteGiveaways.get(msg.id);
            if (!data) return;

            let winnaar = null;
            let maxInvites = 0;
            for (const [id, count] of data.deelnemers) {
                if (count > maxInvites) {
                    maxInvites = count;
                    winnaar = id;
                }
            }

            if (!winnaar) {
                msg.channel.send("❌ Niemand heeft invites gehaald...");
            } else {
                msg.channel.send(`🏆 Gefeliciteerd <@${winnaar}>! Jij hebt de meeste invites (${maxInvites}) en wint **${data.prijs}**!`);
            }

            activeInviteGiveaways.delete(msg.id);
        }, weekMs);
    }

    // ---------- PERSOONLIJKE LINK ----------
    if (command === "mijnlink") {
        const invite = await message.guild.invites.create(message.channel.id, {
            maxAge: 0,
            maxUses: 0,
            unique: true,
            reason: `Invite voor ${message.author.tag}`
        });

        const embed = new EmbedBuilder()
            .setTitle("🔗 Jouw Havenstad Invite Link")
            .setDescription(`Gebruik deze link om mee te doen aan de giveaway:\n${invite.url}`)
            .setColor("#00BFFF");

        message.reply({ embeds: [embed] });
    }

    // ---------- TUSSENSTAND ----------
    if (command === "stand") {
        const data = [...activeInviteGiveaways.values()][0];
        if (!data) return message.reply("❌ Er is momenteel geen actieve invite giveaway.");

        const top5 = [...data.deelnemers.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (top5.length === 0) return message.reply("❌ Nog geen deelnemers met invites.");

        const desc = top5.map(([id, count], i) => `**${i + 1}.** <@${id}> — ${count} invites`).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("📊 Tussenstand Havenstad Giveaway")
            .setDescription(desc)
            .setColor("#3498db")
            .setFooter({ text: `Prijs: ${data.prijs}` });

        message.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.TOKEN);

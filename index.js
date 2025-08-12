const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('HavenStad Roleplay bot is online!');
});

app.listen(port, () => {
  console.log(`🌐 Webserver draait op poort ${port}`);
});

const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const prefix = "!";
const SSU_ROLE = "1404867280546041986"; // Rol die gepingd wordt bij start
const SSU_PERMISSION_ROLE = "1404873533951312024"; // Rol die mag starten/stoppen
const SSU_CHANNEL = "1404865394094637227"; // Kanaal waar embed komt

let ssuMessageId = null; // Om oud bericht te tracken

client.on('ready', async () => {
  console.log(`✅ Ingelogd als ${client.user.tag}`);

  // Zoek bij opstart of er al een bestaand SSU bericht is
  try {
    const channel = await client.channels.fetch(SSU_CHANNEL);
    const messages = await channel.messages.fetch({ limit: 50 });
    const ssuMsg = messages.find(msg =>
      msg.author.id === client.user.id &&
      (msg.embeds[0]?.title?.includes('Onze server is opgestart') || msg.embeds[0]?.title?.includes('Onze server is nu gesloten'))
    );
    if (ssuMsg) {
      ssuMessageId = ssuMsg.id;
      console.log(`ℹ️ SSU bericht gevonden met ID: ${ssuMessageId}`);
    } else {
      console.log("ℹ️ Geen bestaand SSU bericht gevonden");
    }
  } catch (err) {
    console.log("⚠️ Fout bij zoeken naar SSU bericht:", err);
  }
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "ssu" && (args[0] === "start" || args[0] === "stop")) {
    if (!message.member.roles.cache.has(SSU_PERMISSION_ROLE)) {
      return message.reply("❌ Je hebt geen rechten om dit te doen.");
    }

    const channel = await client.channels.fetch(SSU_CHANNEL);

    let embed;
    let content = null;

    if (args[0] === "start") {
      embed = new EmbedBuilder()
        .setColor("#004000") // donker groen
        .setTitle(`🚀 Onze server is opgestart! (door ${message.author.tag})`)
        .setDescription(
          `Zorg ervoor dat je een beroep hebt.\nWe wensen je een geweldige RP-sessie toe!\n\nJoin de server via [Klik hier](https://policeroleplay.community/join/YdJXu)`
        )
        .setImage(
          "https://cdn.discordapp.com/attachments/1394316929518272512/1404869627636351049/IMG_4993.jpg?ex=689cc24c&is=689b70cc&hm=e49efb45f259d7d92bda1caa7451668138479e1afb0d178f70dddb8f2e81eb13&"
        )
        .setFooter({ text: `Gestart door ${message.author.tag}` });

      content = `<@&${SSU_ROLE}>`;
    } else {
      embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(`⛔ Onze server is nu gesloten (door ${message.author.tag})`)
        .setDescription(
          `Er is momenteel geen staff online, maar joinen kan nog steeds.\n\nGebruik [Klik hier](https://policeroleplay.community/join/YdJXu) om te verbinden.`
        )
        .setImage(
          "https://cdn.discordapp.com/attachments/1394316929518272512/1404871028227706880/IMG_4996.jpg?ex=689cc39a&is=689b721a&hm=109cc458f150ba7b5e7663a75376e4e13762c53bd41ff1366fe22c9fa65ea08d&"
        )
        .setFooter({ text: `Gestopt door ${message.author.tag}` });
    }

    if (ssuMessageId) {
      try {
        const oldMsg = await channel.messages.fetch(ssuMessageId);
        await oldMsg.edit({ content, embeds: [embed] });
      } catch (error) {
        // Oud bericht weg, nieuwe maken
        const newMsg = await channel.send({ content, embeds: [embed] });
        ssuMessageId = newMsg.id;
      }
    } else {
      const newMsg = await channel.send({ content, embeds: [embed] });
      ssuMessageId = newMsg.id;
    }
  }

  // Moderatie commands (kick/ban voorbeeld)
  else if (command === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply("❌ Je hebt geen rechten om dit te doen.");
    }
    const member = message.mentions.members.first();
    if (!member) return message.reply("⚠️ Geef een gebruiker op om te kicken.");
    try {
      await member.kick();
      message.channel.send(`✅ ${member.user.tag} is gekickt.`);
    } catch {
      message.reply("❌ Kan deze gebruiker niet kicken.");
    }
  } else if (command === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("❌ Je hebt geen rechten om dit te doen.");
    }
    const member = message.mentions.members.first();
    if (!member) return message.reply("⚠️ Geef een gebruiker op om te bannen.");
    try {
      await member.ban();
      message.channel.send(`✅ ${member.user.tag} is verbannen.`);
    } catch {
      message.reply("❌ Kan deze gebruiker niet bannen.");
    }
  }
});

client.login(process.env.TOKEN);

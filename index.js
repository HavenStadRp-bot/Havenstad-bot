// Express webserver voor Render uptime
const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('HavenStad Roleplay bot is online!');
});

app.listen(port, () => {
  console.log(`🌐 Webserver draait op poort ${port}`);
});

// Discord bot setup
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
const SSU_ROLE = "1404867280546041986"; // Rol die gepingd wordt bij start/stop
const SSU_PERMISSION_ROLE = "1404873533951312024"; // Rol die mag starten/stoppen
const SSU_CHANNEL = "1404865394094637227"; // Kanaal waar embed komt

let ssuMessageId = null; // Bewaart ID van het huidige SSU bericht

client.on('ready', async () => {
  console.log(`✅ Ingelogd als ${client.user.tag}`);

  // Bij opstart kijken of er al een SSU bericht is
  try {
    const channel = await client.channels.fetch(SSU_CHANNEL);
    const messages = await channel.messages.fetch({ limit: 50 });
    const ssuMsg = messages.find(msg =>
      msg.author.id === client.user.id &&
      (msg.embeds[0]?.title?.includes('Onze server is opgestart') || msg.embeds[0]?.title?.includes('Onze server is nu gesloten'))
    );
    if (ssuMsg) {
      ssuMessageId = ssuMsg.id;
      console.log(`ℹ️ Bestaand SSU bericht gevonden: ${ssuMessageId}`);
    }
  } catch (err) {
    console.log("⚠️ Fout bij zoeken naar bestaand SSU bericht:", err);
  }
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // SSU start/stop
  if (command === "ssu" && (args[0] === "start" || args[0] === "stop")) {
    if (!message.member.roles.cache.has(SSU_PERMISSION_ROLE)) {
      return message.reply("❌ Je hebt geen rechten om dit te doen.");
    }

    const channel = await client.channels.fetch(SSU_CHANNEL);
    let embed;
    let content = `<@&${SSU_ROLE}> door <@${message.author.id}>`;

    if (args[0] === "start") {
      embed = new EmbedBuilder()
        .setColor("#004000")
        .setTitle(`🔰 Onze server is opgestart!`)
        .setDescription(
          `Zorg ervoor dat je een beroep hebt.\nWe wensen je een geweldige RP-sessie toe!\n\nJoin de server via [Klik hier](https://policeroleplay.community/join/YdJXu)`
        )
        .setImage(
          "https://cdn.discordapp.com/attachments/1394316929518272512/1404869627636351049/IMG_4993.jpg?ex=689cc24c&is=689b70cc&hm=e49efb45f259d7d92bda1caa7451668138479e1afb0d178f70dddb8f2e81eb13&"
        );
    } else {
      embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle(`⛔ Onze server is nu gesloten`)
        .setDescription(
          `Er is momenteel geen staff online, maar joinen kan nog steeds.\n\nGebruik [Klik hier](https://policeroleplay.community/join/YdJXu) om te verbinden.`
        )
        .setImage(
          "https://cdn.discordapp.com/attachments/1394316929518272512/1404871028227706880/IMG_4996.jpg?ex=689cc39a&is=689b721a&hm=109cc458f150ba7b5e7663a75376e4e13762c53bd41ff1366fe22c9fa65ea08d&"
        );
    }

    if (ssuMessageId) {
      try {
        const oldMsg = await channel.messages.fetch(ssuMessageId);
        await oldMsg.edit({ content, embeds: [embed] });
      } catch {
        const newMsg = await channel.send({ content, embeds: [embed] });
        ssuMessageId = newMsg.id;
      }
    } else {
      const newMsg = await channel.send({ content, embeds: [embed] });
      ssuMessageId = newMsg.id;
    }
  }

  // Kick
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
  }

  // Ban
  else if (command === "ban") {
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

  // Softban
  else if (command === "softban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("❌ Je hebt geen rechten om dit te doen.");
    }
    const member = message.mentions.members.first();
    if (!member) return message.reply("⚠️ Geef een gebruiker op om te softbannen.");
    try {
      await member.ban({ deleteMessageDays: 1 });
      await message.guild.members.unban(member.id);
      message.channel.send(`✅ ${member.user.tag} is gesoftbanned (korte ban + berichten verwijderd).`);
    } catch {
      message.reply("❌ Kan deze gebruiker niet softbannen.");
    }
  }

  // Timeout
  else if (command === "timeout") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("❌ Je hebt geen rechten om dit te doen.");
    }
    const member = message.mentions.members.first();
    const duration = parseInt(args[1]);
    if (!member || isNaN(duration)) {
      return message.reply("⚠️ Gebruik: `!timeout @gebruiker <minuten>`");
    }
    try {
      await member.timeout(duration * 60 * 1000);
      message.channel.send(`✅ ${member.user.tag} is getimeout voor ${duration} minuten.`);
    } catch {
      message.reply("❌ Kan deze gebruiker niet timeouten.");
    }
  }

  // Custom embed
  else if (command === "embed") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("❌ Je hebt geen rechten om dit te doen.");
    }

    const targetChannel = message.mentions.channels.first();
    if (!targetChannel) return message.reply("⚠️ Tag een kanaal waar de embed heen moet.");
    args.shift();

    let color = null;
    const colorIndex = args.findIndex(arg => /^#([0-9A-F]{3}){1,2}$/i.test(arg));
    if (colorIndex !== -1) {
      color = args[colorIndex];
      args.splice(colorIndex, 1);
    }

    let image = null;
    const imgIndex = args.findIndex(arg => arg.startsWith("http") && (arg.endsWith(".jpg") || arg.endsWith(".png") || arg.endsWith(".gif")));
    if (imgIndex !== -1) {
      image = args[imgIndex];
      args.splice(imgIndex, 1);
    }

    const text = args.join(" ");
    if (!text) return message.reply("⚠️ Geef een tekst voor de embed op.");

    const embed = new EmbedBuilder().setDescription(text);
    if (color) embed.setColor(color);
    if (image) embed.setImage(image);

    await targetChannel.send({ embeds: [embed] });
    message.reply(`✅ Embed verstuurd naar ${targetChannel}`);
  }
});

client.login(process.env.TOKEN);

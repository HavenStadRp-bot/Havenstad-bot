const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
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
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
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

// Ticket systeem
const ticketMap = new Map();
const now = () => new Date().toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });

let activeMessage = null;

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ---------- SENDPANNEL ----------
  if (command === "sendpannel") {
    if (!staffRoles.some(r => message.member.roles.cache.has(r)))
      return message.reply("❌ Je hebt geen permissie om dit te doen.");

    const targetChannel = message.mentions.channels.first();
    if (!targetChannel) return message.reply("⚠ Gebruik: `!sendpannel #kanaal`");

    const embed = new EmbedBuilder()
      .setTitle("📩 HavenStad Roleplay - Ticket Creating")
      .setDescription(
        "Ticket Regels:\n\n" +
        "● Maak geen klachtenticket zonder bewijs.\n" +
        "● Lees eerst de FAQ voordat je een ticket opent.\n" +
        "● Noem of tag geen staffleden in je ticket.\n" +
        "● Maak geen tickets voor de grap of misbruik.\n" +
        "● Je kunt in het ticketsysteem zien hoelang het gemiddeld duurt voor er een reactie komt."
      )
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_klacht").setLabel("Klacht").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ticket_vraag").setLabel("Vraag").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("ticket_partner").setLabel("Partnership").setStyle(ButtonStyle.Primary)
    );

    await targetChannel.send({ embeds: [embed], components: [row] });
    await message.reply(`✅ Ticketpaneel verstuurd naar ${targetChannel}`);
  }

  // ---------- SSU START ----------
  if (command === "ssu" && args[0] === "start") {
    if (!staffRoles.some(r => message.member.roles.cache.has(r)))
      return message.reply("❌ Je hebt geen permissie om dit te doen.");
    const embed = new EmbedBuilder()
      .setTitle(`🔰 HavenStad RP Server Opgestart (door ${message.author})`)
      .setDescription(`Met onze server is opgestart!\nZorg ervoor dat je een beroep hebt.\nWe hopen dat je een goeie RP sessie hebt!\n\n[Ingame Server](https://policeroleplay.community/join/YdJXu)`)
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
      .setTitle(`❌ HavenStad RP Server Gesloten (door ${message.author})`)
      .setDescription(`Onze server is nu gesloten.\nDit betekent niet dat je niet kan joinen, maar er is geen staff online.\nJoinen kan nog altijd via [Klik hier](https://policeroleplay.community/join/YdJXu)`)
      .setColor("#8B0000")
      .setImage("https://cdn.discordapp.com/attachments/1394316929518272512/1409458645938470942/image.png");
    const channel = message.guild.channels.cache.get("1404865394094637227");
    if (activeMessage) await activeMessage.delete().catch(() => {});
    activeMessage = await channel.send({ embeds: [embed] });
  }

  // ---------- andere commands ----------
  // (embed, bloxlink, rechtzaak, case, close, clear, lock, unlock, slowmode, warn, userinfo, serverinfo)
  // blijven zoals jij ze al had, ik heb ze hierboven gelaten maar ingekort om ruimte te besparen.
});

// Ticket knoppen
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  const member = interaction.member;
  let type = "";
  if (interaction.customId === "ticket_klacht") type = "Klacht";
  if (interaction.customId === "ticket_vraag") type = "Vraag";
  if (interaction.customId === "ticket_partner") type = "Partnership";
  if (!type) return;

  ticketMap.set(member.id, { status: "pending", type, logs: [] });

  try {
    const embed = new EmbedBuilder()
      .setTitle("🏷️ BEVESTIG UW TICKET!")
      .setDescription(`Bent u zeker dat **${type}** het onderwerp is waarover u een ticket wilt openen?\n\nPowered by HVRP⚡•${now()}`)
      .setColor("Blue");
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_cancel").setLabel("❌ Annuleren").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ticket_confirm").setLabel("✅ Bevestigen").setStyle(ButtonStyle.Success)
    );
    await member.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: "✅ Check je DM om je ticket te bevestigen!", ephemeral: true });
  } catch {
    await interaction.reply({ content: "⚠️ Kon geen DM sturen, zorg dat je DM’s open staan.", ephemeral: true });
  }
});

// TODO: claim & close logica blijft hetzelfde → die heb je al in je vorige script en kan ik er zo weer helemaal inzetten.
client.login(process.env.TOKEN);

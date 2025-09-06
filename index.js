// --- Imports ---
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
require("dotenv").config();

// --- Express (Uptime Pinger) ---
const app = express();
const port = process.env.PORT || 4000;
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(port, () => console.log(`🌐 Express running on port ${port}`));

// --- Client Setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// --- Config ---
const prefix = "!";
const staffRoles = ["1413273783745118252"]; // Staff role ID
const logChannelId = "1406026722620739654"; // Log kanaal
const ticketCategoryId = "1413273557093318748"; // Ticket categorie
const guildId = "1391369587697913927"; // Je server ID

// Data opslag
const ticketMap = new Map();
const now = () => new Date().toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });

// --- Ready Event ---
client.once("ready", () => {
  console.log(`✅ ${client.user.tag} is online`);
  client.user.setPresence({
    activities: [{ name: "🎫 DM Support", type: 3 }],
    status: "online"
  });
});

// --- MESSAGE COMMANDS ---
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const [cmd, ...args] = message.content.slice(prefix.length).trim().split(/\s+/);

  // --- !sendpannel ---
  if (cmd === "sendpannel") {
    // check staff
    if (!message.member.roles.cache.some(r => staffRoles.includes(r.id))) {
      return message.reply("❌ Je hebt geen permissies om dit te doen.");
    }

    const channel = message.mentions.channels.first() || message.channel;

    const embed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("Zandbank Roleplay - Ticket Creating")
      .setDescription(
        `**Ticket Regels:**\n\n` +
        `● Maak geen klachtenticket zonder bewijs.\n` +
        `● Lees eerst de FAQ voordat je een ticket opent.\n` +
        `● Noem of tag geen staffleden in je ticket.\n` +
        `● Maak geen tickets voor de grap of misbruik.\n` +
        `● Je kunt in het ticketsysteem zien hoelang het gemiddeld duurt voor er een reactie komt.`
      )
      .setFooter({ text: `Powered by ZBRP ⚡ • ${now()}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_vraag")
        .setLabel("❓ Vragen")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("open_klacht")
        .setLabel("⚠️ Klacht")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("open_partnership")
        .setLabel("🤝 Partnership")
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });
    return message.reply("✅ Ticket-pannel verstuurd!");
  }
});

// --- INTERACTIONS (Tickets) ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const user = interaction.user;
  const guild = client.guilds.cache.get(guildId);
  const member = guild.members.cache.get(user.id);

  // --- Ticket bevestigen ---
  if (interaction.customId.startsWith("open_")) {
    const type =
      interaction.customId === "open_vraag"
        ? "Vraag"
        : interaction.customId === "open_klacht"
        ? "Klacht"
        : "Partnership";

    const confirmEmbed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("🏷️ BEVESTIG UW TICKET!")
      .setDescription(`Bent u zeker dat **${type}** het onderwerp is waarover u een ticket wilt openen?\n\nPowered by ZBRP ⚡ • ${now()}`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cancel_${type}_${user.id}`)
        .setLabel("❌ Annuleren")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`confirm_${type}_${user.id}`)
        .setLabel("✅ Bevestigen")
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
  }

  // --- Annuleren ---
  if (interaction.customId.startsWith("cancel_")) {
    return interaction.update({ content: "❌ Ticket geannuleerd.", embeds: [], components: [] });
  }

  // --- Bevestigen (ticket maken) ---
  if (interaction.customId.startsWith("confirm_")) {
    const [, type, userId] = interaction.customId.split("_");
    if (user.id !== userId) return;

    const guild = client.guilds.cache.get(guildId);
    const channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: 0,
      parent: ticketCategoryId,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: staffRoles[0], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    ticketMap.set(channel.id, { userId: user.id, type, claimedBy: null });

    const openedEmbed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("🎟️ TICKET GEOPEND!")
      .setDescription(
        `Hey ${user},\n\nBedankt voor uw **${type}** ticket. Onze medewerkers zijn op de hoogte gebracht en zullen binnenkort op uw verzoek reageren.\n\nEven geduld alstublieft...`
      )
      .setFooter({ text: `Powered by ZBRP ⚡ • ${now()}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_${channel.id}`).setLabel("👤 Claim Ticket").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`close_${channel.id}`).setLabel("📩 Sluit Ticket").setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [openedEmbed], components: [row] });
    await interaction.update({ content: "✅ Ticket geopend!", embeds: [], components: [] });
  }

  // --- Claim ---
  if (interaction.customId.startsWith("claim_")) {
    const [, channelId] = interaction.customId.split("_");
    const ticket = ticketMap.get(channelId);
    if (!ticket) return;

    ticket.claimedBy = interaction.user.id;

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("👤 TICKET IN BEHANDELING!")
      .setDescription(`Hey <@${ticket.userId}>,\n\nDe medewerker ${interaction.user} is toegewezen aan uw ticket.\n\nPowered by ZBRP ⚡ • ${now()}`);

    return interaction.reply({ embeds: [embed] });
  }

  // --- Sluit ticket ---
  if (interaction.customId.startsWith("close_")) {
    const [, channelId] = interaction.customId.split("_");
    const ticket = ticketMap.get(channelId);
    if (!ticket) return;

    const user = await client.users.fetch(ticket.userId);
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📨 TICKET GESLOTEN!")
      .setDescription(
        `Hey ${user.username},\n\nOnze medewerkers hebben uw verzoek als opgelost gemarkeerd en uw ticket gesloten.\n\nHeeft u nog vragen? Open gerust een nieuw ticket.\n\nMvg,\nGRP Support-team`
      )
      .setFooter({ text: `Powered by ZBRP ⚡ • ${now()}` });

    await user.send({ embeds: [embed] }).catch(() => {});
    const channel = client.channels.cache.get(channelId);
    if (channel) await channel.delete();

    ticketMap.delete(channelId);
    return;
  }
});

// --- Login ---
client.login(process.env.TOKEN);

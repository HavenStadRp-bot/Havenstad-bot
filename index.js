const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const express = require("express");
const app = express();

// Uptime ping
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(3000, () => console.log("🌍 Express server running on port 3000"));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} is online`);
  client.user.setPresence({
    activities: [{ name: "ZBRP Tickets 📩", type: 0 }],
    status: "online",
  });
});

// IDs
const GUILD_ID = "1404783511629594645";
const STAFF_ROLES = [
  "1406025210527879238",
  "1406942631522734231",
  "1406942944627265536",
  "1406943073694515280",
  "1406943251826606234",
  "1406943483658371214",
];

// Ticket map
const ticketMap = new Map();
const now = () => new Date().toLocaleString("nl-NL");

// Panel command
client.on("messageCreate", async (message) => {
  if (message.content === "!sendpannel") {
    if (!message.guild) return;

    const hasRole = STAFF_ROLES.some((roleId) =>
      message.member.roles.cache.has(roleId)
    );
    if (!hasRole) {
      return message.reply("❌ Je hebt geen permissie om dit te doen.");
    }

    const embed = new EmbedBuilder()
      .setTitle("Zandbank Roleplay - Ticket Creating")
      .setDescription(
        `**Ticket Regels:**\n
● maak geen klachtenticket zonder bewijs.
● lees eerst de faq voordat je een ticket opent.
● noem of tag geen staffleden in je ticket.
● maak geen tickets voor de grap of misbruik.
● je kunt in het ticketsysteem zien hoelang het gemiddeld duurt voor er een reactie komt.`
      )
      .setColor("Yellow");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_klacht")
        .setLabel("📕 Klacht")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket_vraag")
        .setLabel("📘 Vraag")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ticket_partner")
        .setLabel("📗 Partnership")
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.reply("✅ Ticketpaneel verstuurd!");
  }
});

// Button handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (!interaction.guild) {
    return interaction.reply({
      content: "⚠️ Dit werkt alleen in een server, niet in DM’s.",
      flags: 64,
    });
  }

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
      .setDescription(
        `Bent u zeker dat **${type}** het onderwerp is waarover u een ticket wilt openen?\n\nPowered by ZBRP⚡•${now()}`
      )
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_cancel")
        .setLabel("❌ Annuleren")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket_confirm")
        .setLabel("✅ Bevestigen")
        .setStyle(ButtonStyle.Success)
    );

    await member.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      content: "✅ Check je DM om je ticket te bevestigen!",
      flags: 64,
    });
  } catch {
    await interaction.reply({
      content: "⚠️ Kon geen DM sturen, zorg dat je DM’s open staan.",
      flags: 64,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);

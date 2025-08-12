const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const express = require('express');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const app = express();

const PORT = process.env.PORT || 3000;

// Webserver voor uptimebot
app.get('/', (req, res) => res.send('HavenStad Roleplay Bot is online!'));
app.listen(PORT, () => console.log(`Webserver draait op poort ${PORT}`));

client.once('ready', () => {
  console.log(`Ingelogd als ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const ssuRoleId = '1404873533951312024'; // Rol die SSU mag gebruiken
  const ssuPingRole = '<@&1404867280546041986>'; 
  const ssuChannelId = '1404865394094637227';

  const { commandName } = interaction;

  if (commandName === 'ssu') {
    if (!interaction.member.roles.cache.has(ssuRoleId)) {
      return interaction.reply({ content: 'Je hebt geen toestemming om dit command te gebruiken.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const user = interaction.user;

    if (subcommand === 'start') {
      const channel = client.channels.cache.get(ssuChannelId);
      if (!channel) return interaction.reply({ content: 'Kan het kanaal niet vinden.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Server is opgestart!')
        .setDescription(`${ssuPingRole}\n\nOpgestart door ${user}.\nZorg ervoor dat je een beroep hebt.\nWe hopen dat je een goeie Rp sessie hebt!\n\n[Ingame Server](roblox://placeId=2534724415&launchData=%7B%22psCode%22%3A%22YdJXu%22%7D)`)
        .setImage('https://cdn.discordapp.com/attachments/1394316929518272512/1404869627636351049/IMG_4993.jpg?ex=689cc24c&is=689b70cc&hm=e49efb45f259d7d92bda1caa7451668138479e1afb0d178f70dddb8f2e81eb13&')
        .setFooter({ text: `Opgestart door ${user.tag}`, iconURL: user.displayAvatarURL() });

      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: 'Server startbericht verstuurd.', ephemeral: true });
    }

    if (subcommand === 'stop') {
      const channel = interaction.channel;

      // Zoek en verwijder laatste groene embed bericht van de bot in deze channel
      const fetchedMessages = await channel.messages.fetch({ limit: 10 });
      const messageToDelete = fetchedMessages.find(msg =>
        msg.embeds[0]?.color === 0x00ff00 && msg.author.id === client.user.id
      );

      if (messageToDelete) await messageToDelete.delete();

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Onze server is nu Gesloten.')
        .setDescription(`Gesloten door ${interaction.user}.\nDit betekent niet dat je niet kan joinen, maar er is geen staff online!\nJoinen kan nog altijd via [Klik hier](roblox://placeId=2534724415&launchData=%7B%22psCode%22%3A%22YdJXu%22%7D)`)
        .setImage('https://cdn.discordapp.com/attachments/1394316929518272512/1404871028227706880/IMG_4996.jpg?ex=689cc39a&is=689b721a&hm=109cc458f150ba7b5e7663a75376e4e13762c53bd41ff1366fe22c9fa65ea08d&');

      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: 'Server stopbericht verstuurd en vorige verwijderd.', ephemeral: true });
    }
  }

  if (commandName === 'embed') {
    const channel = interaction.options.getChannel('channel');
    const content = interaction.options.getString('inhoud');
    const color = interaction.options.getString('kleur') || '#0099ff';
    const image = interaction.options.getString('foto');

    if (!channel.isTextBased()) return interaction.reply({ content: 'Dat is geen geldig tekstkanaal.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setDescription(content)
      .setColor(color);

    if (image) embed.setImage(image);

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: 'Embed gestuurd!', ephemeral: true });
  }

  if (['kick', 'ban', 'softban', 'timeout'].includes(commandName)) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: 'Je hebt hier geen toestemming voor.', ephemeral: true });
    }

    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: 'Gebruiker niet gevonden.', ephemeral: true });

    try {
      if (commandName === 'kick') {
        await target.kick(interaction.options.getString('reden') || 'Geen reden opgegeven');
        await interaction.reply({ content: `${target.user.tag} is gekickt.` });
      }
      if (commandName === 'ban') {
        await target.ban({ reason: interaction.options.getString('reden') || 'Geen reden opgegeven' });
        await interaction.reply({ content: `${target.user.tag} is geband.` });
      }
      if (commandName === 'softban') {
        await target.ban({ days: 7, reason: interaction.options.getString('reden') || 'Softban' });
        await target.unban(target.id);
        await interaction.reply({ content: `${target.user.tag} is softgeband.` });
      }
      if (commandName === 'timeout') {
        const duration = interaction.options.getInteger('tijd');
        if (!duration || duration < 1 || duration > 1440) {
          return interaction.reply({ content: 'Geef een geldige tijd in minuten (1-1440).', ephemeral: true });
        }
        await target.timeout(duration * 60 * 1000, interaction.options.getString('reden') || 'Timeout opgelegd');
        await interaction.reply({ content: `${target.user.tag} is getimeout voor ${duration} minuten.` });
      }
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Er is iets misgegaan.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);

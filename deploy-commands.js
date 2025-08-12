const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // test server id, zo registreer je snel

const commands = [
  new SlashCommandBuilder()
    .setName('ssu')
    .setDescription('Speelt HavenStad Roleplay ER:LC')
    .addSubcommand(sub =>
      sub.setName('start')
         .setDescription('Start de server en ping SSU'))
    .addSubcommand(sub =>
      sub.setName('stop')
         .setDescription('Stop de server')),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Stuur een custom embed')
    .addChannelOption(option =>
      option.setName('channel')
            .setDescription('Kies een kanaal')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('inhoud')
            .setDescription('Inhoud van de embed')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('kleur')
            .setDescription('Kleur in hex, bv #ff0000')
            .setRequired(false))
    .addStringOption(option =>
      option.setName('foto')
            .setDescription('URL van een afbeelding')
            .setRequired(false)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick een gebruiker')
    .addUserOption(option =>
      option.setName('user')
            .setDescription('De gebruiker om te kicken')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('reden')
            .setDescription('Reden voor kick')
            .setRequired(false)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban een gebruiker')
    .addUserOption(option =>
      option.setName('user')
            .setDescription('De gebruiker om te bannen')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('reden')
            .setDescription('Reden voor ban')
            .setRequired(false)),

  new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Softban een gebruiker')
    .addUserOption(option =>
      option.setName('user')
            .setDescription('De gebruiker om te softbannen')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('reden')
            .setDescription('Reden voor softban')
            .setRequired(false)),

  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout een gebruiker')
    .addUserOption(option =>
      option.setName('user')
            .setDescription('De gebruiker om te timen')
            .setRequired(true))
    .addIntegerOption(option =>
      option.setName('tijd')
            .setDescription('Tijd in minuten (1-1440)')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('reden')
            .setDescription('Reden voor timeout')
            .setRequired(false)),
]
  .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Commands registreren...');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId), // Gebruik voor testen een guild command
      { body: commands },
    );

    console.log('Commands succesvol geregistreerd!');
  } catch (error) {
    console.error(error);
  }
})();

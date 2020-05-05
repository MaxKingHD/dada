/**
===============================================================================================

  @name DiscordTickets
  @author M4x1337 <maxsherwoodm0nn@gmail.com>
  @license GNU-GPLv3

###############################################################################################
*/

const fs = require('fs');
const Discord = require('discord.js');
const leeks = require('leeks.js');
const log = require(`leekslazylogger`);
const config = require('./config.json');
const { version, homepage } = require('./package.json');
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();
const now = Date.now();

const commands = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
console.log(log.colour.magentaBright(`dada`)); // sunn m34x
console.log(log.colour.yellow(leeks.styles.bold(`N I K U R O v${version} - `)));
console.log(log.colour.yellow(leeks.styles.bold(homepage)));
console.log('\n\n');
console.log(log.colour.bgGrey(log.colour.grey(`\n\n==========================================================================\n\n`)))
console.log('\n\n');
log.init('Discord')

log.info(`Starting up...`)

client.once('ready', () => { 

  log.info(`Initialising bot...`)
  for (const file of commands) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    log.console(`> Loading '${config.prefix}${command.name}' command`);
  }
  log.success(`Connected to Discord API`)
  log.success(`Logged in as ${client.user.tag}`)
  client.user.setPresence({game: {name: config.playing, type: config.activityType},status: config.status})
 
    .catch(log.error);

  if (config.useEmbeds) {
    const embed = new Discord.RichEmbed()
      .setAuthor(`${client.user.username} | Staff LOGS`, client.user.avatarURL)
      .setColor("#2ECC71")
      .setDescription(":white_check_mark: **The bot has started succesfully**")
      .setTimestamp();
      client.channels.get(config.logChannel).send(embed)
  } else {
    client.channels.get(config.logChannel).send(":white_check_mark: **Started succesfully**")
  }
  if (client.guilds.get(config.guildID).member(client.user).hasPermission("ADMINISTRATOR", false)) {
    log.info(`Checking permissions...`);
    setTimeout(function() {
      log.success(`I have the permissions\n\n`)
    }, 1250);

    if (config.useEmbeds) {
      const embed = new Discord.RichEmbed()
        .setAuthor(`${client.user.username} | Staff LOGS`, client.user.avatarURL)
        .setColor("#2ECC71")
        .setDescription(":white_check_mark: **Required permissions have been succesfully verified**")
        .setTimestamp();
        client.channels.get(config.logChannel).send(embed)
    } else {
      client.channels.get(config.logChannel).send(":white_check_mark: **Started succesfully**")
    }
  } else {
    log.error(`Required permissions have not been verified`)
    log.error(`Please give the bot the 'ADMINISTRATOR' permission\n\n`)
    if (config.useEmbeds) {
      const embed = new Discord.RichEmbed()
        .setAuthor(`${client.user.username} | Staff LOGS`, client.user.avatarURL)
        .setColor("#E74C3C")
        .setDescription(":x: **Required permissions have not been verified**\nPlease give the bot the `ADMINISTRATOR` permission")
        .setFooter(`><`);
      client.channels.get(config.logChannel).send({
        embed
      })
    } else {
      client.channels.get(config.logChannel).send(":white_check_mark: **Started succesfully**")
    }
  }

});

client.on('message', async message => {
  // if (!message.content.startsWith(config.prefix) || message.author.bot) return;
  if (message.author.bot) return;
  if (message.channel.type === "dm") {
    if (message.author.id === client.user.id) return;
    // message.channel.send(`Sorry, commands can only be used on the server.`)
    if (config.logDMs) {
      if (config.useEmbeds) {
        const embed = new Discord.RichEmbed()
          .setAuthor(`${client.user.username} | Staff LOGS`, client.user.avatarURL)
          .setTitle("DM Logger")
          .addField("Username", message.author.tag, true)
          .addField("Message", message.content, true)
          .setFooter(`><`);
        client.channels.get(config.logChannel).send(embed)
      } else {
        client.channels.get(config.logChannel).send(`DM received from **${message.author.tag} (${message.author.id})** : \n\n\`\`\`${message.content}\`\`\``);
      }
    } else {
      return
    };

  }
  if (message.channel.bot) return;

  // const args = message.content.slice(config.prefix.length).split(/ +/);


  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|\\${config.prefix})\\s*`);
  if (!prefixRegex.test(message.content)) return;
  const [, matchedPrefix] = message.content.match(prefixRegex);
  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  // if (!client.commands.has(commandName)) return;
  // const command = client.commands.get(commandName);
  const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

  if (command.guildOnly && message.channel.type !== 'text') {
	   return message.channel.send(`Sorry, this command can only be used on the server.`)
  }

  // if (command.args && !args.length) {
  //   // let reply = `:x: **Arguments were expected but none were provided.**`;
  //   //
  //   // if (command.usage) {
  //   //   reply += `\n**Usage:** \`${config.prefix}${command.name} ${command.usage}\``;
  //   // }
  //   //
  //   return message.channel.send(reply);
  //   if (config.useEmbeds) {
  //       const embed = new Discord.RichEmbed()
  //         .setColor("#E74C3C")
  //         .setDescription(`\n**Usage:** \`${config.prefix}${command.name} ${command.usage}\`\nType \`${config.prefix}help ${command.name}\` for more information`)
  //       return message.channel.send({embed})

  //   } else {
  //     return message.channel.send(`**Usage:** \`${config.prefix}${command.name} ${command.usage}\`\nType \`${config.prefix}help ${command.name}\` for more information`)
  //   }
  // };


  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      if (config.useEmbeds) {
        const embed = new Discord.RichEmbed()
          .setColor("#E74C3C")
          .setDescription(`:x: **Please do not spam commands** (wait ${timeLeft.toFixed(1)}s)`)
        return message.channel.send({embed})
      } else {
        return message.reply(`please do not spam commands (wait ${timeLeft.toFixed(1)}s)`);
      }

    }
  }
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);


  try {
    // client.commands.get(command).execute(message, args, config);
    command.execute(message, args);
    if(config.useEmbeds) {
      const embed = new Discord.RichEmbed()
        .setAuthor(`${client.user.username} | COMMAND Log`, client.user.avatarURL)
        .setTitle("Command Used")
        .addField("Username", message.author, true)
        .addField("Command", command.name, true)
        .setFooter(`N I K U`)
        .setTimestamp();
      client.channels.get(config.logChannel).send({embed})
    } else {
      client.channels.get(config.logChannel).send(`**${message.author.tag} (${message.author.id})** used the \`${command.name}\` command`);
    }
    log.console(`${message.author.tag} used the '${command.name}' command`)
  } catch (error) {
    log.error(error);
    message.channel.send(`:x: **Oof!** An error occured whilst executing that command.\nThe issue has been reported.`);
    log.error(`An unknown error occured whilst executing the '${command.name}' command`);
  }

});
client.on('error', error => {
  log.warn(`Potential error detected\n(likely Discord API connection issue)\n`);
  log.error(`Client error:\n${error}`);
});
client.on('warn', (e) => log.warn(`${e}`));

if(config.debugLevel == 1){ client.on('debug', (e) => log.debug(`${e}`)) };

process.on('unhandledRejection', error => {
  log.warn(`An error was not caught`);
  log.error(`Uncaught error: \n${error.stack}`);
});
process.on('beforeExit', (code) => {
  log.basic(log.colour.yellowBright(`Disconected from Discord API`));
  log.basic(`Exiting (${code})`);
});

client.on("message", message =>{
  if(!message.guild) return
if(message.content.startsWith("dm")) {

  var args = message.content.split(" ").slice(1);
  var msge = args.join(' ');

  if(!message.guild.member(message.author).hasPermission("ADMINISTRATOR")) return message.channel.send("> <a:no:672541903295610912> **You dont have permission to use this command.**");
  if(!msge) return message.channel.send("> <a:no:672541903295610912> **You need to put a message.**")

  var mpall = new Discord.RichEmbed()
  .setThumbnail(client.user.avatarURL)
  .setTimestamp()
  .setColor("RANDOM")
  // .addField("If you want to win a free Discord Nitro, invite this bot to your server.", "[*Click here to invite the bot*](https://discordapp.com/oauth2/authorize?client_id=672531012563238942&scope=bot&permissions=0)")
  .setAuthor('Automatic message') //'https://i.imgur.com/pxLdMmh.png', 'https://discord.js.org'
  // .setImage("https://cdn.discordapp.com/attachments/572487570131255316/706553553887559680/unnamed.jpg")
  // .setThumbnail("https://cdn.discordapp.com/attachments/670298076103311428/670309136642342924/tenor_1.gif")
  .addField("Message:", msge);
  message.delete()
  message.guild.members.map(m => m.send(mpall))
  message.channel.send("> :white_check_mark:  **The message was sent to everyone in the server.**")



}

// if(cmd === `preturi`){
//   let sEmbed = new  Discord.RichEmbed()
//   .setColor(694341)
//   .setTitle("preturi")
//   .setTimestamp();
//   message.channel.send({embed: sEmbed});
// }

});


client.login(config.token);

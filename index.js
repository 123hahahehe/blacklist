require('dotenv').config(); // Load environment variables from .env file
const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGES
    ]
});

const keepAlive = require('./server');
keepAlive();

const defaultBlacklist = ['cp', 'child porn', 'lolicon', 'pedo', 'pedophile', 'p3do',]; // Default list of words to blacklist
const defaultWhitelist = ['lolipop', 'club penguin']; // Default list of words to whitelist
let customBlacklist = []; // Custom list of blacklisted words

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
    if (message.author.bot) return; // Ignore bot's own messages

    if (message.content.startsWith('!blacklist') && message.member.permissions.has('ADMINISTRATOR')) {
        const args = message.content.split(' ');
        args.shift(); // Remove the command itself (!blacklist)
        if (args.length > 0) {
            customBlacklist = args;
            message.channel.send('Custom blacklist updated successfully!');
        } else {
            message.channel.send('Please provide words to blacklist.');
        }
    } else if (message.content.startsWith('!whitelist') && message.member.permissions.has('ADMINISTRATOR')) {
        const args = message.content.split(' ');
        args.shift(); // Remove the command itself (!whitelist)
        if (args.length > 0) {
            customBlacklist = customBlacklist.filter(word => !args.includes(word));
            message.channel.send('Words removed from custom blacklist successfully!');
        } else {
            message.channel.send('Please provide words to remove from the custom blacklist.');
        }
    } else if (message.content === '!list') {
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Blacklisted Words')
            .setDescription([...defaultBlacklist, ...customBlacklist].join(', '));
        message.channel.send({ embeds: [embed] });
    } else if (containsBlacklistedWord(message.content)) {
        message.delete()
            .then(msg => console.log(`Deleted message from ${msg.author.username} containing blacklisted word.`))
            .catch(console.error);
    }
});

client.login(process.env.TOKEN); // Use environment variable for bot token

function containsBlacklistedWord(content) {
    const contentLower = content.toLowerCase();
    // Check if message contains blacklisted word
    for (const word of [...defaultBlacklist, ...customBlacklist]) {
        if (contentLower.includes(word) && !isPartOfLargerWord(contentLower, word)) {
            return true;
        }
    }
    return false;
}

function isPartOfLargerWord(content, word) {
    // Check if the blacklisted word is part of a larger word
    const index = content.indexOf(word);
    if (index > 0 && index + word.length < content.length) {
        const before = content[index - 1];
        const after = content[index + word.length];
        if (isLetter(before) || isLetter(after)) {
            return true;
        }
    }
    return false;
}

function isLetter(character) {
    // Check if a character is a letter
    return /^[a-zA-Z]+$/.test(character);
}

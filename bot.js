const TurtleCoind = require('turtlecoin-rpc').TurtleCoind;
const DiscordJS = require('discord.js');


//------------------------  SETTINGS  -----------------------------------------------------//
// ENTER THE BOT'S TOKEN HERE
const discordToken = '<YOUR DISCORD TOKEN>';

// ENTER THE IP ADDRESS OR URL OF THE DAEMON HERE, FOR EXAMPLE '127.0.0.1' FOR A LOCAL NODE
const daemonHost = '167.86.113.15';

// ENTER THE IP PORT OF THE DAEMON HERE, FOR EXAMPLE 64023 FOR JITBIT
const daemonPort = 32322;

// ENTER THE COIN'S NAME HERE, FOR EXAMPLE 'Tellurium' OR 'Oscillate'
const coinName = 'Tellurium';

// ENTER THE COIN'S TICKER HERE, FOR EXAMPLE 'JBT' FOR 'JitBit'
const coinTicker = 'TRLM';

// ENTER THE LOGO'S URL HERE
const logoURL = 'https://avatars0.githubusercontent.com/u/49403874?s=460&v=4';

// ENTER A HEX COLOR OR A RGB ARRAY FOR CUSTOMIZATION
const msgColor = 0x545b66;

// ENTER THE NAME OF THE CHANNEL YOU WANT THE UPDATES IN HERE, FOR EXAMPLE 'Stats' or 'jitbit-stats'
const msgChannel = 'stats';

// ENTER THE INTERVAL HERE (IN MILLISECONDS)
const checkInterval = 5000;

// SET TO TRUE IF BOT SHOULDN'T DELETE OLD STATISTICS
const keepOldStats = true;
//-----------------------------------------------------------------------------------------//



// DO NOT MESS WITH THE STUFF DOWN HERE!!!
const daemon = new TurtleCoind({
  host: daemonHost,
  port: daemonPort,
  timeout: 5000,
  ssl: false
});
const discord = new DiscordJS.Client();


lastStats = false;

function updateMsg(channel, stats, time) {
    channel.send('', new DiscordJS.RichEmbed()
        .setColor(msgColor)
        .setTitle(`__**${coinName} network statistics**__`)
        .setDescription(`These are the network statistics of ${coinName}!`)
        .setThumbnail(logoURL)
        .setFooter(`Fetched: ${time}`)
        .addField('Height', `${stats.height} blocks`)
        .addField('Hashrate', `${stats.hashrate} h/s`)
        .addField('Difficulty', stats.difficulty)
        .addField('Block reward', `${stats.reward} ${coinTicker}`)
        .addField('Last blockhash', stats.lastHash)
        .addField('Timestamp of last block', stats.timestamp)
        .addField('Transactions in last block', `${stats.numTxnsInside} transactions`)
        .addField('Pending transactions', `${stats.numTxnsPending} transactions`)
        .addField('Softfork number', stats.softFork)
        .addField('Hardfork number', stats.hardFork)
    );
}

setInterval(() => {

    stats = {
        hashrate: false,       // done by getInfo()
        height: false,         // done by geBlockCount()
        lastHash: "",          // done by getBlockhash()
        timestamp: false,      // done by getBlock()
        difficulty: false,     // done by getBlock()
        softFork: false,       // done by getBlock()
        hardFork: false,       // done by getBlock()
        numTxnsInside: false,  // done by getBlock()
        numTxnsPending: false  // done by getTransactionPool()
    }

    daemon.getBlockCount().then(height => {
        stats.height = height;

        return daemon.getBlockHash({
            height: height
        })
    }).then((hash) => {
        stats.lastHash = hash;

        return daemon.getBlock({
            hash: hash
        })
    }).then((block) => {
        stats.softFork = block.major_version;
        stats.hardFork = block.minor_version;
        stats.timestamp = block.timestamp;
        stats.reward = block.reward;
        stats.numTxnsInside = block.transactions.length;

        return daemon.getInfo();
    }).then((info) => {
        stats.hashrate = info.hashrate;
        stats.difficulty = info.difficulty;

        return daemon.getTransactionPool();
    }).then((txns) => {
        stats.numTxnsPending = txns.length || 0;
    }).then(() => {
        console.log(`Height                 : ${stats.height} blocks`);
        console.log(`Hashrate               : ${stats.hashrate} h/s`);
        console.log(`Difficulty             : ${stats.difficulty}`);
        console.log(`Block reward           : ${stats.reward} ${coinTicker}`);
        console.log(`Last blockhash         : ${stats.lastHash}`);
        console.log(`Timestamp of last block: ${stats.timestamp}`);
        console.log(`Transactions           : ${stats.numTxnsInside}`);
        console.log(`Pending Txns           : ${stats.numTxnsPending}`);
        console.log(`Soft fork nr           : ${stats.softFork}`);
        console.log(`Hard fork nr           : ${stats.hardFork}\n\n`);

        now = new Date(Date.now());
        time = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} @ ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

        if (lastStats.height !== stats.height) {
            for(let guild of discord.guilds.array()) {
                channel = guild.channels.find(channel => channel.name === msgChannel);
            
                if (channel == undefined) {
                    console.log('Guild ' + guild.name + ' (' + guild.nameAcronym + ') doesn\'t have a channel for me :(');
                    continue;
                }

                channel.fetchMessages({limit: 2}).then(msgs => {
                    msgs = msgs.array();

                    if(msgs.length == 0 || msgs == undefined) {
                        updateMsg(channel, stats, time);
                    } else if (msgs[0].author.tag === discord.user.tag && !keepOldStats)  {
                        console.log('Found message from me...\nDeleting and sending new stats...');
                        msgs[0].delete();
                        
                        updateMsg(channel, stats, time);
                    }
                });
            }

            lastStats = stats;
            return;
        } else if (lastStats.numTxnsPending !== stats.numTxnsPending) {
            for(let guild of discord.guilds.array()) {
                channel = guild.channels.find(channel => channel.name === msgChannel);
                
                if (channel == undefined) {
                    console.log('Guild ' + guild.name + ' (' + guild.nameAcronym + ') doesn\'t have a channel for me :(');
                    continue;
                }
    
                channel.fetchMessages({limit: 2}).then(msgs => {
                    msgs = msgs.array();
    
                    if(msgs.length == 0 || msgs == undefined) {
                        updateMsg(channel, stats, time);
                    } else if (msgs[0].author.tag === discord.user.tag && !keepOldStats)  {
                        console.log('Found message from me...\nDeleting and sending new stats...');
                        msgs[0].delete();
                        
                        updateMsg(channel, stats, time);
                    }
                });
            }

            lastStats = stats;
            return;
        }
    }).catch(error => {
        console.log('An error occurred: ' + error);
    });
}, checkInterval);

discord.on('ready', () => {
    console.log('Connected as ' + discord.user.tag);
    console.log('Guilds I\'m in:');
    discord.guilds.array().forEach(guild => {
        console.log('- ' + guild.name + ' (' + guild.nameAcronym + ')');
    });

    console.log(`Add me to your guild via this link: https://discordapp.com/api/oauth2/authorize?client_id=${discord.user.id}&permissions=18432&scope=bot`);
});

discord.on('guildCreate', (guild) => {
    console.log('Added to ' + guild.name + ' (' + guild.nameAcronym + ')');
});

discord.login(discordToken);

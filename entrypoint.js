const request = require('request');
const express = require('express');
const app = express();
app.use(express.urlencoded());

this.thebot = null;

const THEPORT = process.env.PORT || process.env.BOTPORT || 80;

app.listen(THEPORT, () => {
    console.log(`Flaviobot is live on port ${THEPORT}`);
});

app.get('/', (req, res) => {
    res.send('Flaviobot is running');
});

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({
            user: installer
        }, (err, convo) => {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}

let config = {};

if (process.env.MONGOLAB_URI) {
    const BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({
            mongoUri: process.env.MONGOLAB_URI
        }),
    };
} else {
    config = {
        json_file_store: ((process.env.TOKEN) ? './db_slack_bot_ci/' : './db_slack_bot_a/'), //use a different name if an app or CI
    };
}


let controller;

//////
// All the live variables are stored here
//////

// is the game running?
let isGameRunning = false;

// the channel where the "start" command was launched is the
// channel where the game is happening
let channelId = undefined;

// storing the words
let participantsWords = {};



// I don't want to make an extra API call for this, so I will store the known
// players nicknames here

const KNOWN_USERS = new Map([
    ['U5ZDPV5S6', 'Kose'],
    ['U5QJXTGR1', 'Guybrush'],
    ['U5X56H0TG', 'Stefano'],
    ['U5Q1D5LE4', 'Manu']
]);


const getFriendlyNameFromId = ( id ) => {
    const friendly_name = KNOWN_USERS.get( id );

    if ( friendly_name ) {
        return friendly_name;
    }

    return id;
}

const constructResponse = () => {
    
    let finalResponse = '';

    for (const [key, value] of Object.entries(participantsWords)) {
        
        const friendly_name = getFriendlyNameFromId( key );

        finalResponse = finalResponse + `- *${ friendly_name }*: ${value} \n`;
    }

    return finalResponse;
}


if (process.env.TOKEN) {
    const customIntegration = require('./lib/custom_integrations');
    const token = process.env.TOKEN;

    controller = customIntegration.configure(token, config, onInstallation);
} else {
    console.log('Error: please specify TOKEN in the environment.');
    process.exit(1);
}

controller.on('rtm_open', bot => {
    console.log('** The RTM api just connected!');
    this.thebot = bot;
});

controller.on('rtm_close', bot => {
    console.log('** The RTM api just closed (connection closed)');
    process.exit(1);
});

controller.hears('vai!', 'direct_mention', (bot, message) => {
    if ( !isGameRunning ) {
        bot.reply(message, 'Inizia il gioco. Attendo le vostre risposte in DM');
        isGameRunning = true;
        // resetting the words object
        participantsWords = {};
        channelId = message.channel;
    }
    else {
        bot.reply(message, 'Il gioco è già stato avviato');
    }
});

controller.hears('stop!', 'direct_mention', (bot, message) => {
    if ( isGameRunning ) {
        
        const allWords = constructResponse();

        bot.reply(message, `Il gioco è chiuso. Ecco le parole: \n ${allWords}`);
        isGameRunning = false;
    }
    else {
        bot.reply(message, 'Nessun gioco in corso');
    }

});


controller.hears('.*', 'direct_message', (bot, message) => {
    if ( isGameRunning ) {
        participantsWords[ message.user ] = message.text;
        bot.reply(message, `Ok, ho memorizzato la tua parola: ${message.text}`);

        const friendly_name = getFriendlyNameFromId( message.user );

        this.thebot.say({
            text: `*${ friendly_name }* ha scritto la sua parola`,
            channel: channelId
        });
    }
    else {
        bot.reply(message, 'Non puoi inviarmi la parola se il gioco non è in corso');
    }
});
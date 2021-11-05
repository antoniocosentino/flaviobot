const { json } = require('express');
const express = require('express');
const app = express();
const _ = require('lodash');
const fs = require('fs');
app.use(express.urlencoded());

const storedChart = require('./chart/data.json');
let sessionChart = storedChart;

this.thebot = null;

const THEPORT = process.env.PORT || process.env.BOTPORT || 80;

app.listen(THEPORT, () => {
    console.log(`Flaviobot is live on port ${THEPORT}`);

    const winners = getWinners( 'BICCHIERE' );
    
    updateChart( winners );
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

// when the game is closed, the bot expects to know what the word was. This will be used for the chart management.
let isWaitingForWord = false;

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

// this is only here for debugging purposes
// it should never be used in production code
const DEMOWORDS = {
    U5ZDPV5S6: 'BICCHIERE',
    U5QJXTGR1: 'CAVALLO'
}

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

        finalResponse = finalResponse + `• *${ friendly_name }*: ${value} \n`;
    }

    return finalResponse;
}

const constructChart = () => {
    const sorted = _.orderBy( sessionChart.results, 'score', 'desc' );
    let finalResponse = '';

    sorted.forEach( ( singleResult ) => {
        finalResponse = finalResponse + `• *${ getFriendlyNameFromId( singleResult.user ) }*: ${singleResult.score} \n`;
    } );

    return finalResponse;
}

const getWinners = ( correctWord ) => {

    const winnersArr = [];

    // TODO: DEMOWORDS should be participantsWords
    for (const [key, value] of Object.entries( DEMOWORDS ) ) {
        if ( value.toLowerCase() === correctWord.toLowerCase() ) {
            winnersArr.push( key );
        }
    }

    return winnersArr;
}


const updateChart = ( winners ) => {

    // TODO: DEMOWORDS should be participantsWords
    const numberOfPoints = Object.entries( DEMOWORDS ).length;

    const pointsPerWinner = numberOfPoints / winners.length;
    
    // TODO: here we need to introduce the logic that gives the extra points to the fastest person

    const updatedChart = [];

    sessionChart.results.forEach( ( singlePerson ) => {
        // check if this person is a winner
        if ( winners.includes( singlePerson.user ) ) {
            updatedChart.push(
                {
                    user: singlePerson.user,
                    score: singlePerson.score + pointsPerWinner
                }
            )
        } else {
            updatedChart.push(
                {
                    user: singlePerson.user,
                    score: singlePerson.score
                }
            )
        }
    } );

    sessionChart = {
        results: updatedChart
    }

    const updatedDataForStorage = JSON.stringify( sessionChart );
    
    console.log("🍌: updateChart -> updatedDataForStorage" + updatedDataForStorage)
    
    // TODO: uncomment this to start updating the file
    fs.writeFileSync('./chart/data.json', updatedDataForStorage);
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
        isWaitingForWord = true;
    }
    else {
        bot.reply(message, 'Nessun gioco in corso');
    }

});

controller.hears('era', 'direct_mention', (bot, message) => {
    if ( !isWaitingForWord ) {
        bot.reply(message, `Non puoi comunicarmi la parola vincente in questa fase del gioco.`);
    }
    else {
        isWaitingForWord = false;
        const relevantWordRegex = /(?<=\bera\s)(\w+)/;
        const finalWord = message.text.match( relevantWordRegex )[0];
        // TODO: insert here all the chart update mechanism
    }

});

controller.hears('classifica!', 'direct_mention', (bot, message) => {
    const readableChart = constructChart();

    bot.reply(message, `Ecco la classifica: \n ${readableChart}`);
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
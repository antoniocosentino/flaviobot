const express = require('express');
const app = express();
const _ = require('lodash');
const axios = require('axios');

app.use(express.urlencoded());

let sessionChart = null;
this.thebot = null;

const THEPORT = process.env.PORT || process.env.BOTPORT || 80;
const SCOREAPI = process.env.SCOREAPI || null;

app.listen(THEPORT, () => {
    console.log(`Flaviobot is live on port ${THEPORT}`);

    if ( SCOREAPI ) {
        axios.get( SCOREAPI ).then( resp => {
            sessionChart = resp.data;
        });
    }
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

        finalResponse = finalResponse + `• *${ friendly_name }*: ${ value.word } \n`;
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

    for (const [key, value] of Object.entries( participantsWords ) ) {
        if ( value.word.toLowerCase() === correctWord.toLowerCase() ) {
            winnersArr.push( key );
        }
    }

    return winnersArr;
}


const updateChart = ( winners ) => {

    const numberOfPoints = Object.entries( participantsWords ).length;

    const pointsPerWinner = Math.floor( numberOfPoints / winners.length );
    
    const extraPoint = numberOfPoints % winners.length;
    
    let fastestWinner = null;
    let previousWinnerTime = Math.floor( Date.now() / 1000 ); // setting this to now, since obviously answer cannot come from the future
    
    // in this case we need to assign this point to the person who answered first
    if ( extraPoint > 0 ) {
        for (const [key, value] of Object.entries( participantsWords ) ) {
            // first of all check if this is a winner
            if ( winners.includes( key ) ) {
                // now that we know that this is a winner, check if he was the fastest
                if ( value.sentAt < previousWinnerTime ) {
                    fastestWinner = key;
                    previousWinnerTime = value.sentAt
                }
            }
        }
    }

    const updatedChart = [];

    sessionChart.results.forEach( ( singlePerson ) => {
        // check if this person is a winner
        if ( winners.includes( singlePerson.user ) ) {
            
            const additionalPoints = singlePerson.user === fastestWinner ? extraPoint : 0;

            updatedChart.push(
                {
                    user: singlePerson.user,
                    score: singlePerson.score + pointsPerWinner + additionalPoints
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
    
    axios
        .post( SCOREAPI, sessionChart )
        .then(res => {
            console.log( `statusCode: ${res.status}` )
            console.log( res )
        })
        .catch(error => {
            console.error( error )
        })
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
    else if ( !SCOREAPI ) {
        bot.reply(message, `Questa funzionalità non è supportata.`);
    }
    else {
        isWaitingForWord = false;
        const relevantWordRegex = /(?<=\bera\s)(\w+)/;
        const finalWord = message.text.match( relevantWordRegex )[0];
        
        const winners = getWinners( finalWord );

        if ( winners.length < 1 ) {
            bot.reply(message, `La parola era ${finalWord}. Non ci sono stati vincitori.`);
        } else {
            updateChart( winners );
            const readableChart = constructChart();
            bot.reply(message, `La parola era ${finalWord}. Ecco la classifica aggiornata: \n${ readableChart }`);
        }
    }

});

controller.hears('classifica!', 'direct_mention', (bot, message) => {
    
    if ( !SCOREAPI ) {
        bot.reply(message, `Questa funzionalità non è supportata.`);    
    } else {
        const readableChart = constructChart();
        bot.reply(message, `Ecco la classifica: \n ${readableChart}`);
    }
});

controller.hears('.*', 'direct_message', (bot, message) => {
    if ( isGameRunning ) {
        participantsWords[ message.user ] = {
            word: message.text,
            sentAt: Math.floor( Date.now() / 1000 )
        }
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
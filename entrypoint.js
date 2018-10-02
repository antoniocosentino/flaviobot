const request = require('request');
const express = require('express');
const app = express();
app.use(express.urlencoded());

this.thebot = null;

app.listen(process.env.BOTPORT, () => {
    console.log(`Mombot is live on port ${process.env.BOTPORT}`);
});

app.get('/', (req, res) => {
    res.send('Mombot is running');
});

app.post('/yourmom', (req, res) => {
    res.send('delivering a mom joke');

    this.thebot.say({
        text: `that's what your mom said`,
        channel: req.body.channel_id
    });
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

controller.hears('.*', 'direct_message,mention,direct_mention', (bot, message) => {
    console.log(`New message from user ${message.user}: "${message.text}"`)

    bot.reply(message, 'your mom');
});

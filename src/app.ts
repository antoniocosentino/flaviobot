import { APP_TOKEN, PORT, SIGNING_SECRET, TOKEN } from './config';

const { App } = require('@slack/bolt');

const app = new App({
    token: TOKEN,
    signingSecret: SIGNING_SECRET,
    socketMode: true,
    appToken: APP_TOKEN,
});

app.event('message', async ({ event, context, client, say }) => {
    try {
        await say('you wrote me something on a direct message');
    } catch (error) {
        console.error(error);
    }
});

app.event('app_mention', async ({ event, context, client, say }) => {
    try {
        await say("i've been mentioned");
    } catch (error) {
        console.error(error);
    }
});

app.start(PORT);

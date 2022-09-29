import { APP_TOKEN, PORT, SIGNING_SECRET, TOKEN } from './config';

const { App } = require('@slack/bolt');

const app = new App({
    token: TOKEN,
    signingSecret: SIGNING_SECRET,
    socketMode: true,
    appToken: APP_TOKEN,
});

app.message('hello', async ({ command, say }) => {
    try {
        say('yolo');
    } catch (error) {
        console.log('err');
        console.error(error);
    }
});

app.start(PORT);

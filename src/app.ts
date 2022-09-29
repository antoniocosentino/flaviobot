import express from 'express';
import { PORT } from './config';
const app = express();

app.get('/', (req, res) => {
    res.send('Flaviobot is running');
});

app.listen(PORT, () => {
    return console.log(`Flaviobot is live on port ${PORT}`);
});

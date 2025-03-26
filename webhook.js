
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import bot from './index.js';
import { connectDB } from './config/db.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const telegramAPI = `https://api.telegram.org/bot${process.env.TELIGRAM_BOT_KEY}`;
app.use(express.json());
try {
    connectDB();
    console.log("database connected successfully");
} catch (error) {
    console.log(error);
    process.kill(process.pid, 'SIGTERM');
}


app.post('/webhook', (req, res) => {
    bot.handleUpdate(req.body, res);
    res.status(200).send('OK');
});

// Set webhook URL
const setWebhook = async () => {
    let webhookUrl;

    if (process.env.NODE_ENV === 'production') {
        webhookUrl = `${process.env.HOST_NAME_PROD}/webhook`;
    } else {
        webhookUrl = `${process.env.HOST_NAME_DEV}/webhook`;; // Fallback for development
    }

    try {
        const response = await axios.post(`${telegramAPI}/setWebhook`, {
            url: webhookUrl,
        });
        console.log('Webhook set successfully:', response.data);
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
};

setWebhook();

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at ${process.env.HOST_NAME}${port}`);
});

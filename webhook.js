
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import bot from './index.js';
import { connectDB } from './config/db.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
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
    const webhookUrl = `${process.env.HOST_NAME}/webhook`;

    try {
        const response = await axios.post(`https://api.telegram.org/bot${process.env.TELIGRAM_BOT_KEY}/setWebhook`, {
            url: webhookUrl,

        }, {
            timeout: 10000
        });
        console.log('Webhook set successfully');
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
};

// function to set the webhook
setWebhook();

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at https://localhost:${port}`);
});

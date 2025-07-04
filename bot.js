console.log("Required modules:", [
  'dotenv', 'express', 'axios', 'node-telegram-bot-api'
].map(module => {
  try {
    require.resolve(module);
    return `${module}: OK`;
  } catch {
    return `${module}: MISSING`;
  }
}));

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 10000;
const OWM_KEY = process.env.OWM_KEY;
const TOKEN = process.env.TELEGRAM_TOKEN;
const DEPLOY_URL = process.env.DEPLOY_URL;

const bot = new TelegramBot(TOKEN, { polling: true });

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Weather API endpoints
app.get('/weather', async (req, res) => {
    try {
        const { city } = req.query;
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OWM_KEY}&units=metric`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response?.data?.message || 'City not found' });
    }
});

app.get('/forecast', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Forecast unavailable' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Configure Telegram menu button
    bot.setChatMenuButton({
        menu_button: {
            type: 'web_app',
            text: 'Weather App',
            web_app: { url: DEPLOY_URL }
        }
    }).then(() => console.log('Menu button configured'))
    .catch(console.error);
});

// Launch command
bot.onText(/\/app/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Tap below to launch the weather app:', {
        reply_markup: {
            inline_keyboard: [[
                { text: 'Open Weather App', web_app: { url: DEPLOY_URL } }
            ]]
        }
    });
});

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const app = express();

// --- আপনার তথ্য এখানে বসান ---
const token = ' 8870842139:AAHtf21pJFAb-XUwkmIzuCBV4ceQ4DOe61E// আপনার আসল টেলিগ্রাম বট টোকেনটি এখানে বসাবেন
const REQUIRED_CHANNEL = '@your_channel_username'; // আপনার চ্যানেলের ইউজারনেম (যেমন: @TickBitChannel)
// ------------------------------

const bot = new TelegramBot(token, { polling: true });

// স্ট্যাটিক ফাইল ও ফ্রন্টএন্ড কানেক্ট করা
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ইউজার চ্যানেলে জয়েন আছে কি না চেক করার ফাংশন
async function checkChannelMembership(userId) {
    try {
        const member = await bot.getChatMember(REQUIRED_CHANNEL, userId);
        const status = member.status;
        return ['creator', 'administrator', 'member'].includes(status);
    } catch (error) {
        console.error("Error checking channel status:", error);
        return false;
    }
}

// /start কমান্ড হ্যান্ডলার
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name;

    const isMember = await checkChannelMembership(userId);
    const MINI_APP_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost:3000'}`;

    if (isMember) {
        bot.sendMessage(chatId, `Welcome back ${firstName}! Your Mining App is ready. Click below to open:`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚀 Open App", web_app: { url: MINI_APP_URL } }]
                ]
            }
        });
    } else {
        bot.sendMessage(chatId, `⚠️ To access the Mini App, you must join our official Telegram Channel first!`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📢 Join Our Channel", url: `https://t.me{REQUIRED_CHANNEL.replace('@', '')}` }],
                    [{ text: "✅ Verify Membership", callback_data: 'verify_join' }]
                ]
            }
        });
    }
});

// ভেরিফাই বাটন হ্যান্ডলার
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const userId = callbackQuery.from.id;
    const chatId = message.chat.id;
    const MINI_APP_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost:3000'}`;

    if (callbackQuery.data === 'verify_join') {
        const isMember = await checkChannelMembership(userId);

        if (isMember) {
            bot.answerCallbackQuery(callbackQuery.id, { text: "Success! You are verified.", show_alert: true });
            bot.editMessageText(`🎉 Verification Successful! Click below to start:`, {
                chat_id: chatId,
                message_id: message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🚀 Open App", web_app: { url: MINI_APP_URL } }]
                    ]
                }
            });
        } else {
            bot.answerCallbackQuery(callbackQuery.id, { text: "❌ You haven't joined yet!", show_alert: true });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.env.NTBA_FIX_319 = 1;

const rp = require('request-promise');
const $ = require('cheerio');
const url = 'https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/';
// telegram bot setting
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram tokenß you receive from @BotFather
const token = '1641190813:AAEXUnzF9PRrqTdqPRCWc9xmwxHlvKd7-Y0'

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
var enquires = 530
bot.on("polling_error", (err) => console.log(err));
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    enquires++
    bot.sendMessage(325594260, 'Accumulated Enquiries: '+enquires)
    const text = msg.text;
    var words = text.split('\n');
    const list = []
    for (let i = 0; i < words.length; i++) {
        const word_url = url+words[i];
        bot.sendChatAction(chatId, "typing")
        rp(word_url)
            .then(function(html){
            //success!
                // var type = $('.pos.dpos:first', html).text();
                var type = $('.ti.tb:first', html).text().toLowerCase();
                switch(type){
                    case "noun":
                        type = 'n.';
                        break;
                    case "verb":
                        type = 'v.';
                        break;
                    case "adjective":
                        type = 'adj.';
                        break;
                }
                const def = $('.trans.dtrans.dtrans-se.break-cj:first', html).text();
                const result = '*'+words[i]+ '* ('+type+') '+def;
                list.push(result);
                if (list.length === words.length) {
                    const final = list.join('\n');
                    bot.sendMessage(chatId, final, {parse_mode:'Markdown'});
                    console.log(final);
                };
            })
            .catch(function(err){
            //handle error
        });
    }  
});



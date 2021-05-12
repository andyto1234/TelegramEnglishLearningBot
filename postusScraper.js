process.env.NTBA_FIX_319 = 1;

const rp = require('request-promise');
const $ = require('cheerio');
const url = 'https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/';
// telegram bot setting
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BOT_TOKEN

function is_url(str)
{
  regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
        if (regexp.test(str))
        {
          return true;
        }
        else
        {
          return false;
        }
}
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
var enquires = 863
bot.on("polling_error", (err) => console.log(err));
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(chatId)
    enquires++
    bot.sendMessage(process.env.TG_ID, 'Accumulated Enquiries: '+enquires)
    const text = msg.text;
    var words = text.split('\n');
    const list = []
    if (words[0].toLowerCase() !== "/difficulty") {
        console.log(words[0])
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
        };
    };
    if (is_url(text)==true){
        bot.sendMessage(chatId, "唔好意思試緊野", {parse_mode:'Markdown'});
        rp(text).then(function(html){
                //success!
                    // var type = $('.pos.dpos:first', html).text();
                    var output = "";
                    $( "p", html).each( function( index, element ){
                        output += $(this).text() + " ";
                    });
                    console.log(output);

                })
                .catch(function(err){
                //handle error
            });
    }
    
});



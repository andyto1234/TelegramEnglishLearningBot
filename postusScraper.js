process.env.NTBA_FIX_319 = 1;

const rp = require('request-promise');
const $ = require('cheerio');
const translate = require('@vitalets/google-translate-api');

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

async function word_def(word) {

    // const word_url = url+words[i];

};
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
var enquires = 903
bot.on("polling_error", (err) => console.log(err));
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(chatId)
    enquires++
    bot.sendMessage(process.env.TG_ID, 'Accumulated Enquiries: '+enquires)
    const text = msg.text.replace(/"/g, '');
    var words = text.split('\n');
    const list = []
    if (words[0].toLowerCase() !== "/difficulty") {
        bot.sendChatAction(chatId, "typing")
        for (let i = 0; i < words.length; i++) {
            const word_url = url+words[i];
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
                    var result = '*'+words[i]+ '* ('+type+') '+def;
                    if (def == "") {
                        translate(words[i], {to: 'zh-TW'}).then(res => {
                            if (res.from.text.value == "") {
                                var result = '*'+words[i]+ '* '+res.text;
                            } else {
                                var result = '*'+words[i]+ '* '+res.from.text.value+' '+res.text;
                            }
                            list.push(result);
                            console.log(list);

                            if (list.length === words.length) {
                                const final = list.join('\n');
                                bot.sendMessage(chatId, final, {parse_mode:'Markdown'});
                                console.log(final);
                            };
                        }).catch(err => {
                            console.error(err);
                        });
                    } else {
                        list.push(result);
                        if (list.length === words.length) {
                            const final = list.join('\n');
                            bot.sendMessage(chatId, final, {parse_mode:'Markdown'});
                            console.log(final);
                        };
                    }

                })
                .catch(function(err){
                //handle error
            });
        };
    };
    if (is_url(text)==true){
        // bot.sendMessage(chatId, "唔好意思試緊野", {parse_mode:'Markdown'});
        rp(text).then(function(html){
                bot.sendChatAction(chatId, "typing")
                //success!
                    // var type = $('.pos.dpos:first', html).text();
                    const spawn = require("child_process").spawn;
                    
                    var output = "";
                    $( "p", html).each( function( index, element ){
                        output += $(this).text() + " ";
                    });
                    // console.log(output);
                    score = "";

                    
                    const pythonProcess = spawn('python',["./difficulty_score.py", output]);
                    pythonProcess.stdout.on('data', function (data) {
                        var score = data.toString()
                        console.log(data.toString());
                        if (score <= 6) {
                            var message = "都幾易啵！難度："+score
                        };
                        if (score > 6 && score <=8) {
                            var message = "開始有小小難啵！花多小小時間就讀完㗎喇！難度："+score
                        }
                        if (score > 8 && score <= 10) {
                            var message = "好難！可以用我嚟幫你查字典！難度："+score
                        }
                        if (score > 10) {
                            var message = "難到仆街啵！難度："+score
                        }
                        // bot.sendMessage(, )
                        const opts = {
                            reply_markup: {
                                inline_keyboard: [
                                [
                                    {
                                    text: '幫我查定字典',
                                    callback_data: 'yes'
                                    }
                                ]
                                ]
                            }
                            };
                        bot.sendMessage(chatId, message, opts);
                        bot.on("callback_query", function onCallbackQuery(callbackQuery) {
                            // 'callbackQuery' is of type CallbackQuery
                            const message_id= callbackQuery.message.message_id;
                            bot.editMessageReplyMarkup({
                                inline_keyboard: [
                                ]
                            }, {
                                chat_id: chatId, 
                                message_id: message_id
                            });
                            bot.sendChatAction(chatId, "typing")
                            const list = []
                            var counter = 0
                            const pythonProcess = spawn('python',["./word_list.py", output]);
                            pythonProcess.stdout.on('data', function (data) {
                                // console.log(data)
                                var words = data.toString().replace('[', '').replace(']','').replace(/ /g,'').replace(/’/g, '').replace(/'/g, '').replace(/\n/g,'').split(",")
                                // console.log(words.length, words);
                                // var words = word_list.split('\n');
                                for (let i = 0; i < words.length; i++) {
                                    const word_url = url+words[i];
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
                                            var result = '*'+words[i]+ '* ('+type+') '+def;
                                            if (def !== "") {
                                                list.push(result);
                                                // console.log(list.length)
                                                if (list.length === words.length) {
                                                    if (counter == 0) {
                                                        var final = list.join('\n');
                                                        bot.sendMessage(chatId, final, {parse_mode:'Markdown'});
                                                        // console.log("cambridge", final);
                                                        counter ++
                                                    }
                                                };
                                            } else {
                                                translate(words[i], {to: 'zh-TW'}).then(res => {
                                                    if (res.from.text.value == "") {
                                                        var result = '*'+words[i]+ '* '+res.text;
                                                    } else {
                                                        var result = '*'+words[i]+ '* '+res.from.text.value+' '+res.text;
                                                    }
                                                    list.push(result);
                                                    // console.log(list.length);
                        
                                                    if (list.length === words.length) {
                                                        if (counter == 0) {
                                                            var final = list.join('\n');
                                                            bot.sendMessage(chatId, final, {parse_mode:'Markdown'});
                                                            // console.log("google async", final);
                                                            counter ++
                                                        }
                                                        
                                                    };
                                                }).catch(err => {
                                                    console.error(err);
                                                });
                                            }                        
                                        })
                                        .catch(function(err){
                                        //handle error
                                    });
                                };
                                bot.removeListener("callback_query")
                            });
                        });
                    });

                })
                .catch(function(err){
                //handle error
            });
    }    
});



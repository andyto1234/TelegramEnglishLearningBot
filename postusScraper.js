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
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
var enquires = 929
bot.on("polling_error", (err) => console.log(err));
bot.on('message', (msg) => {
    bot.removeListener("callback_query")
    const chatId = msg.chat.id;
    bot.sendChatAction(chatId, "typing")
    enquires++
    bot.sendMessage(process.env.TG_ID, 'Accumulated Enquiries: '+enquires)
    const text = msg.text.replace(/"/g, '');
    var words = text.split('\n');
    const list = []
    if (words[0].toLowerCase() !== "/difficulty") {
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
                        case "adverb":
                            type = 'adv.';
                            break;
                    }
                    const def = $('.trans.dtrans.dtrans-se.break-cj:first', html).text();
                    var result = '*'+words[i]+ '* ('+type+') '+def;
                    if (def == "") {
                        translate(words[i], {to: 'zh-TW'}).then(res => {
                            if (words[i].split(' ').length == 1) {
                                var pos = require('pos');
                                var words_lexer = new pos.Lexer().lex(words[i]);
                                var tagger = new pos.Tagger();
                                var taggedWords = tagger.tag(words_lexer);
                                for (j in taggedWords) {
                                    var taggedWord = taggedWords[j];
                                    var tag = taggedWord[1];
                                    if (tag.includes('NN')) {var tag = "n."};
                                    if (tag.includes('VB')) {var tag = "v."};
                                    if (tag.includes('RB')) {var tag = "adv."};
                                    if (tag.includes('JJ')) {var tag = "adj."};
                                }
                                var result = '*'+words[i]+ '* ('+tag+') '
                            } else {
                                var result = '*'+words[i]+ '* '
                            }
                            if (res.from.text.value == "") {
                                var result = result+res.text;
                            } else {
                                var result = result+res.from.text.value+' '+res.text;
                            }
                            list.push(result);
                            // console.log(result);
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
                // bot.sendChatAction(chatId, "typing")
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
                        var score = parseFloat(data.toString().replace(/ /g,'').replace(/\n/g,''))
                        console.log(score);
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
                            reply_markup: JSON.stringify({
                                inline_keyboard: [
                                [
                                    {
                                    text: '幫我查定字典',
                                    callback_data: 'yes'
                                    }
                                ]
                                ]
                            })
                            };
                        bot.sendMessage(chatId, message, opts);
                        bot.once("callback_query", function onCallbackQuery(callbackQuery) {
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
                                var words = data.toString().replace('[', '').replace(']','').replace(/ /g,'').replace(/’/g, '').replace(/"/g, '').replace(/'/g, '').replace(/\n/g,'').split(",")
                                if (words.length > 30 && words.length<65) {
                                    bot.sendMessage(chatId, "好多生字！麻煩你等多我一陣！", {parse_mode:'Markdown'});
                                    bot.sendMessage(chatId, "如果我冇反應就試多次啦！", {parse_mode:'Markdown'});
                                    bot.sendChatAction(chatId, "typing");                                
                                }
                                if (words.length>64) {
                                    bot.sendMessage(chatId, "唔好意思依篇可能太多生字，好大機會覆唔到你:(", {parse_mode:'Markdown'});
                                    bot.sendChatAction(chatId, "typing");                                
                                }
                                console.log(words);
                                // var words = word_list.split('\n');
                                for (let i = 0; i < words.length; i++) {
                                    const word_url = url+words[i];
                                        rp(word_url)
                                        .then(function(html){
                                        //success!
                                            // console.log(words.length)
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
                                                case "adverb":
                                                    type = 'adv.';
                                                    break;
                                            }
                                            const def = $('.trans.dtrans.dtrans-se.break-cj:first', html).text();
                                            var result = '*'+words[i]+ '* ('+type+') '+def;
                                            if (def !== "") {
                                                list.push(result);
                                                console.log(list.length)
                                                if (list.length === words.length) {
                                                    if (counter == 0) {
                                                        var final = list.join('\n');
                                                        bot.sendMessage(chatId, final, {parse_mode:'Markdown'});
                                                        console.log("cambridge", final);
                                                        counter ++
                                                    }
                                                };
                                            } else {
                                                translate(words[i], {to: 'zh-TW'}).then(res => {
                                                    if (words[i].split(' ').length == 1) {
                                                        var pos = require('pos');
                                                        var words_lexer = new pos.Lexer().lex(words[i]);
                                                        var tagger = new pos.Tagger();
                                                        var taggedWords = tagger.tag(words_lexer);
                                                        for (j in taggedWords) {
                                                            var taggedWord = taggedWords[j];
                                                            var tag = taggedWord[1];
                                                            if (tag.includes('NN')) {var tag = "n."};
                                                            if (tag.includes('VB')) {var tag = "v."};
                                                            if (tag.includes('RB')) {var tag = "adv."};
                                                            if (tag.includes('JJ')) {var tag = "adj."};
                                                        }
                                                        var result = '*'+words[i]+ '* ('+tag+') '
                                                    } else {
                                                        var result = '*'+words[i]+ '* '
                                                    }
                                                    if (res.from.text.value == "") {
                                                        var result = result+res.text;
                                                    } else {
                                                        var result = result+res.from.text.value+' '+res.text;
                                                    }
                                                    list.push(result);
                                                    console.log(list.length);
                        
                                                    if (list.length === words.length) {
                                                        if (counter == 0) {
                                                            var final = list.join('\n');
                                                            bot.sendMessage(chatId, final, {parse_mode:'Markdown'});
                                                            console.log("google async", final);
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
                            });
                            

                        });
                    });

                })
                .catch(function(err){
                //handle error
            });
    }    
});



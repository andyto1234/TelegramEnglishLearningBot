const rp = require('request-promise');
const $ = require('cheerio');
const url = 'https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/perch?q=perched';
// const url = 'https://en.wikipedia.org/wiki/George_Washington'


rp(url)
  .then(function(html){
    //success!
    const wikiUrls = [];
    const wdef = $('.trans.dtrans.dtrans-se.break-cj:first', html).text();

    console.log(wdef);
  })
  .catch(function(err){
    //handle error
  });

//   <span class="x-h dx-h">sleepwalker</span>
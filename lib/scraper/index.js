var cheerio = require('cheerio');
var url = require('url');

var Scraper = function (url, callback) {
    this.url = url;
    this.callback = callback;
};

Scraper.prototype.scrape = function (res) {
    var options = {url: this.url, callback: this.callback};
    var rawData = '';

    var contentType = res.headers['content-type'];
    if (contentType && contentType.match(/iso-8859-1/i) && res.setEncoding) {
        res.setEncoding('binary');
    }

    res.on('data', function (chunk) {
        rawData += chunk;
    });

    res.on('end', function () {
        var $ = cheerio.load(rawData);
        var result = [];

        //if there is not a .briefcitTitle a, it is a single record and that uses .bibInfoData strong
        var rawResults = $('.briefcitTitle a');
        if (rawResults.length === 0) {
            $('.bibInfoData strong').each(function () {
                result.push({
                    name: $(this).text(),
                    url: url.format(options.url)
                });
            });
        } else {
            rawResults.each(function () {
                result.push({
                    name: $(this).text(),
                    url: url.resolve(url.format(options.url), $(this).attr('href'))
                });
            });
        }

        options.callback(null, {data: result, url: options.url});
    });
};

module.exports = exports = Scraper;
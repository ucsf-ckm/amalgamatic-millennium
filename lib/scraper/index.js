var cheerio = require('cheerio');
var url = require('url');

var options = {};

exports.setUrl = function (myUrl) {
    options.url = myUrl; 
};

exports.setCallback = function (myCallback) {
    options.callback = myCallback;
};

exports.scrape = function (res) {
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
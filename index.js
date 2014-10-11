var querystring = require('querystring');
var cheerio = require('cheerio');
var http = require('http');
var url = require('url');
var extend = require('util-extend');

var options = {
    url: 'http://ucsfcat.library.ucsf.edu/search/X'
};

exports.setOptions = function (newOptions) {
    options = extend(options, newOptions);
};

exports.search = function (query, callback) {
    'use strict';

    if (! query || ! query.searchTerm) {
        callback(null, {data: []});
        return;
    }

    var myUrl = options.url + '?' + querystring.stringify({SEARCH: query.searchTerm, SORT: 'D'});

    http.get(myUrl, function (res) {
        var rawData = '';

        var contentType = res.headers['content-type'];
        if (contentType && contentType.match(/iso-8859-1/i)) {
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
                        url: url.format(myUrl)
                    });
                });
            } else {
                rawResults.each(function () {
                    result.push({
                        name: $(this).text(),
                        url: url.resolve(url.format(myUrl), $(this).attr('href'))
                    });
                });
            }

            callback(null, {data: result, url: myUrl});
        });
    }).on('error', function (e) {
        callback(e);
    });
};
var scraper = require('./lib/scraper');

var querystring = require('querystring');
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
        return process.nextTick(function() {
            callback(null, {data: []});
        });
    }

    var myUrl = options.url + '?' + querystring.stringify({SEARCH: query.searchTerm, SORT: 'D'});

    var myOptions = url.parse(myUrl);
    myOptions.withCredentials = false;

    scraper.setCallback(callback);
    scraper.setUrl(myUrl);
    http.get(myOptions, scraper.scrape)
    .on('error', function (e) {
        callback(e);
    });
};
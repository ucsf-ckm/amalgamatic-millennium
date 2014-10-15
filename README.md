
[![Build Status](https://travis-ci.org/ucsf-ckm/amalgamatic-millennium.svg?branch=master)](https://travis-ci.org/ucsf-ckm/amalgamatic-millennium)

amalgamatic-millennium
======================

[Amalgamatic](https://github.com/ucsf-ckm/amalgamatic) plugin for [Millennium](http://www.iii.com/products/millennium)

## Installation

Install amalgamatic and this plugin via `npm`:

`npm install amalgamatic amalgamatic-millennium`

## Usage

````
var amalgamatic = require('amalgamatic'),
    millennium = require('amalgamatic-millennium');

// Set the URL to point to your Millennium advanced search page
millennium.setOptions({url: 'http://ucsfcat.library.ucsf.edu/search/X'});

// Add this plugin to your Amalgamatic instance along with any other plugins you've configured.
amalgamatic.add('millennium', millennium);

//Use it!
var callback = function (err, results) {
    if (err) {
        console.dir(err);
    } else {
        results.forEach(function (result) {
            console.log(result.name);
            console.dir(result.data);
        });
    }
};

amalgamatic.search({searchTerm: 'medicine'}, callback);
````

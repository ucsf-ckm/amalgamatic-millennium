/*jshint expr: true*/

var scraper = require('../../../lib/scraper');

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;

describe('scrape()', function () {
	it('should not call res.setEncoding() if it does not exist (browserify)', function (done) {

		// This will throw a TypeError if scraper() tries to call res.setEncoding()
		scraper.scrape({
			headers: {'content-type': 'iso-8859-1'}, 
			on: function () {}
		});

		done();
	});

	it('should not call res.setEncoding() if there is no content-type header', function (done) {

		// This will throw a TypeError if scraper() tries to call res.setEncoding()
		scraper.scrape({
			headers: {},
			on: function () {}
		});

		done();
	});

	it('should not call res.setEncoding() if content-type is not iso-8859-1', function (done) {

		// This will throw a TypeError if scraper() tries to call res.setEncoding()
		scraper.scrape({
			headers: {'content-type': 'utf-8'},
			on: function () {}
		});

		done();
	});

	it('should preserve umlauts etc. by calling res.setEncoding("binary") if content-type is iso-8859 and res.setEncoding() exists', function (done) {

		scraper.scrape({
			headers: {'content-type': 'iso-8859-1'},
			on: function () {},
			setEncoding: function (value) {
				expect(value).to.equal('binary');
				done();
			}
		});
	});

	it('should treat the content-type string in a case-insensitive manner', function (done) {
		var calls = 0;

		var res = {
			on: function () {},
			setEncoding: function (value) {
				expect(value).to.equal('binary');
				calls++;
			}
		};

		['iso-8859-1', 'ISO-8859-1', 'IsO-8859-1'].forEach(function (value) {
			res.headers = {'content-type': value};
			scraper.scrape(res);
		});

		expect(calls).to.equal(3);
		done();
	});
});

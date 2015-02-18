/*jshint expr: true*/

var rewire = require('rewire');

var millennium = rewire('../index.js');
var Iconv  = require('iconv').Iconv;

var nock = require('nock');

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;
var afterEach = lab.afterEach;
var before = lab.before;


var revert;

describe('exports', function () {

	before(function (done) {
		nock.disableNetConnect();
		done();
	});

	afterEach(function (done) {
		nock.cleanAll();
		if (revert) {
			revert();
			revert = null;
		}
		nock.disableNetConnect();
		millennium.setOptions({url: 'http://ucsfcat.library.ucsf.edu/search/X'});
		done();
	});

	it('returns an empty result if no search term provided', function (done) {
		millennium.search({searchTerm: ''}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result).to.deep.equal({data:[]});
			done();
		});
	});

	it('returns an empty result if no first argument', function (done) {
		millennium.search(null, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result).to.deep.equal({data:[]});
			done();
		});
	});

	it('returns results if a non-ridiculous search term is provided', function (done) {
		nock('http://ucsfcat.library.ucsf.edu')
			.get('/search/X?SEARCH=medicine&SORT=D')
			.reply(200, '<span class="briefcitTitle"><a href="#">Medicine</a></span><span class="briefcitTitle"><a class="Results" href="#">Medicine</a></span>');

		millennium.search({searchTerm: 'medicine'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(2);
			done();
		});
	});

	it('returns an empty result if ridiculous search term is provided', function (done) {
		nock('http://ucsfcat.library.ucsf.edu')
			.get('/search/X?SEARCH=fhqwhgads&SORT=D')
			.reply(200, '<html></html>');

		millennium.search({searchTerm: 'fhqwhgads'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(0);
			done();
		});
	});

	it('returns a single result for insanely specific search', function (done) {
		nock('http://ucsfcat.library.ucsf.edu')
			.get('/search/X?SEARCH=cardenas%20gano&SORT=D')
			.reply(200, '<div class="bibInfoData"><strong>El Pueblo Voto. ¡ Y Cardenas Gano! [electronic resource]</strong></div>');

		millennium.search({searchTerm: 'cardenas gano'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data.length).to.equal(1);
			done();
		});
	});

	it('returns an error object if there was an HTTP error', function (done) {
		millennium.search({searchTerm: 'medicine'}, function (err, result) {
			nock.enableNetConnect();
			expect(result).to.be.not.ok;
			expect(err.message).to.equal('Nock: Not allow net connect for "ucsfcat.library.ucsf.edu:80"');
			done();
		});
	});

	it('should handle ISO-8559-1 gracefully', function (done) {
		var iconv = new Iconv('UTF-8', 'ISO-8859-1');

		nock('http://ucsfcat.library.ucsf.edu')
			.get('/search/X?SEARCH=ex%20vivo&SORT=D')
			.reply(200,
				iconv.convert('<span class="briefcitTitle"><a href="/result/1">Jürgen</a></span>'),
				{'content-type': 'text/html; ISO-8859-1'}
			);

		millennium.search({searchTerm: 'ex vivo'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data[0].name).to.equal('Jürgen');
			done();
		});
	});

	it('should accept a URL as an option', function (done) {
		nock('http://www.example.com')
			.get('/X?SEARCH=test&SORT=D')
			.reply(200,
				'<span class="briefcitTitle"><a href="http://www.example.com/result/1">Test</a></span>'
			);

			millennium.setOptions({url: 'http://www.example.com/X'});

			millennium.search({searchTerm: 'test'}, function (err, result) {
				expect(err).to.be.not.ok;
				expect(result.data).to.deep.equal([{name: 'Test', url: 'http://www.example.com/result/1'}]);
				done();
			});
	});

	it('should handle UTF-8 gracefully', function (done) {
		nock('http://ucsfcat.library.ucsf.edu')
			.get('/search/X?SEARCH=ex%20vivo&SORT=D')
			.reply(200,
				'<span class="briefcitTitle"><a href="/result/1">Jürgen</a></span>'
			);

		millennium.search({searchTerm: 'ex vivo'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.data[0].name).to.equal('Jürgen');
			done();
		});
	});

	it('should return a link to the search results page', function (done) {
		nock('http://ucsfcat.library.ucsf.edu')
			.get('/search/X?SEARCH=test&SORT=D')
			.reply(200,
				'<span class="briefcitTitle"><a href="/result/1">Test</a></span>'
			);

		millennium.search({searchTerm: 'test'}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result.url).to.equal('http://ucsfcat.library.ucsf.edu/search/X?SEARCH=test&SORT=D');
			done();
		});
	});

	it('should set withCredentials to false (browserify)', function (done) {
		revert = millennium.__set__({http: {get: function (options) {
			expect(options.withCredentials).to.be.false;
			done();
			return {on: function () {}};
		}}});

		millennium.search({searchTerm: 'medicine'});
	});

	it('should trigger callback that was set at invocation time', function (done) {
		nock('http://ucsfcat.library.ucsf.edu')
			.get('/search/X?SEARCH=slow&SORT=D')
			.delay(100)
			.reply(200,
				'<span class="briefcitTitle"><a href="/result/1">Test</a></span>'
			);

		nock('http://ucsfcat.library.ucsf.edu')
			.get('/search/X?SEARCH=fast&SORT=D')
			.reply(200,
				'<span class="briefcitTitle"><a href="/result/1">Test</a></span>'
			);

		var count = 0;

		millennium.search({searchTerm: 'slow'}, function () {
			expect(count).to.equal(1);
			done();
		});

		millennium.search({searchTerm: 'fast'}, function () {
			count = count + 1;
			expect(count).to.equal(1);
		});

	});
});

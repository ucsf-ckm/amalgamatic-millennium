/*jshint expr: true*/

var millennium = require('../index.js');
var Iconv  = require('iconv').Iconv;

var nock = require('nock');
nock.disableNetConnect();

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Lab.expect;
var describe = lab.experiment;
var it = lab.test;
var afterEach = lab.afterEach;

describe('exports', function () {

	afterEach(function (done) {
		nock.cleanAll();
		nock.disableNetConnect();
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
});

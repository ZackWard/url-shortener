var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var app = require('../url-shortener');
var server = app.app;
var db = app.db;


chai.use(chaiHttp);

// Main page
describe('/', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .get('/')
            .end(function (err, response) {
                expect(err).to.be.null;
                res = response;
                done();
            });
    });

    it('should display a form to add a new URL');
});

// Add new URL
describe('GET /new/[url]', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .get('/new/http://news.google.com')
            .end(function (err, response) {
                expect(err).to.be.null;
                res = response;
                done();
            });
        // Clear database, then put an entry in
        db.clearCollection('urls', function (err) {
            if (err) {
                done(err);
            } else {
                db.addLink("https://www.zackward.net", function (err, newLink) {
                    if (err) {
                        done(err);
                    } else {
                        console.log("In pre-test database, added a new link: ");
                        console.log(newLink);
                    }
                });
            }
        });
        
    });

    it('should work');
});

describe('POST /new', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .post('/new')
            .end(function (err, response) {
                if (err) {
                    done(err);
                } else {
                    res = response;
                    done();
                }
            });
    });

    it('should work');
});

describe('POST /api/shorturl/new', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .post('/api/shorturl/new')
            .end(function (err, response) {
                if (err) {
                    done(err);
                } else {
                    res = response;
                    done();
                }
            });
    });

    it('should work');
});

// Redirect to long url
describe('GET /[short url]', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .get('/1')
            .end(function (err, response) {
                expect(err).to.be.null;
                expect(response).to.be.status(200);
                res = response;
                done();
            });
    });

    it('Should redirect to https://www.zackward.net', function (done) {
        expect(res.redirects[0]).to.equal("https://www.zackward.net/");
        done();
    });
});

describe('GET /api/shorturl/[short url]', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .get('/api/shorturl/1')
            .end(function (err, response) {
                expect(err).to.be.null;
                expect(response).to.be.status(200);
                res = response;
                done();
            });
    });

    it('Should redirect to https://www.zackward.net', function (done) {
        expect(res.redirects[0]).to.equal("https://www.zackward.net/");
        done();
    });
});
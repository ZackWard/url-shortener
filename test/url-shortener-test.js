var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var app = require('../url-shortener');
var server = app.app;
var db = app.db;


chai.use(chaiHttp);

// Database setup
before(function (done) {
    db.connect()
        .then(() => db.clearCollection('urls'))
        .then(() => done())
        .catch(err => done(err));
});

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
describe('GET /new/[url] (https://www.zackward.net)', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .get('/new/https://www.zackward.net')
            .end(function (err, response) {
                expect(err).to.be.null;
                res = response;
                done();
            });
    });

    it("Should return a 200 status", function (done) {
        expect(res).to.be.status(200);
        done();
    });

    it("Should return a json object", function (done) {
        expect(res).to.be.json;
        done();
    });

    it("Should have a short_url field with a value of 1", function (done) {
        expect(res.body).to.have.property('short_url');
        expect(res.body.short_url).to.equal(1);
        done();
    });

    it("Should have a long_url field with a value of https://www.zackward.net", function (done) {
        expect(res.body).to.have.property('long_url');
        expect(res.body.long_url).to.equal("https://www.zackward.net");
        done();
    });
});

describe('GET /new/blah (Invalid Input)', function () {
    var err;
    var res;
    before(function (done) {
        chai.request(server)
            .get('/new/blah')
            .end(function (error, response) {
                err = error;
                res = response;
                done();
            });
    });

    it("Should return a 400 status", function (done) {
        expect(res).to.be.status(400);
        done();
    });
});

describe('POST /new (https://news.google.com)', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .post('/new')
            .type('form')
            .send({long_url: "https://news.google.com"})
            .end(function (err, response) {
                if (err) {
                    done(err);
                } else {
                    res = response;
                    done();
                }
            });
    });

    it("Should return a 200 status", function (done) {
        expect(res).to.be.status(200);
        done();
    });

    it("Should return a json object", function (done) {
        expect(res).to.be.json;
        done();
    });

    it("Should have a short_url field with a value of 2", function (done) {
        expect(res.body).to.have.property('short_url');
        expect(res.body.short_url).to.equal(2);
        done();
    });

    it("Should have a long_url field with a value of https://news.google.com", function (done) {
        expect(res.body).to.have.property('long_url');
        expect(res.body.long_url).to.equal("https://news.google.com");
        done();
    });
});

describe('POST /api/shorturl/new (http://www.freecodecamp.com)', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .post('/api/shorturl/new')
            .type('form')
            .send({long_url: "http://www.freecodecamp.com"})
            .end(function (err, response) {
                if (err) {
                    done(err);
                } else {
                    res = response;
                    done();
                }
            });
    });

    it("Should return a 200 status", function (done) {
        expect(res).to.be.status(200);
        done();
    });

    it("Should return a json object", function (done) {
        expect(res).to.be.json;
        done();
    });

    it("Should have a short_url field with a value of 3", function (done) {
        expect(res.body).to.have.property('short_url');
        expect(res.body.short_url).to.equal(3);
        done();
    });

    it("Should have a long_url field with a value of http://www.freecodecamp.com", function (done) {
        expect(res.body).to.have.property('long_url');
        expect(res.body.long_url).to.equal("http://www.freecodecamp.com");
        done();
    });
});

// Redirect to long url
describe('GET /[short url] (1)', function () {
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

describe('GET /[short url] (2)', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .get('/2')
            .end(function (err, response) {
                expect(err).to.be.null;
                expect(response).to.be.status(200);
                res = response;
                done();
            });
    });

    it('Should redirect to https://news.google.com', function (done) {
        expect(res.redirects[0]).to.equal("https://news.google.com/");
        done();
    });
});

describe('GET /api/shorturl/[short url] (3)', function () {
    var res;
    before(function (done) {
        chai.request(server)
            .get('/api/shorturl/3')
            .end(function (err, response) {
                expect(err).to.be.null;
                expect(response).to.be.status(200);
                res = response;
                done();
            });
    });

    it('Should redirect to http://www.freecodecamp.com', function (done) {
        expect(res.redirects[0]).to.equal("http://www.freecodecamp.com/");
        done();
    });
});

describe("GET /10 (invalid link)", function () {
    var res;
    before(function (done) {
        chai.request(server)
            .get('/10')
            .end(function (err, response) {
                res = response;
                done();
            });
    });

    it("Should return a 404 error", function (done) {
        expect(res).to.be.status(404);
        done();
    });
});
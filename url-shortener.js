var express = require('express');
var app = express();
var helmet = require('helmet');
var bodyParser = require('body-parser');
var db = require('./db');
var isValidURL = require('validator').isURL;

var urlOptions = { 
    protocols: ['http','https'], 
    require_tld: true, 
    require_protocol: false, 
    require_host: true, 
    require_valid_protocol: true, 
    allow_underscores: false, 
    host_whitelist: false, 
    host_blacklist: false, 
    allow_trailing_dot: false, 
    allow_protocol_relative_urls: false 
}

var port = 3002;

// Set up middleware here
app.use(helmet());
app.use('/static', express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/public/new-link.html", function (err) {
        if (err) {
            console.error(err);
            res.status(500).end("Error");
        }
    });
});

// This route will catch any GET requests that start with /new/[url]. This is necessary to include the double slashes in http:// or https://
app.get(/\/new\/(http(s?):\/\/)?(.*)/, function (req, res) {
    // If protocol wasn't included, default to http://
    var longUrl = req.params[0] == undefined ? "http://" + req.params[2] : req.params[0] + req.params[2];
    if (isValidURL(longUrl, urlOptions)) {
        db.addLink(longUrl)
            .then((result) => {res.json(result)})
            .catch((err) => {res.status(500).end(err)});
    } else {
        res.status(400).end("Cannot add URL: Invalid URL");
    }
});

app.post(['/new', '/api/shorturl/new'], function (req, res) {
    var longURL = String(req.body.long_url).substr(0, 4).toLowerCase() == "http" ? String(req.body.long_url) : "http://" + String(req.body.long_url);
    if (isValidURL(longURL, urlOptions)) {
        db.addLink(longURL)
            .then((result) => {res.json(result)})
            .catch((err) => {res.status(500).end(err)});
    } else {
        res.status(400).end("Cannot add URL: Invalid URL");
    }
});

app.get(['/:short_url', '/api/shorturl/:short_url'], function (req, res) {
    db.getLink(req.params.short_url)
        .then(function (link) { res.redirect(link); })
        .catch(function (err) { res.status(404).end("URL Not Found"); });
});

// Start app
db.connect()
    .then(function () {
        app.listen(port, 'localhost', function () {
            console.log("URL Shortener listening on port " + port);
            });
    })
    .catch(function (err) {
        console.log("Error connecting to database: " + err);
        process.exit(1);
    });

module.exports.app = app;
module.exports.db = db;
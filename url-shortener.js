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

app.use(helmet());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function (req, res) {
    console.log("GET " + req.url);
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
    console.log("GET " + req.url);
    console.log(req.params);
    console.log("Long url: " + longUrl);
    if (isValidURL(longUrl, urlOptions)) {
        db.addLink(longUrl, function (err, newLink) {
            if (err) {
                console.error(err);
                res.status(500).end("Error");
            } else {
                res.json(newLink);
            }
        });
    } else {
        res.status(400).end("Cannot add URL: Invalid URL");
    }
});

app.post(['/new', '/api/shorturl/new'], function (req, res) {
    console.log("POST " + req.url);
    console.log("Long url: " + req.body.long_url);
    var longURL = String(req.body.long_url).substr(0, 4).toLowerCase() == "http" ? String(req.body.long_url) : "http://" + String(req.body.long_url);
    if (isValidURL(longURL, UrlOptions)) {
        db.addLink(longURL, function (err, newLink) {
            if (err) {
                console.error(err);
                res.status(500).end("Error");
            } else {
                res.json(newLink);
            }
        });
    } else {
        res.status(400).end("Cannot add URL: Invalid URL");
    }
});

app.get(['/:short_url', '/api/shorturl/:short_url'], function (req, res) {
    console.log("GET " + req.url);
    db.getLink(req.params.short_url, function (err, link) {
        if (err) {
            console.log(err);
            res.status(404).end("URL Not Found");
        } else {
            res.redirect(link);
        }
    });
});

// Start app
db.connect(function (err) {
    if (err) {
        console.error("Unable to start Mongodb!");
        process.exit(1);
    }
    app.listen(port, 'localhost', function () {
        console.log("URL Shortener listening on port " + port);
    });
});

module.exports = app;
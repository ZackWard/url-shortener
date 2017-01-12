var mongodb = require('mongodb').MongoClient;
var dbUrl = "mongodb://localhost:27017/url-shortener";

var state = {
    db: null
};

module.exports.connect = function (done) {
    mongodb.connect(dbUrl, function (err, db) {
        if (err) {
            done(err);
        }
        console.log("Connected to MongoDB");
        state.db = db;
        done();
    });
};

module.exports.get = function () {
    return state.db;
};

module.exports.close = function (done) {
    if (state.db) {
        state.db.close();
    }
};

module.exports.addLink = function addLink(url, done) {
    if (state.db == null) {
        done("No database available");
        return;
    }
    state.db.collection('urls').aggregate([{$group: {_id: null, max_short_url: {$max: "$short_url"} } }], function (err, result) {
            if (err) {
                done("Error", null);
            } else {
                console.log(result);
                var newLink = {
                    long_url: url,
                    short_url: Number(result[0].max_short_url) + 1
                };
                state.db.collection('urls').insertOne(newLink, function(err, result) {
                    if (err) {
                        done("Error", null);
                    } else {
                        console.log("Added link!");
                        console.log(newLink);
                        done(null, newLink);
                    }
                });
            }
    });
};

module.exports.getLink = function getLink(linkID, done) {
    if (state.db == null) {
        done("Database unavailable", null);
        return;
    }
    state.db.collection('urls').findOne({"short_url": Number(linkID)}, {fields: { "_id": 0 }}, function (err, doc) {
        if (err) {
            console.error(err);
            done(err, null);
        } else if (doc == null) {
            done("URL Not Found", null);
        } else {
            done(null, doc.long_url);
        }
    });

};
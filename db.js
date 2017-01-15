var mongodb = require('mongodb').MongoClient;
var dbUrl = (process.env['URL_SHORTENER_MODE'] == "test") ? "mongodb://localhost:27017/url-shortener-test" : "mongodb://localhost:27017/url-shortener";

var state = {
    db: null
};

var connect = function connect() {
    return new Promise(function (resolve, reject) {
        // Close the current database connection if it exists
        if (state.db) {
            state.db.close();
        }
        mongodb.connect(dbUrl, function (err, db) {
            if (err) {
                reject(err);
            }
            console.log("Connected to MongoDB url: " + dbUrl);
            state.db = db;
            resolve(state.db);
        });
    });
};

var get = function get() {
    return state.db;
};

var close = function close(done) {
    if (state.db) {
        state.db.close();
    }
};

var checkLink = function checkLink(url) {
    return new Promise(function (resolve, reject) {
        if (state.db == null) {
            return reject("Database not available.");
        }
        state.db.collection('urls').findOne({"long_url": url}, {fields: { "_id": 0 }}, function (err, doc) {
            if (err) {
                return reject(err);
            } else if (doc == null) {
                resolve(null);
            } else {
                resolve(doc);
            }
        });
    });
};

var getMaxShortUrl = function getMaxShortUrl() {
    return new Promise(function (resolve, reject) {
        if (state.db == null) {
            return reject("Database not available.");
        }
        state.db.collection('urls').aggregate([{$group: {_id: null, max_short_url: {$max: "$short_url"} } }], function (err, result) {
            if (err) {
                return reject(err);
            }
            // If there are no results, the database is empty. We should return 0;
            if (result.length == 0) {
                resolve(0);
            } else {
                resolve(Number(result[0].max_short_url));
            }
        });
    });
};

var addLink = function addLink(url) {
    return new Promise(function (resolve, reject) {
        if (state.db == null) {
            return reject("Database not available.");
        }
        checkLink(url)
            .then(function (result) {
                if (result == null) {
                    getMaxShortUrl()
                        .then(function(max_short_url) {
                            var newLink = {
                                long_url: url,
                                short_url: max_short_url + 1
                            };
                            state.db.collection('urls').insertOne(newLink, function(err, result) {
                                if (err) {
                                    return reject(err);
                                } else {
                                    resolve({
                                        long_url: newLink.long_url,
                                        short_url: newLink.short_url
                                    });
                                }
                            });
                        })
                        .catch(reject);
                } else {
                    resolve(result);
                }
            })
            .catch(reject);
    });
};

var getLink = function getLink(linkID) {
    return new Promise(function (resolve, reject) {
        if (state.db == null) {
            return reject("Database not available.");
        }
        state.db.collection('urls').findOne({"short_url": Number(linkID)}, {fields: { "_id": 0 }}, function (err, doc) {
            if (err || doc == null) {
                return reject(err);
            } else {
                resolve(doc.long_url);
            }
        });
    });
};

var clearCollection = function clearCollection(collectionName) {
    return new Promise(function (resolve, reject) {
        if (state.db == null) {
            return reject("Database unavailable");
        }
        var collection = state.db.collection(collectionName);
        // First, insert a record. This insures that the collection will exist when we drop it later.
        collection.insertOne({"test":"test"})
            .then(() => collection.drop())
            .then(() => resolve())
            .catch(err => reject(err));
    });
};


// Set up module exports
module.exports.connect = connect;
module.exports.get = get;
module.exports.close = close;
module.exports.checkLink = checkLink;
module.exports.getMaxShortUrl = getMaxShortUrl;
module.exports.addLink = addLink;
module.exports.getLink = getLink;
module.exports.clearCollection = clearCollection;
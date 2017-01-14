var mongodb = require('mongodb').MongoClient;

var state = {
    db: null
};

module.exports.connect = function (dbUrl, done) {
    // Close the current database connection if it exists
    if (state.db) {
        state.db.close();
    }
    
    mongodb.connect(dbUrl, function (err, db) {
        if (err) {
            done(err);
        }
        console.log("Connected to MongoDB url: " + dbUrl);
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

module.exports.checkLink = function checkLink(url, done) {
    if (state.db == null) {
        done("Database unavailable", null);
        return;
    }
    state.db.collection('urls').findOne({"long_url": url}, {fields: { "_id": 0 }}, function (err, doc) {
        if (err) {
            console.error(err);
            done(err, null);
        } else if (doc == null) {
            done(null, false);
        } else {
            done(null, doc);
        }
    });
};

module.exports.addLink = function addLink(url, done) {
    if (state.db == null) {
        done("No database available");
        return;
    }

    // Check to see if the url is already in the database. If it is, just return that one
    this.checkLink(url, function (err, link) {
        if (err) {
            done(err);
        } else if (link === false) {
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
        } else {
            done(null, link);
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

module.exports.clearCollection = function clearCollection(collectionName, done) {
    if (state.db == null) {
        done("Database unavailable");
    } else {
        state.db.collection(collectionName).drop(function (err, reply) {
            if (err) {
                return done(err);
            }
            state.db.listCollections().toArray(function (err, reply) {
                if (err) {
                    return done(err);
                }
                var found = false;
                reply.forEach(function (col) {
                    if (col.name == collectionName) {
                        found = true;
                        return;
                    }
                });
                if (found) {
                    done("Error, collection " + collectionName + " was not dropped.");
                } else {
                    done();
                }
            });
        });
    }
};
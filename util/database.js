const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
let _db;
const uri = "mongodb://localhost:27017/shop?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
const mongoConnect = callback => {
    MongoClient.connect(uri, { useUnifiedTopology: true })
    .then(client => {
        _db = client.db();
        callback();
    }) 
    .catch(err => {
        console.log(err);
        throw err;
    })
}

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw "No database found";
};
exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

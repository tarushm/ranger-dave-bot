'use strict'

var redis = require('redis');
var sendTextMessage = require('./messaging.js').sendTextMessage;
const redisClient = redis.createClient(process.env.REDIS_URL);

function get_rating_for_artist(artist_idx) {
    return new Promise(function(success, fail) {
        redisClient.multi([
            ["hget", "artist_rating_score", artist_idx],
            ["hget", "artist_rating_count", artist_idx],
        ]).exec(function(err, replies) {
            let score = parseFloat(replies[0]);
            let count = parseFloat(replies[1]);
            if (isNaN(score) || isNaN(count)) {
                success({success: false});
            } else if (count == 0) {
                success({success: false });
            } else {
                success({success: true, amount: score/count });
            }
        });
    });
}

function process_rating(sender, parsedJson) {
    new Promise(function(success, fail) {
        let params = parsedJson.result.parameters;

        redisClient.multi([
            ["hincrby", "artist_rating_score", params.bands, parseInt(params.rating)],
            ["hincrby", "artist_rating_count", params.bands, 1],
        ]).exec(function(err, replies) {
            success();
        });
    }).then(function() {
        sendTextMessage(sender, "Thanks for letting us know!");
    });
}

module.exports = {
    get_rating_for_artist: get_rating_for_artist,
    process_rating: process_rating
};

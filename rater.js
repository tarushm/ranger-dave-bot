'use strict'

var redis = require('redis');
var sendTextMessage = require('./messaging.js').sendTextMessage;
var bands = require('./bands.json').band;
var moment = require('moment-timezone')

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
                success({artistId: artist_idx, success: false});
            } else if (count == 0) {
                success({artistId: artist_idx, success: false });
            } else {
                success({
                    artistId: artist_idx,
                    success: true,
                    amount: score/count 
                });
            }
        });
    });
}

function get_artist_at_time(ts) {
    var bandsInTs = [];
    for (var i=0; i < bands.length; i++) {
        let currentBand = bands[i];
        let startDate = moment(currentBand.day + " " + currentBand.start_time);
        let endDate = moment(currentBand.day + " " + currentBand.end_time);
        if (ts.isSameOrAfter(startDate) && ts.isBefore(endDate)) {
            bandsInTs.push(i);
        }
    }
    return bandsInTs;
}

ffunction get_hotness_at_epoch(date, numBest) {
    var bandsInEpoch = [];
    for (var i=0; i < bands.length; i++) {
        let currentBand = bands[i];
        let startDate = moment(currentBand.day + " " + currentBand.start_time);
        let endDate = moment(currentBand.day + " " + currentBand.end_time);
        console.log(date.toString(), endDate.toString());
        if (date.isSameOrAfter(startDate) && date.isBefore(endDate)) {
            bandsInEpoch.push(get_rating_for_artist(i));
        }
    }
    return Promise.all(bandsInEpoch).then(function(results) {
        var finalResults = [];
        for (var i=0; i < results.length; i++) {
            if (results[i].success) {
                finalResults.push([
                    bands[results[i].artistId].name,
                    results[i].amount
                ]);
            }
        }
        finalResults.sort(function (a, b) {
            if (a[1] > b[1]) {
                return -1;
            }
            if (a[1] < b[1]) {
                return 1;
            }
            return 0;
        });
        return finalResults.map(function(res) {
            return res[0];
        }).slice(0, numBest);
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
    process_rating: process_rating,
    get_hotness_at_epoch: get_hotness_at_epoch,
    get_artist_at_time: get_artist_at_time
};
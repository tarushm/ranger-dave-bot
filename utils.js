'use strict'

var redis = require('redis');
var sendDirections = require('./maps.js').sendDirections;
var sendTextMessage = require('./messaging.js').sendTextMessage;
var sendPlayingAtTimeCards = require('./messaging.js').sendPlayingAtTimeCards;
var sendSingleScore = require('./messaging.js').sendSingleScore;
var artist_to_genre = require('./artist_to_genre.json')
var genre_to_artists = require('./genre_to_artists.json')
var rater = require('./rater.js');
var moment = require('moment-timezone')
var bands = require('./bands.json')
var request = require('request')

const token = "EAAO4Pbcmmj0BALB6dbkRSM6dXO30iFWTANp1DP4dW3U5z0uwoMFsuvVZCOi6aTXMMwckQqVwo3Te0xskc6VyOsuVDaPAAO32NHJ8sLO7jZBs4NNlgZA8e6LmTiqxHISdYyOBVCKoCTNjNoaC4hs9FbJsWk7gYCemuFOtASh8QZDZD";
const rollbar = require('rollbar');
rollbar.init("b8e7299b830a4f5b86c6859e887cfc65");
const redisClient = redis.createClient(process.env.REDIS_URL);

const DAY_TO_MOMENT_MAP = [
    moment('Friday, August 05 2016'),
    moment('Saturday, August 06 2016'),
    moment('Sunday, August 07 2016')
]


function getCreators(sender, body, func) {
    var payload = {
        "recipient":{
            "id":"USER_ID"
        },
        "message":{
            "attachment":{
                "type":"template",
                "payload":{
                    "template_type":"button",
                    "text":"Below are my creators. Feel free to contact them.",
                    "buttons":[
                    {
                        "type":"web_url",
                        "url":"https://www.facebook.com/daniel.pyrathon",
                        "title":"Daniel Pyrathon"
                    },
                    {
                        "type":"web_url",
                        "url":"https://www.facebook.com/brian.yan.5264",
                        "title":"Brian Yan"
                    },
                    {
                        "type":"web_url",
                        "url":"https://www.facebook.com/thetarush",
                        "title":"Tarush Mohanti"
                    }
                    ]
                }
            }
        }
    };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: payload
    }, function(error, response, body) {
        if (error) {
            rollbar.handleError(error);
        }
    });
}

function getSimilar(sender, body, func) {
    var params = body.result.parameters;
    var band = params.bands;

    // Get genre
    let genreForBand = artist_to_genre[band.toString()];
    if (genreForBand == undefined) {
        sendTextMessage(sender, "we couldn't find similar artists at this time");
    } else {
        let reccomendList = genre_to_artists[genreForBand];
        reccomendList = reccomendList.filter(function(el) {
            return el != band;
        });
        sendPlayingAtTimeCards(sender,reccomendList);
    }
}

function scoreSingleArtist(sender, body, func) {
    var band_id = body.result.parameters.bands;
    rater.get_rating_for_artist(band_id).then(function(result) {
        if (!result.success) {
            sendTextMessage(sender, bands.band[band_id].name + " has not been rated yet! You should rate artists as you\'re seeing them!");
        } else {
            sendSingleScore(sender, band_id, result.amount);
        }
    });
}


function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
}


function conflictWithBand(sender, body, func) {
    var band_id = body.result.parameters.bands;
    var start = moment(bands.band[band_id].day + ' ' + bands.band[band_id].start_time);
    var end = moment(bands.band[band_id].day + ' ' + bands.band[band_id].end_time)

    var playingAtStart = rater.get_artist_at_time(start);
    var playingAtEnd = rater.get_artist_at_time(end);

    var conflicting = arrayUnique(playingAtStart.concat(playingAtEnd))


    if (conflicting.length > 0) {
        sendPlayingAtTimeCards(sender,conflicting)
    } else {
        sendTextMessage(sender, 'Wow! No one is conflicting with ' + bands.band[band_id].name +'! It\'s your lucky day');
    }
}

function processTheHush(sender, body, func) {
    redisClient.sadd('speakeasy_pt2', sender, function(err, res) {
         sendTextMessage(sender, 'congratulations!');
    });
}

function processOutsideHacks(sender, body, func) {
    redisClient.sadd('speakeasy_pt1', sender, function(err, res) {
         sendTextMessage(sender, 'go to the windmill then walk 59 paces North');
    });
}

function getHotnessAtEpoch(sender, body, func) {
   var date = moment()
   rater.get_hotness_at_epoch(date, 3).then(function(results) {
     if (results.length == 0) {
         sendTextMessage(sender, 'Nothing seems to be popping right now. You should rate artists as you\'re seeing them! \u{1F525}')
     } else {
       let msg = "Here are the following artists in order:\n";
       results.forEach(function(result) {
         msg += bands.band[result].name + "\n";
       });
       sendTextMessage(sender, msg);
     }
   });
}

function playingAtTime(sender, body, func) {
    var params = body.result.parameters;

    // if no date, assume it's today
    var date;
    if (params.day) {
        date = DAY_TO_MOMENT_MAP[parseInt(params.day)];
    } else {
        if (params.date) {
            date = moment(params.date);
        } else {
            date = moment();
        }
    }
    // get time and bump to 12 hr if necessary
    let timeItems = params.time.split(':').map(function(e) { return parseInt(e);} );
    if (timeItems[0] < 12) {
        timeItems[0] += 12;
    }
    date.hour(timeItems[0]);
    date.minutes(timeItems[1]);
    date.seconds(0);

    var playingAtTime = rater.get_artist_at_time(date);
    if (playingAtTime.length > 0) {
        sendPlayingAtTimeCards(sender,playingAtTime)
    } else {
        sendTextMessage(sender, 'It doesn\'t seem like anyone one is playing at the time! Outside Lands is Friday August 5 - Sunday August 7 this year!');
    }
}

function getDirections(sender, body, func) {
    var band_id = body.result.parameters.bands;
    var stage_id = body.result.parameters.stages;
    // they did give stage and maybe band
    if(stage_id != ""){
        sendDirections(sender,"",stage_id);
        sendTextMessage(sender, 'Make sure to rate the artist\'s performace when you get there!')
    }
    // they forsure gave us band only
    else if(band_id != "") {
        sendDirections(sender, band_id, bands.band[band_id].stageId);
        sendTextMessage(sender, 'Make sure to rate '+bands.band[band_id].name+'\'s performance when you get there!')
    }
    else{
        sendTextMessage(sender, 'I\'m a little bit confused about who you want to see');
    }
    return true;
}

module.exports = {
    'getSimilar': getSimilar,
    'getDirections': getDirections,
    'playingAtTime': playingAtTime,
    'getHotnessAtEpoch': getHotnessAtEpoch,
    'conflictWithBand': conflictWithBand,
    'scoreSingleArtist': scoreSingleArtist,
    'processOutsideHacks': processOutsideHacks,
    'processTheHush': processTheHush,
    'getCreators': getCreators,
};

'use strict'

const querystring = require('querystring')
const express = require('express')
const rollbar = require('rollbar');
const bodyParser = require('body-parser')
const moment = require('moment-timezone')
const request = require('request')
const rater = require('./rater.js');
const utils = require('./utils.js');
const uuid = require('node-uuid');
var redis = require('redis');
var foods = require('./food.json')
var bands = require('./bands.json')


var sendTextMessage = require('./messaging.js').sendTextMessage;
var sendLineup = require('./lineup.js').sendLineup;
var preprocessFoodTypes = require('./getfood.js').preprocessFoodTypes;

var band_key = [];
for (var j = 0; j < bands.band.length; j++ ){
  band_key.push(bands.band[j].name);
}

const app = express()
const redisClient = redis.createClient(process.env.REDIS_URL);
const token = 'EAAO4Pbcmmj0BALB6dbkRSM6dXO30iFWTANp1DP4dW3U5z0uwoMFsuvVZCOi6aTXMMwckQqVwo3Te0xskc6VyOsuVDaPAAO32NHJ8sLO7jZBs4NNlgZA8e6LmTiqxHISdYyOBVCKoCTNjNoaC4hs9FbJsWk7gYCemuFOtASh8QZDZD';
const SENTIMENT_MAP = [
    "not the best.",
    "below average",
    "okay",
    "great",
    "awesome",
    "legendary",
]

var MAP_TO_PROCESS = {
    'get_similar': utils.getSimilar,
    'get_directions': utils.getDirections,
    'get_rating': function(sender, body, func) {
        rater.process_rating(sender, body);
    },
    'playing_at_time': utils.playingAtTime,
    'get_hotness_at_epoch': utils.getHotnessAtEpoch,
    'conflict_with_band': utils.conflictWithBand,
    'score_single_artist': utils.scoreSingleArtist,
    'get_stage': function(sender, body, func) {
        var id = body.result.parameters.bands;
        get_stage(sender,id);
    },
    'get_settime': function(sender, body, func) {
        var id = body.result.parameters.bands;
        get_settime(sender,id);
    },
    'get_food_type': function(sender, body, func) {
        var type = body.result.parameters.food_type;
        get_food_type(sender, type);
    },
    'get_bandinfo': function(sender, body, func) {
          var id = body.result.parameters.bands;
          get_bandinfo(sender,id);
    },
    'greet': function(sender, body, func) {
        greet(sender);
    },
    'get_help': function(sender, body, func) {
        get_help(sender);
    },
    'get_lineup': function(sender, body, func) {
        get_lineup(sender);
    }
}


rollbar.init("b8e7299b830a4f5b86c6859e887cfc65");
app.set('port', (process.env.PORT || 5000))


// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// for Facebook verification
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') 
  {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
          let messaging_events = req.body.entry[0].messaging
          for (let i = 0; i < messaging_events.length; i++) {
            let event = req.body.entry[0].messaging[i]
            let sender = event.sender.id
            if (event.message && event.message.text) {
              let text = event.message.text
              processMessage(sender, text);
            }
          }
        }
      });
    });
  }
  res.sendStatus(200);
});

app.post('/personal/', function (req, res) {
  processMessage(req.body.uid, req.body.body);
  res.sendStatus(200);
});

// Spin up the server and enable Rollbar
app.use(rollbar.errorHandler('b8e7299b830a4f5b86c6859e887cfc65'))
app.listen(app.get('port'), function() {
  console.log('running on port', app.get('port'))
})

function processWeather(facebookUid) {
    var weatherEndpoint = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22' + 'Golden Gate Park' + '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
    request({
        url: weatherEndpoint,
        json: true
    }, function(error, response, body) {
        try {
            var condition = body.query.results.channel.item.condition;
            sendWeatherCard(facebookUid, condition.temp,condition.text,'Outside Lands in Golden Gate Park');
        } catch(err) {
            console.error('error caught', err);
            sendTextMessage(facebookUid, "There was an error.");
        }
    });
}

function processMessage(facebookUid, text) {
    console.log('processing message: ' + text)
    var weather_key = ['weather','sunny','umbrella','temperature','forecast'];
    var isWeather = checkIfContained(text,weather_key);
    if (isWeather) {
        processWeather(facebookUid)
    }
    else {
      var band_id = checkBand(text, band_key);
      sendToApiAi(facebookUid, text, band_id);
    }
  }

  function handleSessionId(currentSender, info) {
    return new Promise(function(success, failure) {
      if (info.result && info.result.actionIncomplete === false) {
        redisClient.hdel("api_ai_sessions", currentSender, function(err, res) {
          success();
        });
      } else {
        if (!info.sessionId) {
          return true;
        }
        redisClient.hset("api_ai_sessions", currentSender, info.sessionId, function(err, res) {
          success();
        });
      }
    });
  }

  function sendToApiAi(sender, message, id){
    let urlParams = {
      v: "20150910",
      query: message,
      lang: 'en',
      timezone: "America/Los_Angeles"
    };

    redisClient.hget("api_ai_sessions", sender, function (err, sessionId) {
      if (sessionId) {
        urlParams["sessionId"] = sessionId;
      } else {
        urlParams["sessionId"] = uuid.v1();
      }

      var options = {
        url: 'https://api.api.ai/api/query?' + querystring.stringify(urlParams),
        headers: {
          'Authorization': 'Bearer f0c35775b7ef487c9fee9f2e80ddb89c'
        }
      };

      let currentSender = sender;
      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          var data = JSON.parse(body);

          handleSessionId(currentSender, data).then(function() {
            if (data.result.source == 'domains') {
              sendTextMessage(sender, data.result.fulfillment.speech);
            }
            else if (!data.result.actionIncomplete){
              processRequest(sender, data);
            }
            else {
              sendTextMessage(sender, data.result.fulfillment.speech);
            }
          });
        }
      }

      request(options, callback);
    });
  }

  function processRequest(sender, body){
    var func = body.result.action;
    var funcHandler = MAP_TO_PROCESS[func];
    if (funcHandler === undefined) {
      sendTextMessage(sender, 'Hmm. I\'m having some trouble getting you that information. Make sure you spelled the band or artist name correctly and try again!');
    } else {
        funcHandler(sender, body, func);
    }
  }

  function get_help(sender){
    sendHelp(sender);
    return true;
  }

function get_stage(sender, id) {
  sendTextMessage(sender, bands.band[id].name + ' is playing at ' + bands.band[id].stage);
  return true;
}

function get_settime(sender, id) {
  sendTextMessage(sender, bands.band[id].name + ' is playing from ' + bands.band[id].start_time +' to '+ bands.band[id].end_time + ' on ' + bands.band[id].day);
  return true;
}

function get_food_type(sender,type){
  var foodtype_map = preprocessFoodTypes()
  console.log('in get_food_type, moving on to show me food')
  showMeFood(sender, foodtype_map[type])
}
function get_bandinfo(sender, id){
  sendBandCard(sender, id);
  //getSpotifyTracks(sender, id);
  return true;
}

function greet(sender){
  sendTextMessage(sender, "Hello! I am Ranger Dave Bot. I know anything and everything about Outside Lands. Ask me about your favorite artist, what kind of food you want to eat, or even the weather!")
}

function get_lineup(sender){
  sendTextMessage(sender, "Here\'s the Outside Lands lineup!")
  sendLineup(sender);
}
function checkIfContained(text,key){
  var contained = false;
  for (var j = 0; j < key.length; j++){
    contained = contained || (text.toUpperCase().indexOf(key[j].toUpperCase()) > -1);
  }
  return contained;
}

function checkBand(text){
  var contained = false;
  var band = -1;
  for (var j = 0; j < band_key.length && !contained; j++){
    contained = contained || (text.toUpperCase().indexOf(band_key[j].toUpperCase()) > -1);
    if (contained){
      return j
    }
  }
  return -1;
}

function sendHelp(sender) {
  let messageData =
  {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text": "Here are some things you can ask me!",
        "buttons":[
          {
            "type":"postback",
            "title": "I want a burger.",
            "payload": "I want a burger."
          },
          {
            "type":"postback",
            "title": "What stage is lit?",
            "payload": "What stage is lit?"
          },
          {
            "type":"postback",
            "title": "Directions to Sutro?",
            "payload": "Directions to Sutro?"
          }
        ]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      //console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      //console.log('Error: ', response.body.error)
    }
  })
}

function sendLineup(sender) {
  let messageData =
  {
    "attachment":{
      "type":"image",
      "payload":{
        "url":"http://richmondsfblog.com/wp-content/uploads/2016/04/2016lineup.jpg"
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      //console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      //console.log('Error: ', response.body.error)
    }
  })
}

function sendWeatherCard(sender,temp,text,loc){
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements":[{
          "title": temp + '\xB0 and ' + text,
          "subtitle": loc,
          "buttons":[{
            "type": "web_url",
            "url": 'https://www.yahoo.com/news/weather/united-states/san-francisco/san-francisco-23679437',
            "title": 'Expand forecast.'
          }]
        }]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}




function showMeFood(sender,list) {
  let elements = [];
  var rand = randFood(list);
  for (var i = 0; i < list.length && i < 10; i++){
    console.log(list[(i+rand)%list.length]);
    elements.push(
    {
      "title": list[(i+rand)%list.length].name,
      "image_url": list[(i+rand)%list.length].img,
      "subtitle": list[(i+rand)%list.length].description,
      "buttons":[{
        "type": "web_url",
        "url": list[(i+rand)%list.length].url,
        "title": 'Check it out!'
      }]
    })
  }

  let messageData = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements": elements
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

function getSpotifyTracks(sender, band_id){
  request({
    url: 'https://api.spotify.com/v1/search?q='+bands.band[band_id]+'&type=artist&limit=1',
    method: 'GET'
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    }
    else {
      console.log("NOT SURE WHAT HERE");
    }
  })
}

function sendBandCard(sender,id){
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements":[{
          "title": bands.band[id].name,
          "subtitle": bands.band[id].stage + ', ' + bands.band[id].day + ' at ' + bands.band[id].start_time,
          "image_url": bands.band[id].img,
          "buttons":[{
            "type": "web_url",
            "url": bands.band[id].website_url,
            "title": 'Artist Website'
          },
          {
            "type": "web_url",
            "url": bands.band[id].url,
            "title": 'Add to Schedule'
          }
          ]
        }]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  processMessage(senderID, payload);
}

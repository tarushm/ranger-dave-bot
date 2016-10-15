'use strict'

const querystring = require('querystring');
const express = require('express');
const rollbar = require('rollbar');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const request = require('request');
const rater = require('./rater.js');
const utils = require('./utils.js');
const uuid = require('node-uuid');
var redis = require('redis');
var foods = require('./food.json');
var bands = require('./bands.json');
var allowed = require('./allowed.json');


var sendTextMessage = require('./messaging.js').sendTextMessage;
var randFood = require('./messaging.js').randFood;
var sendLineup = require('./lineup.js').sendLineup;
var foodTypes = require('./getfood.js').preprocessFoodTypes();

const app = express();
const redisClient = redis.createClient(process.env.REDIS_URL);
const token = 'EAAO4Pbcmmj0BALB6dbkRSM6dXO30iFWTANp1DP4dW3U5z0uwoMFsuvVZCOi6aTXMMwckQqVwo3Te0xskc6VyOsuVDaPAAO32NHJ8sLO7jZBs4NNlgZA8e6LmTiqxHISdYyOBVCKoCTNjNoaC4hs9FbJsWk7gYCemuFOtASh8QZDZD';
const OSL_WORDS = [
    "OSL",
    "Outside Lands",
    "OutsideLands"
];

const SENTIMENT_MAP = [
    "not the best.",
    "below average",
    "okay",
    "great!",
    "awesome",
    "legendary",
]

const SPEAKEASY_WORDS = new Set([
    "password",
    "speakeasy",
    "secret",
    "hidden",
    "treasure",
    "hush"
]);

const CODING_CHALLENGE_WORDS = new Set([
    "Binary Code",
    "binary",
    "binary code",
    "binarycode",
]);

const STATIC_REQUEST = {
    'who is stella': 'process_stella',
    'outside hacks': 'process_outside_hacks',
}

var MAP_TO_PROCESS = {
    'get_headline': function(sender, body, func) {
        var params = body.result.parameters;
        utils.playingAtTime(sender, {
            result: {
                parameters: {
                    day: params.day,
                    date: params.date,
                    time: "21:00:00"
                }
            }
        }, func);
    },
    'process_stella': function(sender, body, func) {
        sendTextMessage(sender, "Stella is pretty sweet and will soon renovate Oakland!");
    },
    'process_speakeasy_number': utils.processSpeakeasyNumber,
    'process_outside_hacks': utils.processOutsideHacks,
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
    'get_creators': utils.getCreators,
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
    },
    'get_weather_forecast': function(sender, body, func) {
        processWeather(sender);
    },
    'get_permitted': function(sender, body, func){
      var item = body.result.parameters.permitted;
      get_permitted(sender,item)
    }
};


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

var checkAuthForHush = function(sender) {
    return new Promise(function(resolve, reject) {
        redisClient.sismember('speakeasy_pt1', sender, function(err, res) {
            resolve(res);
        });
    });
};

var checkIfIsOSL = function(sender) {
    return new Promise(function(resolve, reject) {
        redisClient.exists('isOsl:' + sender, function(err, res) {
            if (err) {
                return reject(err);
            }
            resolve(res);
        });
    });
};

var handleRequestWrapper = function(sender, text, requestId) {
    return new Promise(function(resolve, reject) {
        checkIfIsOSL(sender).then(function(res) {
            if (!res) {

                // No festival is set, check if user says he is at Outside Lands
                var lowercaseString = text.trim().toLowerCase();
                var found = false;
                OSL_WORDS.forEach(function(word) {
                    if (lowercaseString.indexOf(word.toLowerCase()) != -1) {
                        found = true;
                        redisClient.setex("isOsl:" + sender, 60 * 5, "1", function(err, res) {
                            sendTextMessage(sender, "Brilliant! Happy to have you here! how can I help?");
                            reject();
                        });
                    }
                });
                if (!found) {
                    sendTextMessage(sender, "Hi! In order to serve you better, you should tell me what festival you are referring to");
                    reject();
                }
            } else {
                resolve();
            }
        });
    });
};

var handleRequest = function(sender, text, requestId) {
    redisClient.sadd('seen_users', sender);
    let trimmedText = text.trim().toLowerCase().replace(/[^a-zA-Z0-9 ]+/g, '').replace('/ {2,}/',' ');

    // Check if user is already in OSL

    // Check if it's a speakeasy query
    let words = trimmedText.split(' ');
    let complete = false;

    for (var i=0; i < words.length; i++) {

        if (complete) {
            break;
        }

        var word = words[i];
        if (SPEAKEASY_WORDS.has(word)) {
            console.log("[" + sender + "][" + requestId + "][STATIC] Nominated a speakeasy word");
            return sendTextMessage(sender, "The password is the year golden gate park was founded.");
        }

        if (CODING_CHALLENGE_WORDS.has(word)) {
            complete = true;
            checkAuthForHush(sender).then(function(hasAccess) {
                if (!hasAccess) {
                    console.log("[" + sender + "][" + requestId + "][STATIC] Has no access for speakeasy");
                    return handleRequest(sender, "help", requestId);
                }
                let staticRequestFn = MAP_TO_PROCESS['process_speakeasy_number'];
                return staticRequestFn(sender, text, null);
            });
        }
    }

    if (complete) {
        return;
    }

    let staticRequestKey = STATIC_REQUEST[trimmedText];
    if (staticRequestKey !== undefined) {
        console.log("[" + sender + "][" + requestId + "][STATIC] Going through a static route: " + staticRequestKey);

        let staticRequestFn = MAP_TO_PROCESS[staticRequestKey];
        return staticRequestFn(sender, text, null);

    } else {
        return sendToApiAi(sender, text, requestId);
    }
};

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
          if (messagingEvent.message && messagingEvent.message.is_echo) {
              rollbar.reportMessage("Echo message from FB", "info");
              return;
          }

          let messaging_events = req.body.entry[0].messaging;
          for (let i = 0; i < messaging_events.length; i++) {
            let event = req.body.entry[0].messaging[i];
            let sender = event.sender.id;
            if (event.message && event.message.text) {
              let text = event.message.text;
              let requestId = uuid.v1();
              console.log("[" + sender + "][" + requestId + "][REQUEST] " + text);
              handleRequestWrapper(sender, text, requestId).then(function() {
                  handleRequest(sender, text, requestId);
              });
            }
          }
        }
      });
    });
  }
  res.sendStatus(200);
});

app.post('/personal/', function (req, res) {
  var currentUuid = uuid.v1();
  handleRequestWrapper(req.body.uid, req.body.body, currentUuid).then(function() {
      handleRequest(req.body.uid, req.body.body, currentUuid);
  });
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
            rollbar.handleError(err);
            sendTextMessage(facebookUid, "There was an error.");
        }
    });
}

  function handleSessionId(currentSender, info) {
    return new Promise(function(success, failure) {
      if (info.result && info.result.actionIncomplete === false) {
        redisClient.del("session:" + currentSender, function(err, res) {
          success();
        });
      } else {
        if (!info.sessionId) {
          return true;
        }
        redisClient.setex("session:" + currentSender, 60 * 5, info.sessionId, function(err, res) {
          success();
        });
      }
    });
  }

  function sendToApiAi(sender, message, requestId){
    let urlParams = {
      v: "20150910",
      query: message,
      lang: 'en',
      timezone: "America/Los_Angeles"
    };

    redisClient.get("session:" + sender, function (err, sessionId) {
      if (sessionId) {
        console.log("[" + sender + "][" + requestId + "][SESSION] Session found to be " + sessionId);
        urlParams["sessionId"] = sessionId;
      } else {
        urlParams["sessionId"] = uuid.v1();
        console.log("[" + sender + "][" + requestId + "][SESSION] Generated new session " + urlParams["sessionId"]);
      }

      var options = {
        url: 'https://api.api.ai/api/query?' + querystring.stringify(urlParams),
        headers: {
          'Authorization': 'Bearer f0c35775b7ef487c9fee9f2e80ddb89c'
        }
      };

      let currentSender = sender;
      function callback(error, response, body) {
        if (error) {
            rollbar.handleError(error);
        }

        if (!error && response.statusCode == 200) {
          var data = JSON.parse(body);

          handleSessionId(currentSender, data).then(function() {
            if (data.result.source == 'domains' || data.result.metadata.intentName.split('_')[0] == 'faq') {
                console.log("[" + sender + "][" + requestId + "][AI] Domain based chat");
                sendTextMessage(sender, data.result.fulfillment.speech);
            }
            else if (!data.result.actionIncomplete){
              var res = "Action: " + data.result.action;
              if (data.result.parameters) {
                  res += ". Params: " + JSON.stringify(data.result.parameters);
              }
              console.log("[" + sender + "][" + requestId + "][AI] Action Complete! " + res);
              redisClient.multi([
                  ["del", 'last_message:' + sender],
              ]).exec(function(err, replies) {
                  processRequest(sender, data);
              });
            }
            else {

                // If previous phrase is == earlyest, stop
                redisClient.get('last_message:' + sender, function(err, res) {
                    if (res == data.result.fulfillment.speech) {
                        // Start again from scratch
                        console.log("[" + sender + "][" + requestId + "][SESSION] Same response twice, restart");
                        redisClient.multi([
                            ["del", "session:" + sender],
                            ["del", 'last_message:' + sender],
                        ]).exec(function(err, replies) {
                            return handleRequest(sender, "help", requestId);
                        });
                    } else {
                        redisClient.setex('last_message:' + sender, 5 * 60, data.result.fulfillment.speech, function(err, res) {
                            console.log("[" + sender + "][" + requestId + "][AI] Action Incomplete: " + data.result.fulfillment.speech);
                            sendTextMessage(sender, data.result.fulfillment.speech);
                            rollbar.reportMessageWithPayloadData("Imcomplete action", {
                                level: "info",
                                custom: {
                                    query: data.result.resolvedQuery,
                                    answer: data.result.fulfillment.speech,
                                    sender: currentSender
                                }
                            });
                        });
                    }
                });

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
    if (id == 404){
        sendTextMessage(sender, 'Sorry about that!');
    }
    else {
        sendTextMessage(sender, bands.band[id].name + ' is playing at ' + bands.band[id].stage);
    }
    return true;
}

function get_permitted(sender, item){
  sendTextMessage(sender, allowed.allowed[item].message);
  return true;
}

function get_settime(sender, id) {
    if (id == 404){
        sendTextMessage(sender, 'Whoops! I must have misunderstood.');
    }
    else {
        sendTextMessage(sender, bands.band[id].name + ' is playing from ' + bands.band[id].start_time +' to '+ bands.band[id].end_time + ' on ' + bands.band[id].day);
    }
    return true;
}

function get_food_type(sender, type){
    if (type == 404){
        sendTextMessage(sender, 'I must be the one who\'s hungry. My bad.');
    }
    else {
        showMeFood(sender, foodTypes[type]);
    }
    return true;
}
function get_bandinfo(sender, id){
  if (id == 404){
    sendTextMessage(sender, 'Whoops! I must have misunderstood.');
  }
  else {
    sendBandCard(sender, id);
  }
  return true;
}

function greet(sender){
  sendTextMessage(sender, "Hello! I am Ranger Dave Bot. I know anything and everything about Outside Lands. Ask me about your favorite artist, what kind of food you want to eat, or even the weather!")
}

function get_lineup(sender){
  sendTextMessage(sender, "Here\'s the Outside Lands lineup!");
  sendLineup(sender);
}

function sendHelp(sender) {
  var questions = 
  [
    {
      "type":"postback",
      "title": "I want Mexican food.",
      "payload": "I want Mexican food."
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
    },
    {
      "type":"postback",
      "title": "Who is similar to Radiohead?",
      "payload": "Who is similar to Radiohead?"
    },
    {
      "type":"postback",
      "title": "Who conflicts with Wet?",
      "payload": "Who conflicts with Wet?"
    },
    {
      "type":"postback",
      "title": "What is the weather",
      "payload": "What is the weather"
    }

  ]
  let messageData =
  {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text": "Here are some things you can ask me!",
        "buttons": shuffle(questions).slice(0,3)
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
        rollbar.handleError(error);
    } else if (response.body.error) {
        rollbar.reportMessageWithPayloadData("Facebook gave an error", {
            level: "error",
            custom: response.body
        });
    }
  });
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
        rollbar.handleError(error);
    } else if (response.body.error) {
        rollbar.reportMessageWithPayloadData("Facebook gave an error", {
            level: "error",
            custom: response.body
        });
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
          rollbar.handleError(error);
      } else if (response.body.error) {
          rollbar.reportMessageWithPayloadData("Facebook gave an error", {
              level: "error",
              custom: response.body
          });
      }
  });
}




function showMeFood(sender,list) {
  let elements = [];
  var rand = randFood(list);
  for (var i = 0; i < list.length && i < 10; i++){
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
    });
  }

  let messageData = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements": elements
      }
    }
  };
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
        rollbar.handleError(error);
    } else if (response.body.error) {
        rollbar.reportMessageWithPayloadData("Facebook gave an error", {
            level: "error",
            custom: response.body
        });
    }
  });
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
  };
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
          rollbar.handleError(error);
      } else if (response.body.error) {
          rollbar.reportMessageWithPayloadData("Facebook gave an error", {
              level: "error",
              custom: response.body
          });
      }
  });
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
  sendToApiAi(senderID, payload);
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

'use strict'

const querystring = require('querystring')
const express = require('express')
const bodyParser = require('body-parser')
const moment = require('moment-timezone')
const request = require('request')
const rater = require('./rater.js');
const uuid = require('node-uuid');
var redis = require('redis');
var foods = require('./food.json')
var bands = require('./bands.json')
var sendTextMessage = require('./messaging.js').sendTextMessage;
var sendLineup = require('./lineup.js').sendLineup;
var sendDirections = require('./maps.js').sendDirections;
var preprocessFoodTypes = require('./getfood.js').preprocessFoodTypes;
var showMeFood = require('./getfood.js').showMeFood;

const app = express()
const redisClient = redis.createClient(process.env.REDIS_URL);
const token = "EAAO4Pbcmmj0BAF92LgbfehLojrlthke5Wv2J53g96YsFlNpf9HhlrCETKxJfCG4IHS8TxQHbFdHhF6YG9DNlYfuMFELQvUgUxle9RCSF8uvKvhwl9d6sKZBmF4PARA9j9GiHUQtwZC2zVi86fD8ZCoENAGY53ar7DcLKhHxagZDZD";

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id
		if (event.message && event.message.text) {
		    let text = event.message.text
                    processMessage(sender, text);
                }
        }
        res.sendStatus(200)
});

app.post('/personal/', function (req, res) {
    processMessage(req.body.uid, req.body.body);
    res.sendStatus(200);
});

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})

function processMessage(facebookUid, text) {
    //var food_key = ['hungry',' eat','lunch','dinner','more options'];
    var weather_key = ['weather','sunny','umbrella','temperature','forecast'];
    var band_key = [];
    for (var j = 0; j < bands.band.length; j++ ){
        band_key.push(bands.band[j].name);
    }
    var isBand = checkIfContained(text,band_key);
    //var isHungry = checkIfContained(text,food_key);
    var isWeather = checkIfContained(text,weather_key);
    var band_id = checkBand(text,band_key);
    // if (isHungry) {
    //     sendTextMessage(facebookUid, 'Here are some options!');
    //     sendFoodCards(facebookUid, randFood(),randFood(),randFood())
    //     return;
    // }
    if (isWeather) {
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
    else {
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
                    if (!data.result.actionIncomplete){
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
  switch(func){
    case 'get_directions':
      get_directions(sender,body);
      break;
    case 'get_rating':
      rater.process_rating(sender, body)
      break;
    case 'playing_at_time':
      let params = body.result.parameters;

      // if no date, assume it's today
      var date;
      if (params.date) {
         date = moment(params.date);
      } else {
         date = moment();
      }

      // get time and bump to 12 hr if necessary
      let timeItems = params.time.split(':').map(function(e) { return parseInt(e);} );
      if (timeItems[0] < 12) {
          timeItems[0] += 12;
      }
      date.hour(timeItems[0]);
      date.minutes(timeItems[1]);
      date.seconds(0);

      // Process response
      var msg = "Here is the line up you requested:\n";
      rater.get_artist_at_time(date).forEach(function(idx) {
        var bandItem = bands.band[idx];
        msg += bandItem.name + " starts at " + bandItem.start_time + " on " + bandItem.day + "\n";
      });
      sendTextMessage(sender, rater.get_artist_at_time(date));
      break;
    case 'get_hotness_at_epoch':
      var date = moment()
      date = date.add(14, 'days').subtract(2, 'hours');
      rater.get_hotness_at_epoch(date, 3).then(function(results) {
        if (results.length == 0) {
            sendTextMessage(sender, 'Nothing seems to be popping right now. You should rate artists as you\'re seeing them!')
        } else {
          let msg = "Here are the following artists in order:\n";
          results.forEach(function(result) {
            msg += result + "\n";
          });
          sendTextMessage(sender, msg);
        }
      });
      break;
    case 'get_stage':
      var id = body.result.parameters.bands;
      get_stage(sender,id)
      break;
    case 'get_settime':
      var id = body.result.parameters.bands;
      get_settime(sender,id)
      break;
    case 'get_food_type':
      var type = body.result.parameters.food_type
      console.log("hello," + type)
      get_food_type(sender, type)
      console.log(type)
      break;
    case 'get_bandinfo':
      var id = body.result.parameters.bands;
      get_bandinfo(sender,id)
      break;
    case 'greet':
      greet(sender)
      break;
    case 'get_lineup':
      get_lineup(sender)
      break;
    default:
      sendTextMessage(sender, 'Hmm. I\'m having some trouble getting you that information. Make sure you spelled the band or artist name correctly and try again!');
    }
}

function get_directions(sender, body) {
  var band_id = body.result.parameters.bands;
  var stage_id = body.result.parameters.stages;
  // they did give stage and maybe band
  if(stage_id != ""){
    sendDirections(sender,"",stage_id);
  }
  // they forsure gave us band only
  else if(band_id != "") {
    sendDirections(sender, band_id, bands.band[band_id].stageId);
  }
  else{
    sendTextMessage(sender, 'I\'m a little bit confused about who you want to see');
  }
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
  console.log("reached1")
  console.log(type)
  if(foodtype_map[type] instanceof Array){
    console.log("hello")
  }
  //console.log(foodtype_map[type])
  showMeFood(foodtype_map[type])
  console.log("reached2")
}
function get_bandinfo(sender, id){
  sendBandCard(sender, id);
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

function checkBand(text,key){
  var contained = false;
  var band = -1;
    for (var j = 0; j < key.length && !contained; j++){
        contained = contained || (text.toUpperCase().indexOf(key[j].toUpperCase()) > -1);
        if (contained){
          band= j;
        }
      }
  return band;
}

function randFood(){
	return Math.floor(Math.random() * (77));
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

function sendFoodCards(sender,rf1,rf2,rf3) {
	var title = 'Check it Out!'

	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"title": foods.food[rf1].name,
					"subtitle": foods.food[rf1].description,
					"image_url": foods.food[rf1].img,
					"buttons": [{
						"type": "web_url",
						"url": foods.food[rf1].url,
						"title": title
					}],
				},
				{
					"title": foods.food[rf2].name,
					"subtitle": foods.food[rf2].description,
					"image_url": foods.food[rf2].img,
					"buttons": [{
						"type": "web_url",
						"url": foods.food[rf2].url,
						"title": title
					}],
				},
				{
					"title": foods.food[rf3].name,
					"subtitle": foods.food[rf3].description,
					"image_url": foods.food[rf3].img,
					"buttons": [{
						"type": "web_url",
						"url": foods.food[rf3].url,
						"title": title
					}],
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

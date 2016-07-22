'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
//var redis = require('redis');
var foods = require('./food.json')
var bands = require('./bands.json')
const app = express()

//this._db = redis.createClient(); 

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

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id
		if (event.message && event.message.text) {
			let text = event.message.text
			var food_key = ['hungry',' eat','lunch','dinner','more'];
      var weather_key = ['weather','sunny','umbrella','temperature','forecast'];
      var band_key = [];
      for (var j = 0; j < bands.band.length; j++ ){
        band_key.push(bands.band[j].name);
      }
      var isBand = checkIfContained(text,band_key);
      var isHungry = checkIfContained(text,food_key);
      var isWeather = checkIfContained(text,weather_key);
      var band_id = checkBand(text,band_key);
			if (isHungry) {
				sendTextMessage(sender, 'Here are some options!')
				sendFoodCards(sender,randFood(),randFood(),randFood())
				continue
			}
      else if (isWeather) {
        var weatherEndpoint = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22' + 'Golden Gate Park' + '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
        request({
          url: weatherEndpoint,
          json: true
        }, function(error, response, body) {
          try {
            var condition = body.query.results.channel.item.condition;
            sendWeatherCard(sender, condition.temp,condition.text,'Outside Lands in Golden Gate Park');
          } catch(err) {
            console.error('error caught', err);
            sendTextMessage(sender, "There was an error.");
          }
        });
      }
      else {
        sendToApiAi(sender,text,band_id);
      }
    }
  }
  res.sendStatus(200)
})

function sendToApiAi(sender, message,id){
  var options = {
    url: 'https://api.api.ai/api/query?v=20150910&query=' + message + '&lang=en&sessionId=fac22b98-a8e8-4457-a45a-55aac20aa286&timezone=Ameria/Los_Angeles',
    headers: {
      'Authorization': 'Bearer f0c35775b7ef487c9fee9f2e80ddb89c'
    }
  }
  function callback(error, response, body) {
  if (error){
    console.log(error);
  }
  else if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    var bandID = info.result.parameters.bands;
    var command = info.result.metadata.intentName;
    if (!info.result.actionIncomplete){
      processRequest(sender, info.result.action, bandID);
    }
    else {
      sendTextMessage(sender, info.result.fulfillment.speech);
    }
    }
  }

  request(options, callback);
}

function processRequest(sender, func, id){
  switch(func){
    case 'get_stage':
      get_stage(sender,id)
      break;
    case 'get_settime':
      get_settime(sender,id)
      break;
    case 'get_bandinfo':
      get_bandinfo(sender,id)
      break;
    default:
      sendTextMessage(sender, 'Hmm. I\'m having some trouble getting you that information. Make sure you spelled the band or artist name correctly and try again!');
    }
}

function get_stage(sender, id) {
  sendTextMessage(sender, bands.band[id].name + ' is playing at ' + bands.band[id].stage);
  return true;
}

function get_settime(sender, id) {
  sendTextMessage(sender, bands.band[id].name + ' is playing from ' + bands.band[id].start_time +' to '+ bands.band[id].end_time + ' on ' + bands.band[id].day);
  return true;
}

function get_bandinfo(sender, id){
  sendBandCard(sender, id);
  return true;
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

const token = "EAAO4Pbcmmj0BAF92LgbfehLojrlthke5Wv2J53g96YsFlNpf9HhlrCETKxJfCG4IHS8TxQHbFdHhF6YG9DNlYfuMFELQvUgUxle9RCSF8uvKvhwl9d6sKZBmF4PARA9j9GiHUQtwZC2zVi86fD8ZCoENAGY53ar7DcLKhHxagZDZD";

function sendTextMessage(sender, text) {
	let messageData = { text:text }
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
          "subtitle": bands.band[id].stage + ', ' + bands.band[id].day + '<br>' + bands.band[id].time,
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
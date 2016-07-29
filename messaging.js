'use strict'

var querystring = require('querystring')
var request = require('request')
var bands = require('./bands.json')

const token = "EAAO4Pbcmmj0BALB6dbkRSM6dXO30iFWTANp1DP4dW3U5z0uwoMFsuvVZCOi6aTXMMwckQqVwo3Te0xskc6VyOsuVDaPAAO32NHJ8sLO7jZBs4NNlgZA8e6LmTiqxHISdYyOBVCKoCTNjNoaC4hs9FbJsWk7gYCemuFOtASh8QZDZD";

function randFood(array){
  return Math.floor(Math.random() * (array.length));
}

function sendTextMessage(sender, text) {
    console.log(sender + ": " + text);
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
            if (!error) {
                console.log(sender + ": " + text);
            }
	})
}

function sendSingleScore(sender,id,rating){
  let msg = '';
  for (var i = 0; i <= ((rating/5)*8); i++){
    msg += '\u{1F525}'
  }
   let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements":[{
          "title": bands.band[id].name + ' at ' + bands.band[id].stage + ' from '+ bands.band[id].start_time + ' to ' + bands.band[id].end_time,
          "subtitle": '('+Math.round(rating*20)/10+') '+ msg,
          "image_url": bands.band[id].img,
          "buttons":[{
            "type": 'postback',
            "title": 'Take me there!',
            "payload": 'Take me to ' + bands.band[id].name + ' at ' + bands.band[id].stage
          },
          {
            "type": 'postback',
            "title": 'Send a rating',
            "payload": 'I want to rate ' + bands.band[id].name
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

function sendPlayingAtTimeCards(sender,playing) {
  let elements = [];
  var rand = randFood(playing)
  for (var i = 0; i < playing.length && i < 10; i++){
    elements.push(
    {
      "title": bands.band[playing[(i+rand)%playing.length]].name,
      "image_url": bands.band[playing[(i+rand)%playing.length]].img,
      "subtitle": bands.band[playing[(i+rand)%playing.length]].start_time + ' - ' + bands.band[playing[(i+rand)%playing.length]].end_time + ' at ' + bands.band[playing[(i+rand)%playing.length]].stage,
      "buttons" : [
      	  {
            "type": "web_url",
            "url": bands.band[playing[(i+rand)%playing.length]].url,
            "title": 'Add to Schedule'
          }
      ]
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

module.exports = {
	sendTextMessage: sendTextMessage,
        sendPlayingAtTimeCards: sendPlayingAtTimeCards,
        sendSingleScore: sendSingleScore,
        randFood: randFood
}

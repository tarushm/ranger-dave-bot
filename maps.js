'use strict'

const request = require('request');
var bands = require('./bands.json')
var directions = require('./directions.json')

const token = "EAAO4Pbcmmj0BALB6dbkRSM6dXO30iFWTANp1DP4dW3U5z0uwoMFsuvVZCOi6aTXMMwckQqVwo3Te0xskc6VyOsuVDaPAAO32NHJ8sLO7jZBs4NNlgZA8e6LmTiqxHISdYyOBVCKoCTNjNoaC4hs9FbJsWk7gYCemuFOtASh8QZDZD";

function sendDirections(sender,bandID,stageID){
  var destination;
  if (bandID === ''){
    destination = directions.directions[stageID].stage;
  }
  else {
    destination = bands.band[bandID].name;
  }
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements":[{
          "title": 'Here\'s how to get to ' + destination,
          "image_url": 'http://cdn2.sfoutsidelands.com/content-files/images/MobileMap12000x12000_img.jpg',
          "buttons":[{
            "type": "web_url",
            "url": directions.directions[stageID].url,
            "title": 'Take me there!'
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

module.exports = {
  sendDirections: sendDirections
}
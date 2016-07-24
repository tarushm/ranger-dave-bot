'use strict'

const request = require('request');
var bands = require('./bands.json')
var directions = require('./directions.json')

const token = "EAAO4Pbcmmj0BAF4PCfFE5YMhpAnp5yVf5dDJYsFBIUfiYW4INJb7OveKZCsBun5bhP7kgvCE2a0HaE2EAPatQwxCKp1DbIgGkoTjBJYlgTc54Yi3QfrofnbG0CdTALB4zhZAvI7I6airf2uikkyENEaSwI1srFWZAZAdAD36QQZDZD";

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
          "image_url": 'http://cdn.funcheap.com/wp-content/uploads/2014/07/www.sfoutsidelands.com-sites-default-files-content-files-files-OL15_PrintableMap-1-.pdf.png',
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
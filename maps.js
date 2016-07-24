'use strict'

const request = require('request');
var bands = require('./bands.json')
var directions = require('./directions.json')

const token = "EAAO4Pbcmmj0BAGZCQ4bJwOpBBJdGfDMOPqdmHHJv0f84Rxcd0ZABB3de00OWITlEbWGDHV4I1Fmiaphws4y8IGya0ECbVPMYbUZBgtUa9yYiOoZAr2cZA6kS3R0WZCjaLBouWtIXuAKi5W7HRvSGKUezSZArIyfWR4fcVZAFcefmiAZDZD";

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
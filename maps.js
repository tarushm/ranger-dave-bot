'use strict'

const request = require('request');
var bands = require('./bands.json')
var directions = require('./directions.json')

const token = "EAAO4Pbcmmj0BAF92LgbfehLojrlthke5Wv2J53g96YsFlNpf9HhlrCETKxJfCG4IHS8TxQHbFdHhF6YG9DNlYfuMFELQvUgUxle9RCSF8uvKvhwl9d6sKZBmF4PARA9j9GiHUQtwZC2zVi86fD8ZCoENAGY53ar7DcLKhHxagZDZD";

function sendDirections(sender,bandID,stageID){
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements":[{
          "title": 'Here\'s how to get to where you want to go!',
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
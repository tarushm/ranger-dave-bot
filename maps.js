'use strict'

const request = require('request');

const token = "EAAO4Pbcmmj0BAF92LgbfehLojrlthke5Wv2J53g96YsFlNpf9HhlrCETKxJfCG4IHS8TxQHbFdHhF6YG9DNlYfuMFELQvUgUxle9RCSF8uvKvhwl9d6sKZBmF4PARA9j9GiHUQtwZC2zVi86fD8ZCoENAGY53ar7DcLKhHxagZDZD";

function sendDirections(sender,bandID,stageID){
  var destination;
  if (bandID == "") {
    destination = directions.directions[stageID].stage;
  }
  else {
    destination = bands.band[bandID].name;
  }
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
          "buttons":[{
            "type": "web_url",
            "url": directions.directions[stageID].url,
            "title": 'Take me there!'
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
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

module.exports = {
  sendDirections: sendDirections
}
'use strict'

const request = require('request');
const token = "EAAO4Pbcmmj0BALB6dbkRSM6dXO30iFWTANp1DP4dW3U5z0uwoMFsuvVZCOi6aTXMMwckQqVwo3Te0xskc6VyOsuVDaPAAO32NHJ8sLO7jZBs4NNlgZA8e6LmTiqxHISdYyOBVCKoCTNjNoaC4hs9FbJsWk7gYCemuFOtASh8QZDZD";
const rollbar = require('rollbar');

rollbar.init("b8e7299b830a4f5b86c6859e887cfc65");

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
  });
}

module.exports = {
	sendLineup: sendLineup
}

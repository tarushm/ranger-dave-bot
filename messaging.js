'use strict'

const request = require('request');

const token = "EAAO4Pbcmmj0BALB6dbkRSM6dXO30iFWTANp1DP4dW3U5z0uwoMFsuvVZCOi6aTXMMwckQqVwo3Te0xskc6VyOsuVDaPAAO32NHJ8sLO7jZBs4NNlgZA8e6LmTiqxHISdYyOBVCKoCTNjNoaC4hs9FbJsWk7gYCemuFOtASh8QZDZD";

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
		//if (error) {
			//console.log('Error sending messages: ', error)
		//} else if (response.body.error) {
			//console.log('Error: ', response.body.error)
		//}
	})
}

module.exports = {
	sendTextMessage: sendTextMessage
}

'use strict'

const request = require('request');

const token = "EAAO4Pbcmmj0BAGZCQ4bJwOpBBJdGfDMOPqdmHHJv0f84Rxcd0ZABB3de00OWITlEbWGDHV4I1Fmiaphws4y8IGya0ECbVPMYbUZBgtUa9yYiOoZAr2cZA6kS3R0WZCjaLBouWtIXuAKi5W7HRvSGKUezSZArIyfWR4fcVZAFcefmiAZDZD";

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

'use strict'

const request = require('request');

const token = "EAAO4Pbcmmj0BAHbPvx0UyBysuieOwcAWfZBdH4G8bgQ1QdWwZCme0bFYz7LeOQgZAZBmqWfLU6H8sDWfweEJ1xsmvC9mDJR22Vrl1BiuuEZBq9jR1NWMxt7ygymETzMrQdGgZBb0pTAz56MFQMr1TDkBUd8VIixIgB1yz6s7CTPwZDZD";

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

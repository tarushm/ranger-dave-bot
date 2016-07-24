'use strict'

const request = require('request');

const token = "EAAO4Pbcmmj0BAF4PCfFE5YMhpAnp5yVf5dDJYsFBIUfiYW4INJb7OveKZCsBun5bhP7kgvCE2a0HaE2EAPatQwxCKp1DbIgGkoTjBJYlgTc54Yi3QfrofnbG0CdTALB4zhZAvI7I6airf2uikkyENEaSwI1srFWZAZAdAD36QQZDZD";

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

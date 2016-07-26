'use strict'

const request = require('request');

const token = "EAAO4Pbcmmj0BAP7cbXDDQJHlTPbXhu7F0BsuUFZBzOBeBApcpwrj147xQQ4BFdC9MAdkqmOgAVST21IyFMtWUXio7fzL48vOPkJ8ob744OOAhKyviKCQUgP7ljbAELiKblgZAGY0qQnVWeXPkfbRFfgLZCIkQ9AUmrep0S58wZDZD";

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

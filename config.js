'use strict';

const WIT_TOKEN = 'LUKXMZ2XPSJAW6556VIOLLEDLJR7QGBN'
if (!WIT_TOKEN) {
  throw new Error('Missing WIT_TOKEN. Go to https://wit.ai/docs/quickstart to get one.')
}


var FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || 'EAAO4Pbcmmj0BADAUL9B3j8jmH87djiMeh2ysLSLrHhIFDFBC7vm4SbfB2vMtzasSFdkkxNjcjuryNktf50GPdit48SVFlchYdlbsB7vNjDIKATFy6djHMdlZBfyc68CVzFnH34AZCbLmD1p9jmr6aBEUeSPeG6vdJKkNUxlAZDZD';
if (!FB_PAGE_TOKEN) {
	throw new Error('Missing FB_PAGE_TOKEN. Go to https://developers.facebook.com/docs/pages/access-tokens to get one.')
}

var FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'my_voice_is_my_password_verify_me'

module.exports = {
  WIT_TOKEN: WIT_TOKEN,
  FB_PAGE_TOKEN: FB_PAGE_TOKEN,
  FB_VERIFY_TOKEN: FB_VERIFY_TOKEN,
}
'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
//var redis = require('redis');
const app = express()

//this._db = redis.createClient(); 

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id
		if (event.message && event.message.text) {
			let text = event.message.text
			var food_key = ['hungry',' eat','lunch','dinner','more'];
      var weather_key = ['weather','sunny','umbrella','temperature','forecast'];
			var isHungry = false;
			for (var j = 0; j < food_key.length; j++){
				isHungry = isHungry || (text.toUpperCase().indexOf(food_key[j].toUpperCase()) > -1);
			}
      for (var j = 0; j < weather_key.length; j++){
        isWeather = isWeather || (text.toUpperCase().indexOf(weather_key[j].toUpperCase()) > -1);
      }
			if (isHungry) {
				sendTextMessage(sender, 'Here are some options!')
				sendFoodCards(sender,randFood(),randFood(),randFood())
				continue
			}
      else if (isWeather) {
        var weatherEndpoint = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22' + 'Golden Gate Park' + '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
        request({
          url: weatherEndpoint,
          json: true
        }, function(error, response, body) {
          try {
            var condition = body.query.results.channel.item.condition;
            sendWeatherCard(sender, condition.temp,condition.text,'Outside Lands in Golden Gate Park');
          } catch(err) {
            console.error('error caught', err);
            sendTextMessage(sender, "There was an error.");
          }
        });
      }
      else {
        sendTextMessage(sender, 'I don\'t seem to understand! I\'m still learning. You can ask me about the weather, or let me know if you are hungry!');
      }

    }
  }
  res.sendStatus(200)
})


function randFood(){
	return Math.floor(Math.random() * (77));
}

const token = "EAAO4Pbcmmj0BAF92LgbfehLojrlthke5Wv2J53g96YsFlNpf9HhlrCETKxJfCG4IHS8TxQHbFdHhF6YG9DNlYfuMFELQvUgUxle9RCSF8uvKvhwl9d6sKZBmF4PARA9j9GiHUQtwZC2zVi86fD8ZCoENAGY53ar7DcLKhHxagZDZD";

function sendTextMessage(sender, text) {
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
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function getUserInfo(sender){
	request({
		url: 'https'
	})
}

function sendWeatherCard(sender,temp,text,loc){
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements":[{
          "title": temp + '\xB0 and ' + text,
          "subtitle": loc,
          "buttons":[{
            "type": "web_url",
            "url": 'https://www.yahoo.com/news/weather/united-states/san-francisco/san-francisco-23679437',
            "title": 'Expand forecast.'
          }]
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

function sendFoodCards(sender,rf1,rf2,rf3) {
	var title = 'Check it Out!'
	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"title": foods.food[rf1].name,
					"subtitle": foods.food[rf1].description,
					"image_url": foods.food[rf1].img,
					"buttons": [{
						"type": "web_url",
						"url": foods.food[rf1].url,
						"title": title
					}],
				},
				{
					"title": foods.food[rf2].name,
					"subtitle": foods.food[rf2].description,
					"image_url": foods.food[rf2].img,
					"buttons": [{
						"type": "web_url",
						"url": foods.food[rf2].url,
						"title": title
					}],
				},
				{
					"title": foods.food[rf3].name,
					"subtitle": foods.food[rf3].description,
					"image_url": foods.food[rf3].img,
					"buttons": [{
						"type": "web_url",
						"url": foods.food[rf3].url,
						"title": title
					}],
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
var foods = 
{
 "food": [
 {
   "name": "4505 Meats",
   "url": "http://lineup.sfoutsidelands.com/band/4505-meats",
   "description": "Best Damn Cheeseburgers, Spicy Chimichurri Fries",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69507/custom9b7fe457c0f0602a50c7046626504924.jpg"
 },
 {
   "name": "Alicia's Tamales Los Mayas",
   "url": "http://lineup.sfoutsidelands.com/band/alicias-tamales-los-mayas",
   "description": "Tamales, Elote",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69509/custom4893f43e6920fbec4d06a896f02ec17b.jpg"
 },
 {
   "name": "Azalina's",
   "url": "http://lineup.sfoutsidelands.com/band/azalinas",
   "description": "Malaysian Peanut Tofu Braised Nachos",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69513/custom7015853e7ace6f5c6dac150514202ad0.jpg"
 },
 {
   "name": "Beast and the Hare",
   "url": "http://lineup.sfoutsidelands.com/band/beast-and-the-hare",
   "description": "Loaded Baked Potatoes",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69517/custom008a5b739c689dd1b121e56f3da29e0b.jpg"
 },
 {
   "name": "Belcampo Meat Co.",
   "url": "http://lineup.sfoutsidelands.com/band/belcampo-meat-co",
   "description": "Fastburgers, Grass-Fed Beef Hot Dogs",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69957/customf2443ca9d41a4f549648ed35a3a39dc6.jpg"
 },
 {
   "name": "Big Chef Tom's\nBelly Burgers",
   "url": "http://lineup.sfoutsidelands.com/band/big-chef-toms-belly-burgers",
   "description": "Pork Belly Burgers",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69521/custom0bcb741c1bde5a3596615ed54eb807e5.jpg"
 },
 {
   "name": "Bini's Kitchen",
   "url": "http://lineup.sfoutsidelands.com/band/binis-kitchen",
   "description": "Turkey Momos, Nepalese Veggie Dumplings",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69523/customf39a09a0cf4e4b3a218c6213530b8d8a.jpg"
 },
 {
   "name": "Charles Chocolates",
   "url": "http://lineup.sfoutsidelands.com/band/charles-chocolates",
   "description": "Frozen Hot Chocolate, S'mores",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69689/custom08af232373f259978fefd261f52cc60a.jpg"
 },
 {
   "name": "Delessio Market & Bakery",
   "url": "http://lineup.sfoutsidelands.com/band/delessio-market-and-bakery",
   "description": "Thai Chicken Sandwiches, Rabanada",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69533/customfe331f47103d585757c6e30b1f2bd3c9.jpg"
 },
 {
   "name": "Earthly Delights",
   "url": "http://lineup.sfoutsidelands.com/band/earthly-delights",
   "description": "Philly Cheesesteaks, Garlic Fries",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69535/custom58da11f7b14f02550e703cd0feeffac6.jpg"
 },
 {
   "name": "El Huarache Loco",
   "url": "http://lineup.sfoutsidelands.com/band/el-huarache-loco",
   "description": "Huaraches, Chilaquiles",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69537/custom0b0c96e886d063209fe043e4efd85842.jpg"
 },
 {
   "name": "Endless Summer Sweets",
   "url": "http://lineup.sfoutsidelands.com/band/endless-summer-sweets",
   "description": "Gourmet Funnel Cakes, Corn Dogs",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69539/custom9c410a854ebff8c9fb2afc78e97bbef4.jpg"
 },
 {
   "name": "Escape From New York Pizza",
   "url": "http://lineup.sfoutsidelands.com/band/escape-from-new-york-pizza",
   "description": "Pesto, Potato and Roasted Garlic Pizza Slices",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69543/custom380a54565d1e1a30c045775771d18ef3.jpg"
 },
 {
   "name": "Fine & Rare",
   "url": "http://lineup.sfoutsidelands.com/band/fine-and-rare",
   "description": "Crab Rolls, Old Bay Chips",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69547/customc48575ba4ec1345810ac9d39382386dd.jpg"
 },
 {
   "name": "FK Frozen Custard Bars",
   "url": "http://lineup.sfoutsidelands.com/band/fk-frozen-custard-bars",
   "description": "Frozen Custard Bars",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/70990/custom3a1c522697d045f03510b925b72ab26e.jpg"
 },
 {
   "name": "Four Barrel Coffee",
   "url": "http://lineup.sfoutsidelands.com/band/four-brand-coffee",
   "description": "Nitro Cold Brew Coffee",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69663/custom50b56e480eb9e7e1a0f79ef5f1cd7879.jpg"
 },
 {
   "name": "Freshroll Vietnamese Rolls &\nBowls",
   "url": "http://lineup.sfoutsidelands.com/band/freshroll-vietnamese-rolls-and-bowls",
   "description": "Banh Mis, Taro Chips",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69549/customdbac7a8add3078856df225c967d85ed1.jpg"
 },
 {
   "name": "Glaze Teriyaki",
   "url": "http://lineup.sfoutsidelands.com/band/glaze-teriyaki",
   "description": "Salmon, Steak & Chicken Teriyaki, Spicy Yaki Wings",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69551/custom3f0fbcd5b4b5ab9a5ba8cc23a2b2b117.jpg"
 },
 {
   "name": "Il Cane Rosso",
   "url": "http://lineup.sfoutsidelands.com/band/il-cane-rosso",
   "description": "Olive Oil Fried Egg Sandwiches, Griddled French Toast with Maple Caramel",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/70160/custom64ef4117ee5a49594e8de842a8ca0982.jpg"
 },
 {
   "name": "Itani Ramen",
   "url": "http://lineup.sfoutsidelands.com/band/itani-ramen",
   "description": "Pork Gyoza, Vegetarian Ramen, Chicken Ramen",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69561/custom4ccd5a5b634b106dcdd537a0eeb4a887.jpg"
 },
 {
   "name": "Koja Kitchen",
   "url": "http://lineup.sfoutsidelands.com/band/koja-kitchen",
   "description": "Korean BBQ Tacos",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69563/custom97298f16240682d0240b327d4c3a3271.jpg"
 },
 {
   "name": "La Urbana",
   "url": "http://lineup.sfoutsidelands.com/band/la-urbana",
   "description": "Chorizo Bacon Dogs, Esquites",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69565/customd849fc0987f6f9ddcd0b13dcb0c4102c.jpg"
 },
 {
   "name": "Little Skillet",
   "url": "http://lineup.sfoutsidelands.com/band/little-skillet",
   "description": "Fried Chicken & Waffles, Watermelon, Red Velvet Cupcakes",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69567/custom2aba7f1cb669680dd0400e08c34e6800.jpg"
 },
 {
   "name": "Loving Cup",
   "url": "http://lineup.sfoutsidelands.com/band/loving-cup",
   "description": "Coffee, Ice Cream Sandwiches",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69591/custom1948c2e3f7d10dadaf18f6072aba4c68.jpg"
 },
 {
   "name": "Lucca Foods",
   "url": "http://lineup.sfoutsidelands.com/band/lucca-foods",
   "description": "BBQ Pulled Pork Sandwiches, Rice Krispy Treats",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69593/customb9ed3b96036c13c224af0629c0350dfd.jpg"
 },
 {
   "name": "Merigan Sub Shop",
   "url": "http://lineup.sfoutsidelands.com/band/merigan-sub-shop",
   "description": "Mozzarella Sticks, Italian Ice",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69589/custom3b45161159337cf2026663d2124c64a2.jpg"
 },
 {
   "name": "Namu Street Food",
   "url": "http://lineup.sfoutsidelands.com/band/namu-street-food",
   "description": "Korean Fried Chicken",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69661/custombb75457b78c4f199dcba4c5f76cec92d.jpg"
 },
 {
   "name": "Nombe",
   "url": "http://lineup.sfoutsidelands.com/band/nombe",
   "description": "Ramenburgers, Sushi Burritos",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69579/custom94d7109b50fbf0363ec0bdb84271b00f.jpg"
 },
 {
   "name": "Pacific Catch",
   "url": "http://lineup.sfoutsidelands.com/band/pacific-catch",
   "description": "Hawaiian Ahi Poke, Fish & Chips, Sweet Potato Fries",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69701/custom933a5731b1a70e37b1172ff5110484fd.jpg"
 },
 {
   "name": "Pica Pica Arepa Kitchen",
   "url": "http://lineup.sfoutsidelands.com/band/pica-pica-arepa-kitchen",
   "description": "Arepas, Yuca Fries, Sweet Plantains",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69595/customc77b7b60d0a862dc0862ce57d71a486b.jpg"
 },
 {
   "name": "Precita Park Cafe",
   "url": "http://lineup.sfoutsidelands.com/band/precita-park-cafe",
   "description": "Bacon Egg and Cheese Fries, Equator Coffee",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69581/custom038d6d5e725ad4e6c0846e619014cc28.jpg"
 },
 {
   "name": "Proposition Chicken",
   "url": "http://lineup.sfoutsidelands.com/band/proposition-chicken",
   "description": "Fried Chicken Sandwiches with Spicy Slaw",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69583/custom6b1d164c3f9babc99cbe85917704c674.jpg"
 },
 {
   "name": "Rich Table",
   "url": "http://lineup.sfoutsidelands.com/band/rich-table",
   "description": "Porcini Doughnuts with Raclette Cheese",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69585/custom610184b710e1d6929ca058c3955a9686.jpg"
 },
 {
   "name": "Rosamunde Sausage Grill",
   "url": "http://lineup.sfoutsidelands.com/band/rosamunde-sausage-grill",
   "description": "Grilled Sausages, Brats, Poutine",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69597/custom4bb17135abe15580e9b4d527f2628703.jpg"
 },
 {
   "name": "Rove Kitchen",
   "url": "http://lineup.sfoutsidelands.com/band/rove-kitchen",
   "description": "Fried Chicken Skin Sandwiches, House Pickled Veggies",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69599/custome8acf5b20f7347eb21eeab83d93052fa.jpg"
 },
 {
   "name": "Sababa",
   "url": "http://lineup.sfoutsidelands.com/band/sababa",
   "description": "Falafel Sandwiches and Plates",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69691/customf060e64d1298fa055aca905a1dfb07d5.jpg"
 },
 {
   "name": "Sabores Del Sur",
   "url": "http://lineup.sfoutsidelands.com/band/sabores-del-sur",
   "description": "Empanadas, Alfajores",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69603/customceb8dd329c861c6b2745ace7463812bc.jpg"
 },
 {
   "name": "Sataysfied",
   "url": "http://lineup.sfoutsidelands.com/band/sataysfied",
   "description": "Chicken Satays, Mie Tek Tek (Indonesian Fried Noodles)",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69605/custom454e224629c2fa23f2ba76be67b8610b.jpg"
 },
 {
   "name": "Southpaw BBQ &\nSouthern Cooking",
   "url": "http://lineup.sfoutsidelands.com/band/southpaw-bbq-and-southern-cooking",
   "description": "Brisket Sandwiches, Pulled Jackfruit Sandwiches",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69613/customd20123c1e553ccb77a4eed84a89605b5.jpg"
 },
 {
   "name": "Smoothie Detour",
   "url": "http://lineup.sfoutsidelands.com/band/smoothie-detour",
   "description": "Fresh Fruit Smoothies",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/70988/customa5b6d150ac3bcb34b6125ea3c34aa70a.jpg"
 },
 {
   "name": "Spicy Pie",
   "url": "http://lineup.sfoutsidelands.com/band/spicy-pie",
   "description": "Giant Pizza Slices, Cookie Pie",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69615/custom0e1cf319855939bc7c6b89fbe5924dde.jpg"
 },
 {
   "name": "Split Pea Seduction",
   "url": "http://lineup.sfoutsidelands.com/band/split-pea-seduction",
   "description": "Country Style Split Pea Soup, Shakable Stone Fruit Salads, Puerto Rican Pork Sandwiches",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69687/custom33185e1e9874d4cfdcfad778263b6785.jpg"
 },
 {
   "name": "Stones Throw",
   "url": "http://lineup.sfoutsidelands.com/band/stones-throw-hvvrvphf",
   "description": "Meatball Sandwiches, Fat Angel Kale Salads",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69621/customf3af9d29d47acf4e8c668067b5a10087.jpg"
 },
 {
   "name": "Straw",
   "url": "http://lineup.sfoutsidelands.com/band/straw",
   "description": "Donut Cheeseburgers, Sweet Potato Tots",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69623/custom9659a954680a010534da9778e6086ad1.jpg"
 },
 {
   "name": "Sugar & Spun",
   "url": "http://lineup.sfoutsidelands.com/band/sugar-and-spun",
   "description": "Cotton Candy Bouquets",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69625/custom12de48726603e4d506b3b1f5a4e70c54.jpg"
 },
 {
   "name": "Suite Foods Waffles",
   "url": "http://lineup.sfoutsidelands.com/band/suite-foods-waffles",
   "description": "Belgian Waffles Stuffed with Whipped Cream",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69627/customa3377624ed3f6dcad4496c5ee44d4b08.jpg"
 },
 {
   "name": "Tacolicious",
   "url": "http://lineup.sfoutsidelands.com/band/tacolicious",
   "description": "Shot-and-a-Beer Braised Chicken Tacos",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69629/custom1b556447ab58955cf465ca2ea950723e.jpg"
 },
 {
   "name": "The American Grilled\nCheese Kitchen",
   "url": "http://lineup.sfoutsidelands.com/band/the-american-grilled-cheese-kitchen",
   "description": "Classic Grilled Cheeses, Smokey Tomato Soup",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69631/customc8860c5a83428dd52f707faf367f006d.jpg"
 },
 {
   "name": "The Farmer's Wife",
   "url": "http://lineup.sfoutsidelands.com/band/the-farmers-wife",
   "description": "Gravenstein Apple & Wildflower Honey Melts",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69659/customd33c34dd097efa8ec4526bb0c5a421ae.jpg"
 },
 {
   "name": "The Japanese Pantry",
   "url": "http://lineup.sfoutsidelands.com/band/the-japanese-pantry",
   "description": "Spicy Tater Tots",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69693/customcc60e6269fe8cf372232c573037de3ac.jpg"
 },
 {
   "name": "The Little Chihuahua",
   "url": "http://lineup.sfoutsidelands.com/band/the-little-chihuahua",
   "description": "Fried Plantain and Black Bean Burritos",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69639/custom58dc0530b140dcde63a0a83b61a9b763.jpg"
 },
 {
   "name": "The Monk's Kettle",
   "url": "http://lineup.sfoutsidelands.com/band/the-monks-kettle",
   "description": "Pretzel Knots with Beer Cheese Sauce",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69641/customc040352f6329c78484a86cab7b3c4f03.jpg"
 },
 {
   "name": "The Up & Under\nPub and Grill",
   "url": "http://lineup.sfoutsidelands.com/band/the-up-and-under-pub-and-grill",
   "description": "Gourmet Waffle Fries",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69645/customc7abf493169415c25308183b99376d28.jpg"
 },
 {
   "name": "Three Babes Bakeshop",
   "url": "http://lineup.sfoutsidelands.com/band/three-babes-bakeshop",
   "description": "Peach Cobblers, Chicken & Dumplings",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69649/custom0700fe94f871940c0560ae7afa9be649.jpg"
 },
 {
   "name": "Three Twins Ice Cream",
   "url": "http://lineup.sfoutsidelands.com/band/three-twins-ice-cream",
   "description": "Assorted Organic Ice Creams, Wafer Ice Cream Sandwiches",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69651/custom95e0277ceeb093e15d92c011c0069a7b.jpg"
 },
 {
   "name": "Trestle",
   "url": "http://lineup.sfoutsidelands.com/band/trestle",
   "description": "Announcing Soon",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69653/customad378eeddfab72e66fb3175fb3fd507f.jpg"
 },
 {
   "name": "Wise Sons Jewish Deli",
   "url": "http://lineup.sfoutsidelands.com/band/wise-sons-jewish-deli",
   "description": "Turkey Clubs, Pastrami Cheese Fries, Bagels & Shmear, Chocolate Bobka",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69655/custom0e53fa335c1edc7ab9349102e5467cfe.jpg"
 },
 {
   "name": "Woodhouse Fish Co.",
   "url": "http://lineup.sfoutsidelands.com/band/woodhouse-fish-co",
   "description": "Lobster Rolls, Clam Chowder, Raw & BBQ Oysters",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69657/custom93bc4e3c9c05c1ac98c63e4f3acab78b.jpg"
 },
 {
   "name": "Bacon Bacon",
   "url": "http://lineup.sfoutsidelands.com/band/bacon-bacon",
   "description": "California BBQ Bacon Burritos, Chocolate Covered Bacon",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69515/custom0e83b64127f274da1c49444834716931.jpg"
 },
 {
   "name": "Curry Up Now",
   "url": "http://lineup.sfoutsidelands.com/band/curry-up-now",
   "description": "Samosas, Sexy Fries",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69529/custom60bc9735ecd0b736b483a76a3976abab.jpg"
 },
 {
   "name": "Del Popolo",
   "url": "http://lineup.sfoutsidelands.com/band/del-popolo",
   "description": "Margherita Pepperoni Pizzas",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69531/custom14829b11d2e723a2a0ea189b8f3628cf.jpg"
 },
 {
   "name": "Event Specialists",
   "url": "http://lineup.sfoutsidelands.com/band/event-specialists",
   "description": "Cinnamon Sugar Churros, Giant Soft Pretzels",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69545/custom642dd58d913607fe0cd1bd35ad1c1a65.jpg"
 },
 {
   "name": "Homestead Cookies",
   "url": "http://lineup.sfoutsidelands.com/band/homestead-cookies",
   "description": "Signature Savory Sweet Chocolate Chip Cookies",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69555/custom94ce9c68a26dc81c9904251bdb645c3f.jpg"
 },
 {
   "name": "Humphry Slocombe\nIce Cream",
   "url": "http://lineup.sfoutsidelands.com/band/humphry-slocombe-ice-cream",
   "description": "Secret Breakfast Ice Cream, Bourbon Coke Floats",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69699/custome75ae4699b0bafd614e8c04bfeec7dc5.jpg"
 },
 {
   "name": "Living Greens Juice",
   "url": "http://lineup.sfoutsidelands.com/band/living-greens-juice",
   "description": "Fresh Pressed Juices, Cracked Thai Coconuts, Hot Detox Tea",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69569/custome73c00c83d991ad8ab45718db64c293e.jpg"
 },
 {
   "name": "Mozzeria",
   "url": "http://lineup.sfoutsidelands.com/band/mozzeria",
   "description": "Salumi & Margherita Pizzas",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69575/custom18916cb1eb792d510550c9fd8477fdc8.jpg"
 },
 {
   "name": "Rocko's Ice Cream Tacos",
   "url": "http://lineup.sfoutsidelands.com/band/rockos-ice-cream-tacos",
   "description": "Ice Cream Tacos, Frozen Bananas",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69587/custome3eeaacea379854ae51d81ebc4a8f99c.jpg"
 },
 {
   "name": "Senor Sisig",
   "url": "http://lineup.sfoutsidelands.com/band/se%C3%B1or-sisig",
   "description": "Pork, Chicken & Tofu Sisig with Steamed Rice",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69607/custom37c60a0b308e4ee6925e42ec092904e9.jpg"
 },
 {
   "name": "Seoul on Wheels",
   "url": "http://lineup.sfoutsidelands.com/band/seoul-on-wheels",
   "description": "Kimchee Fried Rice Plates, Korritos",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69609/custom69f955561e0629a5ea59bb16a29a48c9.jpg"
 },
 {
   "name": "Sprogs",
   "url": "http://lineup.sfoutsidelands.com/band/sprogs",
   "description": "Fresh Fruit & Veggie Dippers, Fresh Fruit Sippers",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69619/custom8c716ac66fe2a3a2ae3e0c02d2b922f6.jpg"
 },
 {
   "name": "The Chairman",
   "url": "http://lineup.sfoutsidelands.com/band/the-chairman",
   "description": "Steamed and Baked Baos, Bao Chips",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69633/custom97e6c2761aeee33aed03befcf6baa56f.jpg"
 },
 {
   "name": "Those Fabulous Frickle Brothers",
   "url": "http://lineup.sfoutsidelands.com/band/those-fabulous-frickle-brothers",
   "description": "Fabulous Frickles, Fried Green Tomatoes",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69647/customcb80ff9745eaa3ab210b628a58471877.jpg"
 },
 {
   "name": "Candybar Dessert Lounge",
   "url": "http://lineup.sfoutsidelands.com/band/candybar-dessert-lounge",
   "description": "Hot Chocolate, Chocolate French Macarons",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69525/custom66f9af16f63ed7439f8457e70021be78.jpg"
 },
 {
   "name": "Epic Cookies",
   "url": "http://lineup.sfoutsidelands.com/band/epic-cookies",
   "description": "White Chocolate Macadamia Cookies, Snickerdoodles",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69541/customf724f476e7f1e309710c092648df2d37.jpg"
 },
 {
   "name": "Guittard Chocolate\nCompany",
   "url": "http://lineup.sfoutsidelands.com/band/guittard-chocolate-company",
   "description": "Melted Chocolate Bars",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69553/customa62dae03b02ecb3d8ea14d46d1a33aca.jpg"
 },
 {
   "name": "Il Morso",
   "url": "http://lineup.sfoutsidelands.com/band/il-morso",
   "description": "Coffee Without the Cup",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69715/custom1f8a1a520e5843a265809839b35bbe0a.png"
 },
 {
   "name": "Kara's Cupcakes",
   "url": "http://lineup.sfoutsidelands.com/band/karas-cupcakes",
   "description": "Cupcakes, Karamel Corn",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69573/custom5c0a047cddc57c42feaf631514955bd4.jpg"
 },
 {
   "name": "Sharona's Chocolate Shop",
   "url": "http://lineup.sfoutsidelands.com/band/sharonas-chocolate",
   "description": "Chocolate Dipped Brownies & Peanut Butter Cups",
   "img": "http://s3.amazonaws.com/dostuff-production/band_alternate_photo/custom_photos/69611/customf72b1b0d3ab8b67afd4b1d4199ce239d.jpg"
 }
 ]
};

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
			var key = ['hungry','eat','lunch','dinner','more'];
			var isHungry = false;
			for (var j = 0; j < key.length; j++){
				isHungry = isHungry || (text.indexOf(key[j]) > -1);
			}
			if (isHungry) {
				sendGenericMessage(sender,randFood(),randFood(),randFood())
				continue
				sendTextMessage(sender, foods.food[randomnumber].name)
			}
		}
	}
	res.sendStatus(200)
})

function randFood(){
	return Math.floor(Math.random() * (77)) + 1;
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

function sendGenericMessage(sender,rf1,rf2,rf3) {
	var title = "Check it out!"
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": foods.food[randomnumber].name,
                    "subtitle": foods.food[randomnumber].description,
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": foods.food[randomnumber].url,
                        "title": title
                    },
                    {
                    "title": foods.food[randomnumber].name,
                    "subtitle": foods.food[randomnumber].description,
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": foods.food[randomnumber].url,
                        "title": title
                    },
                    {
                    "title": foods.food[randomnumber].name,
                    "subtitle": foods.food[randomnumber].description,
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": foods.food[randomnumber].url,
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

var foods = {
	food: [
	{
		"id":"1",
		"name":"4505 Meats",
		"url":"http://lineup.sfoutsidelands.com/band/4505-meats",
		"description":"Best Damn Cheeseburgers, Spicy Chimichurri Fries"
	},
	{
		"id":"2",
		"name":"Alicia's Tamales Los Mayas",
		"url":"http://lineup.sfoutsidelands.com/band/alicias-tamales-los-mayas",
		"description":"Tamales, Elote"
	},
	{
		"id":"3",
		"name":"Azalina's",
		"url":"http://lineup.sfoutsidelands.com/band/azalinas",
		"description":"Malaysian Peanut Tofu Braised Nachos"
	},
	{
		"id":"4",
		"name":"Beast and the Hare",
		"url":"http://lineup.sfoutsidelands.com/band/beast-and-the-hare",
		"description":"Loaded Baked Potatoes"
	},
	{
		"id":"5",
		"name":"Belcampo Meat Co.",
		"url":"http://lineup.sfoutsidelands.com/band/belcampo-meat-co",
		"description":"Fastburgers, Grass-Fed Beef Hot Dogs"
	},
	{
		"id":"6",
		"name":"Big Chef Tom's\nBelly Burgers",
		"url":"http://lineup.sfoutsidelands.com/band/big-chef-toms-belly-burgers",
		"description":"Pork Belly Burgers"
	},
	{
		"id":"7",
		"name":"Bini's Kitchen",
		"url":"http://lineup.sfoutsidelands.com/band/binis-kitchen",
		"description":"Turkey Momos, Nepalese Veggie Dumplings"
	},
	{
		"id":"8",
		"name":"Charles Chocolates",
		"url":"http://lineup.sfoutsidelands.com/band/charles-chocolates",
		"description":"Frozen Hot Chocolate, S'mores"
	},
	{
		"id":"9",
		"name":"Delessio Market & Bakery",
		"url":"http://lineup.sfoutsidelands.com/band/delessio-market-and-bakery",
		"description":"Thai Chicken Sandwiches, Rabanada"
	},
	{
		"id":"10",
		"name":"Earthly Delights",
		"url":"http://lineup.sfoutsidelands.com/band/earthly-delights",
		"description":"Philly Cheesesteaks, Garlic Fries"
	},
	{
		"id":"11",
		"name":"El Huarache Loco",
		"url":"http://lineup.sfoutsidelands.com/band/el-huarache-loco",
		"description":"Huaraches, Chilaquiles"
	},
	{
		"id":"12",
		"name":"Endless Summer Sweets",
		"url":"http://lineup.sfoutsidelands.com/band/endless-summer-sweets",
		"description":"Gourmet Funnel Cakes, Corn Dogs"
	},
	{
		"id":"13",
		"name":"Escape From New York Pizza",
		"url":"http://lineup.sfoutsidelands.com/band/escape-from-new-york-pizza",
		"description":"Pesto, Potato and Roasted Garlic Pizza Slices"
	},
	{
		"id":"14",
		"name":"Fine & Rare",
		"url":"http://lineup.sfoutsidelands.com/band/fine-and-rare",
		"description":"Crab Rolls, Old Bay Chips"
	},
	{
		"id":"15",
		"name":"FK Frozen Custard Bars",
		"url":"http://lineup.sfoutsidelands.com/band/fk-frozen-custard-bars",
		"description":"Frozen Custard Bars"
	},
	{
		"id":"16",
		"name":"Four Barrel Coffee",
		"url":"http://lineup.sfoutsidelands.com/band/four-brand-coffee",
		"description":"Nitro Cold Brew Coffee"
	},
	{
		"id":"17",
		"name":"Freshroll Vietnamese Rolls &\nBowls",
		"url":"http://lineup.sfoutsidelands.com/band/freshroll-vietnamese-rolls-and-bowls",
		"description":"Banh Mis, Taro Chips"
	},
	{
		"id":"18",
		"name":"Glaze Teriyaki",
		"url":"http://lineup.sfoutsidelands.com/band/glaze-teriyaki",
		"description":"Salmon, Steak & Chicken Teriyaki, Spicy Yaki Wings"
	},
	{
		"id":"19",
		"name":"Il Cane Rosso",
		"url":"http://lineup.sfoutsidelands.com/band/il-cane-rosso",
		"description":"Olive Oil Fried Egg Sandwiches, Griddled French Toast with Maple Caramel"
	},
	{
		"id":"20",
		"name":"Itani Ramen",
		"url":"http://lineup.sfoutsidelands.com/band/itani-ramen",
		"description":"Pork Gyoza, Vegetarian Ramen, Chicken Ramen"
	},
	{
		"id":"21",
		"name":"Koja Kitchen",
		"url":"http://lineup.sfoutsidelands.com/band/koja-kitchen",
		"description":"Korean BBQ Tacos"
	},
	{
		"id":"22",
		"name":"La Urbana",
		"url":"http://lineup.sfoutsidelands.com/band/la-urbana",
		"description":"Chorizo Bacon Dogs, Esquites"
	},
	{
		"id":"23",
		"name":"Little Skillet",
		"url":"http://lineup.sfoutsidelands.com/band/little-skillet",
		"description":"Fried Chicken & Waffles, Watermelon, Red Velvet Cupcakes"
	},
	{
		"id":"24",
		"name":"Loving Cup",
		"url":"http://lineup.sfoutsidelands.com/band/loving-cup",
		"description":"Coffee, Ice Cream Sandwiches"
	},
	{
		"id":"25",
		"name":"Lucca Foods",
		"url":"http://lineup.sfoutsidelands.com/band/lucca-foods",
		"description":"BBQ Pulled Pork Sandwiches, Rice Krispy Treats"
	},
	{
		"id":"26",
		"name":"Merigan Sub Shop",
		"url":"http://lineup.sfoutsidelands.com/band/merigan-sub-shop",
		"description":"Mozzarella Sticks, Italian Ice"
	},
	{
		"id":"27",
		"name":"Namu Street Food",
		"url":"http://lineup.sfoutsidelands.com/band/namu-street-food",
		"description":"Korean Fried Chicken"
	},
	{
		"id":"28",
		"name":"Nombe",
		"url":"http://lineup.sfoutsidelands.com/band/nombe",
		"description":"Ramenburgers, Sushi Burritos"
	},
	{
		"id":"29",
		"name":"Pacific Catch",
		"url":"http://lineup.sfoutsidelands.com/band/pacific-catch",
		"description":"Hawaiian Ahi Poke, Fish & Chips, Sweet Potato Fries"
	},
	{
		"id":"30",
		"name":"Pica Pica Arepa Kitchen",
		"url":"http://lineup.sfoutsidelands.com/band/pica-pica-arepa-kitchen",
		"description":"Arepas, Yuca Fries, Sweet Plantains"
	},
	{
		"id":"31",
		"name":"Precita Park Cafe",
		"url":"http://lineup.sfoutsidelands.com/band/precita-park-cafe",
		"description":"Bacon Egg and Cheese Fries, Equator Coffee"
	},
	{
		"id":"32",
		"name":"Proposition Chicken",
		"url":"http://lineup.sfoutsidelands.com/band/proposition-chicken",
		"description":"Fried Chicken Sandwiches with Spicy Slaw"
	},
	{
		"id":"33",
		"name":"Rich Table",
		"url":"http://lineup.sfoutsidelands.com/band/rich-table",
		"description":"Porcini Doughnuts with Raclette Cheese"
	},
	{
		"id":"34",
		"name":"Rosamunde Sausage Grill",
		"url":"http://lineup.sfoutsidelands.com/band/rosamunde-sausage-grill",
		"description":"Grilled Sausages, Brats, Poutine"
	},
	{
		"id":"35",
		"name":"Rove Kitchen",
		"url":"http://lineup.sfoutsidelands.com/band/rove-kitchen",
		"description":"Fried Chicken Skin Sandwiches, House Pickled Veggies"
	},
	{
		"id":"36",
		"name":"Sababa",
		"url":"http://lineup.sfoutsidelands.com/band/sababa",
		"description":"Falafel Sandwiches and Plates"
	},
	{
		"id":"37",
		"name":"Sabores Del Sur",
		"url":"http://lineup.sfoutsidelands.com/band/sabores-del-sur",
		"description":"Empanadas, Alfajores"
	},
	{
		"id":"38",
		"name":"Sataysfied",
		"url":"http://lineup.sfoutsidelands.com/band/sataysfied",
		"description":"Chicken Satays, Mie Tek Tek (Indonesian Fried Noodles)"
	},
	{
		"id":"39",
		"name":"Southpaw BBQ &\nSouthern Cooking",
		"url":"http://lineup.sfoutsidelands.com/band/southpaw-bbq-and-southern-cooking",
		"description":"Brisket Sandwiches, Pulled Jackfruit Sandwiches"
	},
	{
		"id":"40",
		"name":"Smoothie Detour",
		"url":"http://lineup.sfoutsidelands.com/band/smoothie-detour",
		"description":"Fresh Fruit Smoothies"
	},
	{
		"id":"41",
		"name":"Spicy Pie",
		"url":"http://lineup.sfoutsidelands.com/band/spicy-pie",
		"description":"Giant Pizza Slices, Cookie Pie"
	},
	{
		"id":"42",
		"name":"Split Pea Seduction",
		"url":"http://lineup.sfoutsidelands.com/band/split-pea-seduction",
		"description":"Country Style Split Pea Soup, Shakable Stone Fruit Salads, Puerto Rican Pork Sandwiches"
	},
	{
		"id":"43",
		"name":"Stones Throw",
		"url":"http://lineup.sfoutsidelands.com/band/stones-throw-hvvrvphf",
		"description":"Meatball Sandwiches, Fat Angel Kale Salads"
	},
	{
		"id":"44",
		"name":"Straw",
		"url":"http://lineup.sfoutsidelands.com/band/straw",
		"description":"Donut Cheeseburgers, Sweet Potato Tots"
	},
	{
		"id":"45",
		"name":"Sugar & Spun",
		"url":"http://lineup.sfoutsidelands.com/band/sugar-and-spun",
		"description":"Cotton Candy Bouquets"
	},
	{
		"id":"46",
		"name":"Suite Foods Waffles",
		"url":"http://lineup.sfoutsidelands.com/band/suite-foods-waffles",
		"description":"Belgian Waffles Stuffed with Whipped Cream"
	},
	{
		"id":"47",
		"name":"Tacolicious",
		"url":"http://lineup.sfoutsidelands.com/band/tacolicious",
		"description":"Shot-and-a-Beer Braised Chicken Tacos"
	},
	{
		"id":"48",
		"name":"The American Grilled\nCheese Kitchen",
		"url":"http://lineup.sfoutsidelands.com/band/the-american-grilled-cheese-kitchen",
		"description":"Classic Grilled Cheeses, Smokey Tomato Soup"
	},
	{
		"id":"49",
		"name":"The Farmer's Wife",
		"url":"http://lineup.sfoutsidelands.com/band/the-farmers-wife",
		"description":"Gravenstein Apple & Wildflower Honey Melts"
	},
	{
		"id":"50",
		"name":"The Japanese Pantry",
		"url":"http://lineup.sfoutsidelands.com/band/the-japanese-pantry",
		"description":"Spicy Tater Tots"
	},
	{
		"id":"51",
		"name":"The Little Chihuahua",
		"url":"http://lineup.sfoutsidelands.com/band/the-little-chihuahua",
		"description":"Fried Plantain and Black Bean Burritos"
	},
	{
		"id":"52",
		"name":"The Monk's Kettle",
		"url":"http://lineup.sfoutsidelands.com/band/the-monks-kettle",
		"description":"Pretzel Knots with Beer Cheese Sauce"
	},
	{
		"id":"53",
		"name":"The Up & Under\nPub and Grill",
		"url":"http://lineup.sfoutsidelands.com/band/the-up-and-under-pub-and-grill",
		"description":"Gourmet Waffle Fries"
	},
	{
		"id":"54",
		"name":"Three Babes Bakeshop",
		"url":"http://lineup.sfoutsidelands.com/band/three-babes-bakeshop",
		"description":"Peach Cobblers, Chicken & Dumplings"
	},
	{
		"id":"55",
		"name":"Three Twins Ice Cream",
		"url":"http://lineup.sfoutsidelands.com/band/three-twins-ice-cream",
		"description":"Assorted Organic Ice Creams, Wafer Ice Cream Sandwiches"
	},
	{
		"id":"56",
		"name":"Trestle",
		"url":"http://lineup.sfoutsidelands.com/band/trestle",
		"description":"Announcing Soon"
	},
	{
		"id":"57",
		"name":"Wise Sons Jewish Deli",
		"url":"http://lineup.sfoutsidelands.com/band/wise-sons-jewish-deli",
		"description":"Turkey Clubs, Pastrami Cheese Fries, Bagels & Shmear, Chocolate Bobka"
	},
	{
		"id":"58",
		"name":"Woodhouse Fish Co.",
		"url":"http://lineup.sfoutsidelands.com/band/woodhouse-fish-co",
		"description":"Lobster Rolls, Clam Chowder, Raw & BBQ Oysters"
	},
	{
		"id":"59",
		"name":"Bacon Bacon",
		"url":"http://lineup.sfoutsidelands.com/band/bacon-bacon",
		"description":"California BBQ Bacon Burritos, Chocolate Covered Bacon"
	},
	{
		"id":"60",
		"name":"Curry Up Now",
		"url":"http://lineup.sfoutsidelands.com/band/curry-up-now",
		"description":"Samosas, Sexy Fries"
	},
	{
		"id":"61",
		"name":"Del Popolo",
		"url":"http://lineup.sfoutsidelands.com/band/del-popolo",
		"description":"Margherita Pepperoni Pizzas"
	},
	{
		"id":"62",
		"name":"Event Specialists",
		"url":"http://lineup.sfoutsidelands.com/band/event-specialists",
		"description":"Cinnamon Sugar Churros, Giant Soft Pretzels"
	},
	{
		"id":"63",
		"name":"Homestead Cookies",
		"url":"http://lineup.sfoutsidelands.com/band/homestead-cookies",
		"description":"Signature Savory Sweet Chocolate Chip Cookies"
	},
	{
		"id":"64",
		"name":"Humphry Slocombe\nIce Cream",
		"url":"http://lineup.sfoutsidelands.com/band/humphry-slocombe-ice-cream",
		"description":"Secret Breakfast Ice Cream, Bourbon Coke Floats"
	},
	{
		"id":"65",
		"name":"Living Greens Juice",
		"url":"http://lineup.sfoutsidelands.com/band/living-greens-juice",
		"description":"Fresh Pressed Juices, Cracked Thai Coconuts, Hot Detox Tea"
	},
	{
		"id":"66",
		"name":"Mozzeria",
		"url":"http://lineup.sfoutsidelands.com/band/mozzeria",
		"description":"Salumi & Margherita Pizzas"
	},
	{
		"id":"67",
		"name":"Rocko's Ice Cream Tacos",
		"url":"http://lineup.sfoutsidelands.com/band/rockos-ice-cream-tacos",
		"description":"Ice Cream Tacos, Frozen Bananas"
	},
	{
		"id":"68",
		"name":"Senor Sisig",
		"url":"http://lineup.sfoutsidelands.com/band/se%C3%B1or-sisig",
		"description":"Pork, Chicken & Tofu Sisig with Steamed Rice"
	},
	{
		"id":"69",
		"name":"Seoul on Wheels",
		"url":"http://lineup.sfoutsidelands.com/band/seoul-on-wheels",
		"description":"Kimchee Fried Rice Plates, Korritos"
	},
	{
		"id":"70",
		"name":"Sprogs",
		"url":"http://lineup.sfoutsidelands.com/band/sprogs",
		"description":"Fresh Fruit & Veggie Dippers, Fresh Fruit Sippers"
	},
	{
		"id":"71",
		"name":"The Chairman",
		"url":"http://lineup.sfoutsidelands.com/band/the-chairman",
		"description":"Steamed and Baked Baos, Bao Chips"
	},
	{
		"id":"72",
		"name":"Those Fabulous Frickle Brothers",
		"url":"http://lineup.sfoutsidelands.com/band/those-fabulous-frickle-brothers",
		"description":"Fabulous Frickles, Fried Green Tomatoes"
	},
	{
		"id":"73",
		"name":"Candybar Dessert Lounge",
		"url":"http://lineup.sfoutsidelands.com/band/candybar-dessert-lounge",
		"description":"Hot Chocolate, Chocolate French Macarons"
	},
	{
		"id":"74",
		"name":"Epic Cookies",
		"url":"http://lineup.sfoutsidelands.com/band/epic-cookies",
		"description":"White Chocolate Macadamia Cookies, Snickerdoodles"
	},
	{
		"id":"75",
		"name":"Guittard Chocolate\nCompany",
		"url":"http://lineup.sfoutsidelands.com/band/guittard-chocolate-company",
		"description":"Melted Chocolate Bars"
	},
	{
		"id":"76",
		"name":"Il Morso",
		"url":"http://lineup.sfoutsidelands.com/band/il-morso",
		"description":"Coffee Without the Cup"
	},
	{
		"id":"77",
		"name":"Kara's Cupcakes",
		"url":"http://lineup.sfoutsidelands.com/band/karas-cupcakes",
		"description":"Cupcakes, Karamel Corn"
	},
	{
		"id":"78",
		"name":"Sharona's Chocolate Shop",
		"url":"http://lineup.sfoutsidelands.com/band/sharonas-chocolate",
		"description":"Chocolate Dipped Brownies & Peanut Butter Cups"
	}
	]
};

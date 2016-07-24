var foods = require('./food.json')


function showMeFood(list){
  console.log(list.length)
  if(list.length >= 3) {
    let messageData = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": list[0].name,
            "subtitle": list[1].description,
            "image_url": list[1].img,
            "buttons": [{
              "type": "web_url",
              "url": list[1].url,
              "title": title
            }],
          },
          {
            "title": list[2].name,
            "subtitle": list[2].description,
            "image_url": list[2].img,
            "buttons": [{
              "type": "web_url",
              "url": list[2].url,
              "title": title
            }],
          },
          {
            "title": list[3].name,
            "subtitle": list[3].description,
            "image_url": list[3].img,
            "buttons": [{
              "type": "web_url",
              "url": list[3].url,
              "title": title
            }],
          }]
        }
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
    console.log(messageData)
}
function preprocessFoodTypes(){
  var food_types = {}
  for(var i = 0; i< foods.food.length; i++){
    if(foods.food[i].type == "AMERICAN"){
      if("AMERICAN" in food_types){
        food_types["AMERICAN"].push(foods.food[i])
      }
      else {
        food_types["AMERICAN"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "UNHEALTHY"){
      if("UNHEALTHY" in food_types){
        food_types["UNHEALTHY"].push(foods.food[i])
      }
      else {
        food_types["UNHEALTHY"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "ASIAN"){
      if("ASIAN" in food_types){
        food_types["ASIAN"].push(foods.food[i])
      }
      else {
        food_types["ASIAN"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "MEXICAN"){
      if("MEXICAN" in food_types){
        food_types["MEXICAN"].push(foods.food[i])
      }
      else {
        food_types["MEXICAN"] = [foods.food[i]]
      }
    }
    else if (foods.food[i].type == "VEGETARIAN") {
      if("VEGETARIAN" in food_types){
        food_types["VEGETARIAN"].push(foods.food[i])
      }
      else {
        food_types["VEGETARIAN"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "SWEET"){
      if("SWEET" in food_types){
        food_types["SWEET"].push(foods.food[i])
      }
      else {
        food_types["SWEET"] = [foods.food[i]]
      }
    }
  }
  console.log("REACHED")
  return food_types
}

module.exports = {
  preprocessFoodTypes: preprocessFoodTypes,
  showMeFood: showMeFood
}
'use strict'

var foods = require('./food.json')

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
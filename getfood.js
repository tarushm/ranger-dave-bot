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
    else if(foods.food[i].type == "FRIES"){
      if("FRIES" in food_types){
        food_types["FRIES"].push(foods.food[i])
      }
      else {
        food_types["FRIES"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "PIZZA"){
      if("PIZZA" in food_types){
        food_types["PIZZA"].push(foods.food[i])
      }
      else {
        food_types["PIZZA"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "COFFEE"){
      if("COFFEE" in food_types){
        food_types["COFFEE"].push(foods.food[i])
      }
      else {
        food_types["COFFEE"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "TACOS"){
      if("TACOS" in food_types){
        food_types["TACOS"].push(foods.food[i])
      }
      else {
        food_types["TACOS"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "BACON"){
      if("BACON" in food_types){
        food_types["BACON"].push(foods.food[i])
      }
      else {
        food_types["BACON"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "BURGER"){
      if("BURGER" in food_types){
        food_types["BURGER"].push(foods.food[i])
      }
      else {
        food_types["BURGER"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "CHOCOLATE"){
      if("CHOCOLATE" in food_types){
        food_types["CHOCOLATE"].push(foods.food[i])
      }
      else {
        food_types["CHOCOLATE"] = [foods.food[i]]
      }
    }
    else if(foods.food[i].type == "SANDWICH"){
      if("SANDWICH" in food_types){
        food_types["SANDWICH"].push(foods.food[i])
      }
      else {
        food_types["SANDWICH"] = [foods.food[i]]
      }
    }
  else if(foods.food[i].type == "CHOCOLATE"){
      if("CHOCOLATE" in food_types){
        food_types["CHOCOLATE"].push(foods.food[i])
      }
      else {
        food_types["CHOCOLATE"] = [foods.food[i]]
      }
    }
  }
  return food_types
}

module.exports = {
  preprocessFoodTypes: preprocessFoodTypes,
}
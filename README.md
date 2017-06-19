# Neighborhood-Map

## Overview
This project gives users a list of Indian restaurants in the choice of your city(only in US). Restaurant data is accessed via the Zomato API. Results are displayed in a list view - 20 results per page. The corresponding markers are displayed on the map based on the city chosen. Users can also filter from the results by name.

## Usage
* To use this project - 
  * Clone the repo  
  OR
  * Fork the repo
* Run index.html

## Features
* Autocomplete search for cities
* Search produces a list view of restaurants which shows - 
  * No of restaurants found
  * Max 20 restaurants per page(Zomato only gives 100 restaurants max even if it finds more results)
  * Ability to access the info of a specific restaurant by clicking on the restaurant on the list
* Search also shows markers on the map for corresponding restaurants
* Infowindow for the marker or the list view entry which shows the name, address, thumbnail(if available), Average cost for two, user rating and the menu url
* Filter results by name
* Mobile responsive

## Frameworks 
* [jQuery](http://jquery.com/)
* [Knockout.js](http://knockoutjs.com/)

## API's/CORS
* [Google Maps API](https://developers.google.com/maps/)
* [Zomato API](https://developers.zomato.com/api)
* [CORS Anywhere](https://github.com/Rob--W/cors-anywhere)


function viewModel(){
    var self = this;
    var map;
    var place = '';
    var newLocation;
    var filterLoc;
    var place_id;
    var largeInfowindow = new google.maps.InfoWindow({maxwidth: 300});
    var cors_anywhere_url = 'https://cors-anywhere.herokuapp.com/';


      // Create a new blank array for all the listing markers.
    var markers = [];
    this.showDiv = ko.observable(false);
    this.searchLocation = ko.observable();
    //console.log(this.searchLocation());
    this.filterLocation = ko.observable();
    this.restaurantList = ko.observableArray([]);

    var restaurant = function(data){
        this.name = data.name;
        this.address = data.location.address + "<br>" + data.location.city +
                       " " + data.location.zipcode;
        this.rating = data.user_rating.aggregate_rating;
        this.menuUrl = data.menu_url;
        this.lat = parseFloat(data.location.latitude);
        this.lng = parseFloat(data.location.longitude);
    }


    this.initialize = function(){

        console.log('Initmap');
    //  creates a new map - only center and zoom are required.
        map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 39.8282, lng: -98.5795},
        zoom: 4,
        scrollwheel: false,
        zoomControl: true
        });
        var input = document.getElementById('input_text');
        var submit_id = document.getElementById('submit');

        console.log(input);

        var options = {
            types: ['(cities)']
            };

        newLocation = new google.maps.places.Autocomplete(input,options);
        console.log(newLocation);

        newLocation.addListener('place_changed', function(){
                place = newLocation.getPlace();
                self.searchLocation(place);
                console.log(self.searchLocation);
                console.log(place);
                hideMarkers();
                self.showDiv(false);
                markers = [];
                self.restaurantList.removeAll();

                });

        }; //end of initialize

        function hideMarkers() {
            for (var i = 0; i < markers.length; i++) {
                markers[i].marker.setMap(null);
        }
      }


    this.processSearchLocation = function(formElement){
        console.log(formElement["searchText"].value);
        var geocoder = new google.maps.Geocoder();
        var place_name = formElement["searchText"].value;
        console.log(place_name);
        if(place_name == ''){
            window.alert('Please enter a state');
        }
        else{

            var state = place.formatted_address;
            console.log(state);
            geocoder.geocode(
            {
               address: state
            }, function(results, status){
                console.log(results);
                if(status == google.maps.GeocoderStatus.OK){
                    map.setCenter(results[0].geometry.location);
                    console.log(results[0].geometry.location);
                    map.setZoom(10);
                    var newLat = results[0].geometry.location.lat();
                    var newLng = results[0].geometry.location.lng();

                    getZomatoCityId(place_name, newLat, newLng);
                }
                else{
                    window.alert('We could not find the place');
                }
            }
            );
        }

    }; //end of processSearchLocation


    function getZomatoCityId(place_name, newLat, newLng){
        var zomatoUrl = "https://developers.zomato.com/api/v2.1/" +
                        "cities?q=";
                    $.ajax({
                        type: 'GET',
                        url: cors_anywhere_url + zomatoUrl + place_name +
                        "&lat=" + newLat + "&lon=" + newLng + "&count=1",
                        headers: {'user_key': '26ce1af09de13709ce7601f27ae5e14d'},

                                }).done(function(response){
                                    //console.log(response);
                            place_id = response.location_suggestions[0].id;
                            //console.log(place_id);
                            getZomatoRestaurants(place_id);
                                }).fail(function(){
                                    console.log("error getting place id");
                    });
    }


    this.filterResults = function(formElement){
        if(formElement["filterText"].value == ''){
            window.alert('please enter a city');
        }
        else{

                    }
    }



    this.goToMarker = function(clickedRestaurant){
        console.log(clickedRestaurant);
        var name = clickedRestaurant.name;
        console.log(name);
        for(var i=0;i<markers.length;i++){
            console.log(markers[i].marker.title);
            if(name == markers[i].marker.title){
                console.log('if true');
                map.panTo(markers[i].marker.position);
                map.setZoom(14);
                populateInfoWindow(markers[i].marker,largeInfowindow,
                                   markers[i].content);
                break;
            }
        }
    }


    function showRestaurants(data){
        console.log(data);
        for(var i=0;i<data.results_shown;i++){
            var r = data.restaurants[i].restaurant;
            self.restaurantList.push(new restaurant(r));
            createMarker(r);
                }

    } //end of showRestaurants



function getZomatoRestaurants(place_id){
        var zomatoUrl = "https://developers.zomato.com/api/v2.1/" +
                        "search?entity_id=" +
                        place_id + "&entity_type=city&cuisines=148"
        $.ajax({
            type: 'GET',
            url: cors_anywhere_url + zomatoUrl,
            headers: {'user_key': '26ce1af09de13709ce7601f27ae5e14d'},
            }).done(function(response){
                //console.log(response);
                showRestaurants(response);
            }).fail(function(){
                console.log("error getting restaurants");

        });
    } //end of getYelpReviews




    function createMarker(r){
        self.showDiv(true);
        //console.log('creating marker');
        var position, lat, lng;
        lat = parseFloat(r.location.latitude);
        //console.log(lat);
        lng = parseFloat(r.location.longitude);
        //console.log(lng);
        position = {lat:lat,lng:lng};
        //console.log(position);
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: r.name,
            animation: google.maps.Animation.DROP,
          });

        var contentString = '<div id="infoWindow">' +
                            '<h2>' + r.name + '</h2>' +
                            '<p>' + r.location.address + '</p>' +
                            '<p class="rating">' +
                            r.user_rating.aggregate_rating + '</p>' +
                            '<a href=' + r.menu_url + '>' + 'Menu Url</a>'

        // Push the marker to our array of markers.
          markers.push({marker:marker, content: contentString});
          // Create an onclick event to open an infowindow at each marker.
          marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow, contentString);
          });
    } // end of createMarker


    function populateInfoWindow(marker, infowindow, contentString) {
        // Check to make sure the infowindow is not already opened on this marker.
        console.log(marker);
        console.log(contentString);
        if (infowindow.marker != marker) {
          infowindow.marker = marker;
          infowindow.setContent(contentString);
          infowindow.open(map, marker);
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick',function(){
            infowindow.setMarker = null;
          });
        }
      }

if(typeof google === 'object'){
    google.maps.event.addDomListener(window,'load',this.initialize)
}
else{
    this.handleError('Cannot load the map...Please reload the page');
}

}

ko.applyBindings(new viewModel());










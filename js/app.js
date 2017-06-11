/*$(function(){
 getYelpReviews();
 });*/





function viewModel(){
    var self = this;
    var map;
    var place = '';
    var newLocation;
    var filterLoc;
    var largeInfowindow = new google.maps.InfoWindow({maxwidth: 300});

      // Create a new blank array for all the listing markers.
    var markers = [];
    this.showDiv = ko.observable(false);
    this.searchLocation = ko.observable();
    //console.log(this.searchLocation());
    this.filterLocation = ko.observable();
    this.restaurantList = ko.observableArray([]);

    var restaurant = function(data){
        this.name = ko.observable(data.name);
        this.address = ko.observable(data.formatted_address);
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
            regions: ['state','administrative_area_level_1']};

        newLocation = new google.maps.places.Autocomplete(input,
        options);
        console.log(newLocation);

        var input = document.getElementById('filter_text');
        var bounds = new google.maps.LatLngBounds();
        var options = {
            bounds: bounds,
            types: ['(cities)']
        }
        filterLoc = new google.maps.places.Autocomplete(input);

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

        }; //end of initMap

        function hideMarkers() {
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
        }
      }




    this.processSearchLocation = function(formElement){
        console.log(formElement["searchText"].value);
        var geocoder = new google.maps.Geocoder();

        if(formElement["searchText"].value == ''){
            window.alert('Please enter a state');
        }
        else{

            //filterLoc.addListener('')
            var state = place.formatted_address;
            console.log(state);
            geocoder.geocode(
            {
               address: state
            }, function(results, status){
                console.log(status);
                console.log(results);
                if(status == google.maps.GeocoderStatus.OK){
                    map.setCenter(results[0].geometry.location);
                    console.log(results[0].geometry.location);
                    map.setZoom(8);
                    var newLat = results[0].geometry.location.lat();
                    var newLng = results[0].geometry.location.lng();
                    console.log(newLat);
                    console.log(newLng);
                    var position = {lat:newLat,lng:newLng};
                    searchRestaurants(state, position);
                    //getYelpReviews(state,newLat,newLng);
                    var bounds = new google.maps.LatLngBounds();
                    bounds.extend(position);
                    //filterLoc.setOptions({strictBounds: true});
                    filterLoc.setBounds(bounds);
                }
                else{
                    window.alert('We could not find the place');
                }
            }
            )


        }

    }; //end of processSearchLocation


    this.filterResults = function(formElement){
        if(formElement["filterText"].value == ''){
            window.alert('please enter a city');
        }
        else{
            var state = '';
            var position = filterLoc.getBounds();
            //console.log(lat);
            //console.log(lat.b);
            //console.log(lat.f.value);
            searchRestaurants(state, position);
        }
    }



    this.goToMarker = function(clickedRestaurant){
        console.log(clickedRestaurant.name());
        var name = clickedRestaurant.name();
        console.log(name);
        for(var key in markers){

            console.log(markers[key].title);
            if(name == markers[key].title){
                console.log('if true');
                map.panTo(markers[key].position);
                map.setZoom(14);
                console.log(markers[key]);
                populateInfoWindow(markers[key],largeInfowindow);
                break;
            }
        }


    }


    function searchRestaurants(state,position){
        console.log('searching restaurants');
        //var position = {lat:newLat,lng:newLng};
        console.log(position);
        var bounds = new google.maps.LatLngBounds();
        var request = {
            bounds: bounds.extend(position),
            query: ['indian cuisine','indian']
        }

        var service = new google.maps.places.PlacesService(map);
        console.log(service);
        service.textSearch(request, function(results,status){
            if(status == google.maps.places.PlacesServiceStatus.OK){
                for(var i=0;i<results.length;i++){
                    var point = results[i];
                    //console.log(point);
                    //console.log('going to create a marker');
                    //var restaurant = {name:point.name,address:point
                    //.formatted_address};
                    //console.log(restaurant);
                    if(state != ''){
                    self.restaurantList.push(new restaurant(point));
                    }
                    createMarker(point);
                }
            }
        });
        getYelpReviews(position.lat,position.lng)

    } //end of searchRestaurants



function getYelpReviews(lat,lng){
        var cors_anywhere_url = 'https://cors-anywhere.herokuapp.com/';

        /*var yelpRequestUrl = "https://api.yelp.com/oauth2/token";
        var app_id = 'CWLGp_F0hob5KO8sy-ZNww';
        var app_secret = '5e5iLrJNv36MR5ks7FAlmH2PVxgrM14dijyXzSyDmcw9HrmAGpOOnPzqK6podLWA';

        $.ajax({
            type: "POST",
            url: cors_anywhere_url + "https://api.yelp.com/oauth2/token",
            data: {
                grant_type: 'client_credentials',
                client_id: 'CWLGp_F0hob5KO8sy-ZNww',
                client_secret: '5e5iLrJNv36MR5ks7FAlmH2PVxgrM14dijyXzSyDmcw9HrmAGpOOnPzqK6podLWA'
            },
            }).done(function(response){
                console.log(response);
            }).fail(function(error){
                console.log('sorry error');
            });*/

            /*contentType: 'application/x-www-form-urlencoded',
            dataType: 'jsonp',
            success: function(result){
                console.log('in success');
                console.log(result);
            },
            error: function(){
                window.alert('sorry something went wrong');
            }

        });*/
        console.log(lat);
        console.log(lng);
        //var yelpUrl = "https://api.yelp.com/v3/businesses/search";
        var zomatoUrl = "https://developers.zomato.com/api/v2.1/" +
                        "search?entity_id=280&entity_type=city&cuisines=148"
        $.ajax({
            type: 'GET',
            url: cors_anywhere_url + zomatoUrl,
            headers: {'user_key': '26ce1af09de13709ce7601f27ae5e14d'},
            /*params: {
                entity_id: 280,
                entity_type: 'city',
                cuisines: 148,  //zomato id for Indian cuisine
            },*/
            }).done(function(response){
                console.log(response);
            }).fail(function(){
                console.log("error getting restaurants");

        });
    } //end of getYelpReviews




    function createMarker(point){
        self.showDiv(true);
        //console.log('creating marker');
        var marker = new google.maps.Marker({
            map: map,
            position: point.geometry.location,
            title: point.name,
            animation: google.maps.Animation.DROP,
          });
          //console.log('created marker');
          //console.log(marker);
        // Push the marker to our array of markers.
          markers.push(marker);
          // Create an onclick event to open an infowindow at each marker.
          marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
          });


    } // end of createMarker

    function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
          infowindow.marker = marker;
          infowindow.setContent('<div>' + marker.title + '</div>');
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










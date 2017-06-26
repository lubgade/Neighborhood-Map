var map;
var initialLat = 40.7127837;
var initialLng = -74.00594130000002;
function viewModel(){
    var self = this;
    var place = '';
    var total;
    var place_id;

    var largeInfowindow = new google.maps.InfoWindow({maxwidth: 300});
    var corsAnywhereUrl = 'https://cors-anywhere.herokuapp.com/';
    //var cors_anywhere_url = 'http://localhost:8080/';
    var b = new google.maps.LatLngBounds();
    var z;

    // Create a new blank array for all the listing markers.
    this.showDiv = ko.observable(false);
    this.searchLocation = ko.observable('New York,NY,USA');
    this.filterLocation = ko.observable('');
    this.restaurantList = ko.observableArray([]);
    this.results_found = ko.observable();
    this.pageNumber = ko.observable(0);
    this.visibleDiv = ko.observable(true);


    //restaurant object with all its info
    var restaurant = function(data){
        this.name = data.name;
        this.address = data.location.address;
        this.rating = data.user_rating.aggregate_rating;
        this.averageCost = data.average_cost_for_two;
        this.menuUrl = data.menu_url;
        this.lat = parseFloat(data.location.latitude);
        this.lng = parseFloat(data.location.longitude);
        if(data.thumb){
            this.thumbnail = data.thumb;
        }
        else{
            this.thumbnail = "http://via.placeholder.com/140x100";
        }
    };

    var input = document.getElementById('input_text');
    var options = {
        types: ['(cities)'],
        componentRestrictions: {country: 'us'}
    };
    console.log('autocomplete');
    //set autocomplete for city
    newLocation = new google.maps.places.Autocomplete(input,options);

    //listener for city change
    newLocation.addListener('place_changed', function(){
        console.log('place changed');
        place = newLocation.getPlace();
        console.log(place);
        self.searchLocation(place.formatted_address);
        console.log(self.searchLocation());
        self.results_found(0);
        self.pageNumber(0);
        hideMarkers();
        self.showDiv(false);
        self.restaurantList.removeAll();
        self.processSearchLocation();
    });


    //mobile view
    this.toggleResults = function(){
        self.visibleDiv(!self.visibleDiv());
    }


    // Takes in the selected city to find it's location & further retrieve
    // Zomato place_id
    this.processSearchLocation = function(){
        self.restaurantList.removeAll();
        self.showDiv(true);
        var geocoder = new google.maps.Geocoder();
        var place_name = self.searchLocation();
        if(place_name === ''){
            window.alert('Please select a city');
        }
        else{
            var city = place_name;
            console.log(city);
            geocoder.geocode(
            {
               address: city
            }, function(results, status){
                console.log(results);
                if(status == google.maps.GeocoderStatus.OK){
                    bounds = new google.maps.LatLngBounds();
                    placeBounds = results[0].geometry.bounds;
                    bounds = placeBounds;
                    var newLat = results[0].geometry.location.lat();
                    console.log(newLat);
                    var newLng = results[0].geometry.location.lng();
                    console.log(newLng);
                    var location = new google.maps.LatLng(newLat,newLng);
                    map.setCenter(location);
                    map.setZoom(11);
                    getZomatoCityId(place_name, newLat, newLng);
                }
                else{
                    self.showDiv(false);
                    window.alert('We could not find the place');
                }
            }
            );
        }
    }; //end of processSearchLocation


    self.processSearchLocation();


    //Retrieves Zomato city_id with name of the place & lat/lng.
    //Then retrieve restaurants using the city_id
    function getZomatoCityId(place_name, newLat, newLng){
        var zomatoUrl = "https://developers.zomato.com/api/v2.1/" +
                        "cities?q=";
        $.ajax({
            type: 'GET',
            url: corsAnywhereUrl + zomatoUrl + place_name +
                 "&lat=" + newLat + "&lon=" + newLng + "&count=1",
            headers: {'user_key': '26ce1af09de13709ce7601f27ae5e14d'},
            }).done(function(response){
                console.log(response);
                if(response.location_suggestions.length > 0){
                        var id = response.location_suggestions[0].id;
                        place_id = id;
                }
                else{

                    window.alert("Sorry Zomato cannot find the place_id");
                    return;
                }
                getZomatoRestaurants(place_id);
            }).fail(function(){
                window.alert("error getting place id");
        });
    }


    //Retrieve first 20 restaurants using Zomato city_id
    //Show the restaurants in list view as well as markers on the map
    function getZomatoRestaurants(place_id){
        var zomatoUrl = "https://developers.zomato.com/api/v2.1/" +
                        "search?entity_id=" +
                        place_id + "&entity_type=city&cuisines=148";
        $.ajax({
            type: 'GET',
            url: corsAnywhereUrl + zomatoUrl,
            headers: {'user_key': '26ce1af09de13709ce7601f27ae5e14d'},
            }).done(function(response){
                console.log(response);
                self.results_found(response.results_found);
                showRestaurants(response);
                b = map.getBounds();
                z = map.getZoom();
            }).fail(function(){
                window.alert("error getting restaurants");

        });
    } //end of getZomatoRestaurants_by_id


    //computing the list of restaurants to be shown based on user input
    this.filteredList = ko.computed(function(){
        var filter = self.filterLocation().toLowerCase();
        if(self.filterLocation()){
            console.log('true');
           return ko.utils.arrayFilter(self.restaurantList(),
           function(restaurant){
           if(restaurant.restaurant.name.toLowerCase().indexOf(filter) !== -1){
               return true;
           }
           else{
               restaurant.marker.marker.setVisible(false);
               return false;
           }
           });
        }
        else{

            return self.restaurantList.slice(0);
        }
    }, this);



    //Go to a particular marker & open the infowindow when a restaurant is
    //clicked on the list view
    this.goToMarker = function(clickedRestaurant){
        console.log(clickedRestaurant);
        var name = clickedRestaurant.restaurant.name;
        var address = clickedRestaurant.restaurant.address;
        showMarker(name,address);
    };


    //Find the marker from the markers array to open the marker
    function showMarker(name,address){
        var l = self.restaurantList().length;
        for(var i=0;i<l;i++){
            var rName = self.restaurantList()[i].restaurant.name;
            var position = self.restaurantList()[i].marker.marker.position;
            var rAddress = self.restaurantList()[i].restaurant.address;
            if(name === rName && address === rAddress){
                map.panTo(position);
                map.setZoom(15);
                populateInfoWindow(self.restaurantList()[i].marker.marker,
                                   largeInfowindow,
                                   self.restaurantList()[i].marker.content);
                self.restaurantList()[i].marker.marker.setAnimation(
                                        google.maps.Animation.BOUNCE);

                break;
            }
        }
    }


    //center the map for a page
    function centerMap(){
        map.fitBounds(b);
        map.setZoom(z);
    }


    //clear filter field & show all restaurants on that page by centering the
    //map
    this.clearFilter = function(){
        largeInfowindow.close();
        centerMap();
        self.filterLocation('');
        for(var i=0;i<self.restaurantList().length;i++){
            var m = self.restaurantList()[i].marker.marker;
            m.setAnimation(null);
            m.setVisible(true);
        }
    };


    //Calculate the no of pages to be displayed based on the results found
    //from Zomato API(Zomato only gives max 100 results even if the actual
    //results are more than that)
    this.pageList = ko.computed(function(){
        var count = 0;
        for(var i=20;i<self.results_found();i=i+20){
            if(i%2 === 0 && i<=100){
                count++;
            }
            else{
                break;
            }
        }
        if(count < 5){
            count++;
        }
        return Array.apply(null, {length:count}).map(Number.call, Number);
    },this);


    //go to a particular page of results on the list view & access restaurants
    //for that page
    this.goToPage = function(page){
        self.pageNumber(self.pageList()[page]);
        hideMarkers();
        self.restaurantList.removeAll();
        map.setZoom(11);
        var start = page * 20;
        getAllRestaurants(start);
    };


    //hides all current markers set on the map
    function hideMarkers() {
            var l = self.restaurantList().length;
            console.log(l);
            for (var i = 0; i < l; i++) {
                self.restaurantList()[i].marker.marker.setMap(null);
        }
      }


    //Get all restaurants for a particular page(Zomato provides max 20 results
    //per page) & show results on the map as well as a list view
    function getAllRestaurants(start){
        var zomatoUrl = "https://developers.zomato.com/api/v2.1/" +
                        "search?entity_id=" +
                        place_id + "&entity_type=city&start=" +
                        start + "&cuisines=148";
        $.ajax({
            type: 'GET',
            url: corsAnywhereUrl + zomatoUrl,
            headers: {'user_key': '26ce1af09de13709ce7601f27ae5e14d'},
            }).done(function(response){
                showRestaurants(response);
            }).fail(function(){
                window.alert("error getting restaurants");
        });
    }


    //Store the retrieved results for that page for creating a list view & show
    //them on the map
    function showRestaurants(data){
        bounds = new google.maps.LatLngBounds();
        bounds = placeBounds;
        for(var i=0;i<data.results_shown;i++){
            var r = data.restaurants[i].restaurant;
            var marker = createMarker(r);
            if(marker){
                var newRestaurant = new restaurant(r);
                self.restaurantList.push({restaurant:newRestaurant,marker:marker});
            }
        }
        console.log(bounds);
        if(bounds){
            google.maps.event.addDomListener(window, 'resize', function() {
            map.fitBounds(bounds); 
            });
        }

        b = map.getBounds();
        z = map.getZoom();
    } //end of showRestaurants


    //Create a marker for each restaurant r that is passed.Also create a content
    //string which stores all the restaurant info & push it into the markers
    //array.Also set a listener for each marker
    function createMarker(r){
        self.showDiv(true);
        var position, lat, lng;
        lat = parseFloat(r.location.latitude);
        lng = parseFloat(r.location.longitude);
        position = new google.maps.LatLng(lat, lng);
        /*if(placeBounds.contains(position))
        {*/
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: r.name,
            animation: google.maps.Animation.DROP,
          });
            console.log('true');
            bounds.extend(marker.getPosition());


        var contentString = '<div id="info_window">' +
                             '<img src=' + r.thumb + ' >' +
                            '<h2>' + r.name + '</h2>' +
                            '<p>' + r.location.address + '</p>' +
                            '<p>Average cost for two: $' +
                            r.average_cost_for_two + '</p>' +
                            '<p class="rating">Rating: ' +
                            r.user_rating.aggregate_rating + '</p>' +
                            '<a href=' + r.menu_url + '>' + 'Menu Url</a>';
        var address = r.location.address;

         var newMarker = {marker:marker, content:contentString};

          // Create an onclick event to open an infowindow at each marker.
          marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow, contentString);
          });
          return newMarker;
          //}
    } // end of createMarker


    //Setting an infowindow for the chosen marker.Also set a listener for
    //closing the infowindow
    function populateInfoWindow(marker, infowindow, contentString) {
        infowindow.marker = marker;
        infowindow.setContent(contentString);
        infowindow.open(map, marker);
        map.panBy(10,-120);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick',function(){
            marker.setAnimation(null);
            infowindow.setMarker = null;
            centerMap();
          });
    }


    //Highlight search text
    ko.bindingHandlers.selectOnFocus = {
        update: function(element,allBindings){
            ko.utils.registerEventHandler(element, 'focus', function(e){
                element.select();
            });
        }
    };

}


//Initialize Google map
function initMap(){
        console.log('Initmap');
        map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: initialLat, lng: initialLng},
        zoom: 11,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
            style: google.maps.ZoomControlStyle.SMALL
        },
        scrollwheel: false,
        zoomControl: true
        });
        var newLocation;
        var placeBounds = new google.maps.LatLngBounds();
        var bounds;

        ko.applyBindings(new viewModel());
    }


//Error handling if google maps fail to load
function error(){
    window.alert('Sorry Google maps failed to load. Please try again....');
}











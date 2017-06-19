
function viewModel(){
    var self = this;
    var map;
    var initialLat = 39.8282;
    var initialLng = -98.5795;
    var place = '';
    var newLocation;
    var place_id;
    var total;
    var largeInfowindow = new google.maps.InfoWindow({maxwidth: 300});
    var cors_anywhere_url = 'https://cors-anywhere.herokuapp.com/';
    var bounds = new google.maps.LatLngBounds();
    var b = new google.maps.LatLngBounds;
    var z;

    // Create a new blank array for all the listing markers.
    var markers = [];
    this.showDiv = ko.observable(false);
    selected = ko.observable(false);
    this.searchLocation = ko.observable();
    this.status = ko.observable('');
    this.filterLocation = ko.observable();
    this.restaurantList = ko.observableArray([]);
    this.filteredList = ko.observableArray([]);
    this.results_found = ko.observable();
    this.pageNumber = ko.observable(0);

    //restaurant object with all its info
    var restaurant = function(data){
        this.name = data.name;
        this.address = data.location.address;
        this.rating = data.user_rating.aggregate_rating;
        this.averageCost = data.average_cost_for_two;
        this.menuUrl = data.menu_url;
        this.lat = parseFloat(data.location.latitude);
        this.lng = parseFloat(data.location.longitude);
        this.thumbnail = data.thumb;
    }

    //Initialize Google map
    this.initialize = function(){
        console.log('Initmap');
        map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: initialLat, lng: initialLng},
        zoom: 4,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
            style: google.maps.ZoomControlStyle.SMALL
        },
        scrollwheel: false,
        zoomControl: true
        });

        var input = document.getElementById('input_text');
        var options = {
            types: ['(cities)'],
            componentRestrictions: {country: 'us'}
            };

        //set autocomplete for city
        newLocation = new google.maps.places.Autocomplete(input,options);

        //listener for city change
        newLocation.addListener('place_changed', function(){
                var center = new google.maps.LatLng(initialLat, initialLng);
                map.panTo(center);
                map.setZoom(4);
                place = newLocation.getPlace();
                self.searchLocation(place);
                self.pageNumber(0);
                hideMarkers();
                self.showDiv(false);
                markers = [];
                self.restaurantList.removeAll();
                self.filteredList.removeAll();
                });

        //mobile view
        var menu = document.querySelector('#menu');
        var drawer = document.querySelector('.nav');
        menu.addEventListener('click',function(e){
            drawer.classList.toggle('open');
            e.stopPropagation();
        });
    }; //end of initialize


    // Takes in the selected city to find it's location & further retrieve
    // Zomato place_id
    this.processSearchLocation = function(formElement){
        self.status('Loading....')
        self.showDiv(true);
        var geocoder = new google.maps.Geocoder();
        var place_name = formElement["searchText"].value;
        if(place_name == ''){
            window.alert('Please select a city');
        }
        else{
            var city = place.formatted_address;
            geocoder.geocode(
            {
               address: city
            }, function(results, status){
                //console.log(results);
                if(status == google.maps.GeocoderStatus.OK){
                    map.setCenter(results[0].geometry.location);
                    map.setZoom(11);
                    var newLat = results[0].geometry.location.lat();
                    var newLng = results[0].geometry.location.lng();
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


    //Retrieves Zomato city_id with name of the place & lat/lng.
    //Then retrieve restaurants using the city_id
    function getZomatoCityId(place_name, newLat, newLng){
        var zomatoUrl = "https://developers.zomato.com/api/v2.1/" +
                        "cities?q=";
        $.ajax({
            type: 'GET',
            url: cors_anywhere_url + zomatoUrl + place_name +
                 "&lat=" + newLat + "&lon=" + newLng + "&count=1",
            headers: {'user_key': '26ce1af09de13709ce7601f27ae5e14d'},
            }).done(function(response){
                place_id = response.location_suggestions[0].id;
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
                        place_id + "&entity_type=city&cuisines=148"
        $.ajax({
            type: 'GET',
            url: cors_anywhere_url + zomatoUrl,
            headers: {'user_key': '26ce1af09de13709ce7601f27ae5e14d'},
            }).done(function(response){
                self.results_found(response.results_found);
                self.status('Loading...');
                showRestaurants(response);
                var b = map.getBounds();
                filterLoc();

            }).fail(function(){
                window.alert("error getting restaurants");

        });
    } //end of getZomatoRestaurants_by_id


    //Filter results by name & show corresponding marker
    this.filterResults = function(formElement){
        self.status('filtered result');
        if(self.filterLocation()){
            showMarker(self.filterLocation().text, self.filterLocation().ad);
        }
        else{
            window.alert('Please select a name');
        }
    }


    //Go to a particular marker & open the infowindow when a restaurant is
    //clicked on the list view
    this.goToMarker = function(clickedRestaurant){
        var name = clickedRestaurant.name;
        var address = clickedRestaurant.address;
        showMarker(name,address);
    }


    //Find the marker from the markers array to open the marker
    function showMarker(name,address){
        for(var i=0;i<markers.length;i++){
            if(name == markers[i].marker.title &&
                address == markers[i].address){
                b = map.getBounds();
                z = map.getZoom();
                map.panTo(markers[i].marker.position);
                map.setZoom(15);
                populateInfoWindow(markers[i].marker,largeInfowindow,
                                   markers[i].content);
                markers[i].marker.setAnimation(google.maps.Animation.BOUNCE);
                break;
            }
        }
    }


    //Autocomplete for filtering results by name
    function filterLoc(){
        var list = [];
        for(var i=0;i<self.restaurantList().length;i++){
            list.push({label:self.restaurantList()[i].name,
                       address:self.restaurantList()[i].address});
        }

        $('#filter_text').autocomplete({
            source: list,
            select: function(event,ui){
                        var name = ui.item.label;
                        var ad = ui.item.address;
                        self.filterLocation({text:name,ad:ad});
                        var text = ui.item;
                        if(text != null){
                            for(var i=0;i<list.length;i++){
                                if(text.label == list[i].label &&
                                   text.address == list[i].address){
                                    self.filteredList.removeAll();
                                    self.filteredList.push({name:list[i].label,
                                    address:list[i].address});
                                    break;
                                }
                            }
                        }
                        else{
                            window.alert('please select a name');
                        }
            }
        });
    }


    //clear filter field & show all restaurants on that page by centering the
    //map
    this.clearFilter = function(){
        self.status(total + ' results found');
        largeInfowindow.close();
        centerMap();
        self.filterLocation('');
        self.filteredList.removeAll();
        self.filteredList(self.restaurantList.slice(0));
        for(var i=0;i<markers.length;i++){
            markers[i].marker.setMap(map);
        }
    }


    //Center map for a particular page of restaurants
    function centerMap(){
        var center = map.getCenter();
        var lat = self.searchLocation().geometry.location.lat();
        var lng = self.searchLocation().geometry.location.lng();
        var cityCenter = new google.maps.LatLng(lat, lng);
        if(center != cityCenter){
            //map.panTo(cityCenter);
            map.fitBounds(b);
            map.setZoom(z);
            //map.setZoom(11);
        }
    }


    //Calculate the no of pages to be displayed based on the results found
    //from Zomato API(Zomato only gives max 100 results even if the actual
    //results are more than that)
    this.pageList = ko.computed(function(){
        var count = 0;
        for(var i=20;i<self.results_found();i=i+20){
            if(i%2 == 0 && i<=100){
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
        self.restaurantList.removeAll();
        self.filteredList.removeAll();
        hideMarkers();
        markers = [];
        map.setZoom(11);
        var start = page * 20;
        getAllRestaurants(start);
    }


    //hides all current markers set on the map
    function hideMarkers() {
            for (var i = 0; i < markers.length; i++) {
                markers[i].marker.setMap(null);
        }
      }


    //Get all restaurants for a particular page(Zomato provides max 20 results
    //per page) & show results on the map as well as a list view
    function getAllRestaurants(start){
        var zomatoUrl = "https://developers.zomato.com/api/v2.1/" +
                        "search?entity_id=" +
                        place_id + "&entity_type=city&start=" +
                        start + "&cuisines=148"
        $.ajax({
            type: 'GET',
            url: cors_anywhere_url + zomatoUrl,
            headers: {'user_key': '26ce1af09de13709ce7601f27ae5e14d'},
            }).done(function(response){
                showRestaurants(response);
                filterLoc();

            }).fail(function(){
                window.alert("error getting restaurants");
        });
    }


    //Store the retrieved results for that page for creating a list view & show
    //them on the map
    function showRestaurants(data){
        total = data.results_found;
                if(total > 100){
                    total = 100;
                }
                self.status(total + ' results found...');
                if(total == 0){
                    self.status('Sorry no results');
                }

        for(var i=0;i<data.results_shown;i++){
            var r = data.restaurants[i].restaurant;
            self.restaurantList.push(new restaurant(r));
            createMarker(r);
        }
        map.fitBounds(bounds);
        self.filteredList(self.restaurantList.slice(0));
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
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: r.name,
            animation: google.maps.Animation.DROP,
          });

        bounds.extend(marker.position);

        var contentString = '<div id="infoWindow">' +
                            '<img src=' + r.thumb + ' alt="image">' +
                            '<h2>' + r.name + '</h2>' +
                            '<p>' + r.location.address + '</p>' +
                            '<p>Average cost for two: $' +
                            r.average_cost_for_two + '</p>' +
                            '<p class="rating">Rating: ' +
                            r.user_rating.aggregate_rating + '</p>' +
                            '<a href=' + r.menu_url + '>' + 'Menu Url</a>';
        var address = r.location.address;

        // Push the marker to our array of markers.
          markers.push({marker:marker, content: contentString,
                        address: address});
          // Create an onclick event to open an infowindow at each marker.
          marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow, contentString);
          });
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
            if(!self.filterLocation()){
                centerMap();
            }
          });
    }


    //Highlight search text
    ko.bindingHandlers.selectOnFocus = {
        update: function(element,allBindings){
            ko.utils.registerEventHandler(element, 'focus', function(e){
                element.select();
            });
        }
    }


//Error handling if google maps fail to load
if(typeof google === 'object'){
    google.maps.event.addDomListener(window,'load',this.initialize)
}
else{
    this.handleError('Cannot load the map...Please reload the page');
}

}



ko.applyBindings(new viewModel());










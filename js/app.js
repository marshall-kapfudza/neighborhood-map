var googleSuccess = function() {

  function appViewModel() {
    var self = this, 
    map,
    service,
    infowindow,
    lat = '',
    lng = '',
    favouritePlaces = new google.maps.LatLng(-33.928722, 18.459113),
    markersArray = [];  

    // array to hold info for knockout
    self.allPlaces = ko.observableArray([]);

    // hold search text
    self.searchText = ko.observable('');

    // computed array with places that match the filter
    self.filterPlaces = ko.computed(function() {
      var returnArray = [];

      // hide all markers
      for (var i=0; i<markersArray.length; i++) {
        markersArray[i].setVisible(false);
      }
      for (var j=0,place; j<self.allPlaces().length; j++) {
        place = self.allPlaces()[j];
        if (self.searchText() === '' || place.name.toLowerCase().indexOf(self.searchText()) > -1) {
          // add those places where name contains search text
          returnArray.push(place);
          for(var e = 0; e < markersArray.length; e++) {      
            // makes those markers visible
            if(place.place_id === markersArray[e].place_id) { 
              markersArray[e].setVisible(true);
            }
          }
        }
      }
      return returnArray;
    });
    
    // string to hold foursquare information
    self.foursquareInfo = '';

    // Finds the center of the map to get lat and lng values
    function computeCenter() {
      var latAndLng = map.getCenter();
        lat = latAndLng.lat();
        lng = latAndLng.lng(); 
    }

    
    /*
    Loads the map as well as position the bar and list.  On a search, clearOverlays removes all markers already on the map and removes all info in allPlaces.  Then, once a search is complete, populates more markers and sends the info to getAllPlaces to populate allPlaces again.
    */
    function initialize() {
      map = new google.maps.Map(document.getElementById('map-canvas'), {
      center: favouritePlaces,  
      });
      getPlaces();
      computeCenter(); 
      var input = (document.getElementById('loc-input'));
        map.controls[google.maps.ControlPosition.LEFT_TOP].push(input);      
      var list = (document.getElementById('list'));
        map.controls[google.maps.ControlPosition.LEFT_TOP].push(list);
      var searchBox = new google.maps.places.SearchBox(
        (input));
        google.maps.event.addListener(searchBox, 'places_changed', function() {
      var places = searchBox.getPlaces();
        clearOverlays();
        self.allPlaces.removeAll();
      var bounds = new google.maps.LatLngBounds();  


        for(var i=0, place; i<10; i++){
          if (places[i] !== undefined){
            place = places[i];

            getAllPlaces(place);
            createMarker(place);
            bounds.extend(place.geometry.location);          
          }        
        } 
        map.fitBounds(bounds); 
        computeCenter();                
      });
      google.maps.event.addListener(map, 'bounds_changed', function(){
        var bounds = map.getBounds();
        searchBox.setBounds(bounds);
      });
    }


    /*
    Function to pre-populate the map with place types.  nearbySearch retuns up to 20 places.
    */
    function getPlaces() {
      var request = {
        location: favouritePlaces,
        radius: 600,
        types: ['restaurant', 'bar', 'cafe', 'food']
      };

      infowindow = new google.maps.InfoWindow();
      service = new google.maps.places.PlacesService(map);
      service.nearbySearch(request, callback);    
    }

    /*
    Gets the callback from Google and creates a marker for each place.  Sends info to getAllPlaces.
    */
    function callback(results, status){
      if (status == google.maps.places.PlacesServiceStatus.OK){
        bounds = new google.maps.LatLngBounds();
        results.forEach(function (place){
          place.marker = createMarker(place);
          bounds.extend(new google.maps.LatLng(
            place.geometry.location.lat(),
            place.geometry.location.lng()));
        });
        map.fitBounds(bounds);
        results.forEach(getAllPlaces);                 
      }
    }

    /*
    Function to create a marker at each place.  This is called on load of the map with the pre-populated list, and also after each search.  Also sets the content of each place's infowindow.
    */
    function createMarker(place) {
      var marker = new google.maps.Marker({
        map: map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        name: place.name.toLowerCase(),
        position: place.geometry.location,
        place_id: place.place_id,
        animation: google.maps.Animation.DROP
      });    
      var address;
      if (place.vicinity !== undefined) {
        address = '<b>Vicinity:</b>' + place.vicinity;
      } else if (place.formatted_address !== undefined) {
        address = '<b>Address:</b>' + place.formatted_address;
      }       
      var contentString = '<div class="content"><div style="font-weight: bold">' + place.name + '</div><div>' + address + '</div></div>' + self.foursquareInfo ;

      google.maps.event.addListener(marker, 'click', function() {      
        infowindow.setContent(contentString);      
        infowindow.open(map, this);
        map.panTo(marker.position); 
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){marker.setAnimation(null);}, 1450);
      });

      markersArray.push(marker);
      return marker;
    }

    // Foursquare Credentials
    var clientID = 'VGW53IWWPVNRZBDUNHFW1Z2GQZBHFYIDWOTNA5M2S2AIXFVL';
    var clientSecret = 'URVFRTKS0AWCICYJBGEPFWUHYAU3CTB0SPKCBCVHDB3FG4LL';

    this.getFoursquareInfo = function(point) {
      // creats our foursquare URL
      var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20150321' + '&ll=' +lat+ ',' +lng+ '&query=\'' +point.name +'\'&limit=1';
      $.getJSON(foursquareURL)
        .done(function(response) {
          self.foursquareInfo = '<p><span style="font-weight: bold">Nearby:</span><br>';
          var venue = response.response.venues[0];
          // Name       
          var venueName = venue.name;
              if (venueName !== null && venueName !== undefined) {
                  self.foursquareInfo += 'Name: ' +
                    venueName + '<br>';
              }   
          // Phone Number     
          var phoneNum = venue.contact.formattedPhone;
              if (phoneNum !== null && phoneNum !== undefined) {
                  self.foursquareInfo += 'Phone: ' +
                    phoneNum + '<br>';
              } 
          // Twitter
          var twitterId = venue.contact.twitter;
              if (twitterId !== null && twitterId !== undefined) {
                self.foursquareInfo += 'twitter: @' +
                    twitterId + '<br>';
              } 
        })
        // Fail message for Foursquare API
        .fail(function(error){
          alert("Foursquare API has failed, error details:" + error);
        });
    };  
   
    /*
    Function that will pan to the position and open an info window of an item clicked in the list.
    */
    self.clickMarker = function(place) {
      var marker;

      for(var e = 0; e < markersArray.length; e++) {      
        if(place.place_id === markersArray[e].place_id) { 
          marker = markersArray[e];
          break; 
        }
      } 
      self.getFoursquareInfo(place);         
      map.panTo(marker.position);   

      // waits 300 milliseconds for the getFoursquare async function to finish
      setTimeout(function() {
        var contentString = '<div class="content"><div style="font-weight: bold">' + place.name + '</div><div>' + place.address + '</div>' + '<div>' + self.foursquareInfo + '</div>';
        infowindow.setContent(contentString);
        infowindow.open(map, marker); 
        marker.setAnimation(google.maps.Animation.DROP); 
      }, 500);     
    };


    /*
    function that gets the information from all the places that we are going to search and also pre-populate.  Pushes this info to the allPlaces array for knockout.
    */
    function getAllPlaces(place){
      var myPlace = {};    
      myPlace.place_id = place.place_id;
      myPlace.position = place.geometry.location.toString();
      myPlace.name = place.name;

      var address;    
      if (place.vicinity !== undefined) {
        address = place.vicinity;
      } else if (place.formatted_address !== undefined) {
        address = place.formatted_address;
      }
      myPlace.address = address;
      
      self.allPlaces.push(myPlace);                
    }

    //an observable that retrieves its value when first bound
    ko.onDemandObservable = function(callback, target) {
        var _value = ko.observable();  //private observable

        var result = ko.computed({
            read: function() {
                //if it has not been loaded, execute the supplied function
                if (!result.loaded()) {
                    callback.call(target);
                }
                //always return the current value
                return _value();
            },
            write: function(newValue) {
                //indicate that the value is now loaded and set it
                result.loaded(true);
                _value(newValue);
            },
            deferEvaluation: true  //do not evaluate immediately when created
        });

        //expose the current state, which can be bound against
        result.loaded = ko.observable();
        //load it again
        result.refresh = function() {
            result.loaded(false);
        };

        return result;
    };


    /*
    called after a search, this function clears any markers in the markersArray so that we can start with fresh map with new markers.
    */
    function clearOverlays() {
      for (var i = 0; i < markersArray.length; i++ ) {
       markersArray[i].setMap(null);
      }
      markersArray.length = 0;
    } 

    google.maps.event.addDomListener(window, 'load', initialize);
  }
  $(function(){
    ko.applyBindings(new appViewModel());
  });
}

var googleError = function(e) { 
  alert("It seems Google Maps has failed to load (Try checking internet connection and/or script url)"); 
};
